import { catalogEntry } from "@/src/catalog/items";
import { clearanceRect, footprint, rectInside, rectsOverlap, roomRect } from "@/src/model/geometry";
import type { Item, Opening, Rect, Room } from "@/src/model/types";

export type IssueSeverity = "error" | "warning";

export interface Issue {
  id: string;
  ruleId: "overlap" | "out-of-bounds" | "blocks-opening" | "clearance" | "walkway";
  severity: IssueSeverity;
  message: string;
  itemIds: string[];
}

const OVERLAP_EPSILON = 0.5; // inches
const DOOR_SWING_THRESHOLD = 6; // inches, for sliding/opening kinds
const WALKWAY_MIN_WIDTH = 30; // inches (2.5 ft)
const GRID_STEP = 3; // inches

function itemName(item: Item): string {
  return item.label ?? catalogEntry(item.catalog)?.name ?? item.catalog;
}

function checkOverlaps(room: Room): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < room.items.length; i++) {
    for (let j = i + 1; j < room.items.length; j++) {
      const a = room.items[i];
      const b = room.items[j];
      if (rectsOverlap(footprint(a), footprint(b), OVERLAP_EPSILON)) {
        issues.push({
          id: `overlap-${a.id}-${b.id}`,
          ruleId: "overlap",
          severity: "error",
          message: `${itemName(a)} overlaps ${itemName(b)}.`,
          itemIds: [a.id, b.id],
        });
      }
    }
  }
  return issues;
}

function checkBounds(room: Room): Issue[] {
  const bounds = roomRect(room);
  const issues: Issue[] = [];
  for (const item of room.items) {
    if (!rectInside(footprint(item), bounds)) {
      issues.push({
        id: `bounds-${item.id}`,
        ruleId: "out-of-bounds",
        severity: "error",
        message: `${itemName(item)} extends past a wall.`,
        itemIds: [item.id],
      });
    }
  }
  return issues;
}

/** The swept region an opening needs clear: a door's quarter-disc swing, or a threshold band for sliding/fixed openings. */
function openingClearZone(room: Room, opening: Opening): Rect {
  const inset = opening.kind === "door" ? opening.width : DOOR_SWING_THRESHOLD;
  switch (opening.wall) {
    case "north":
      return { x: opening.offset, y: 0, w: opening.width, h: inset };
    case "south":
      return { x: opening.offset, y: room.depth - inset, w: opening.width, h: inset };
    case "west":
      return { x: 0, y: opening.offset, w: inset, h: opening.width };
    case "east":
      return { x: room.width - inset, y: opening.offset, w: inset, h: opening.width };
  }
}

function checkOpenings(room: Room): Issue[] {
  const issues: Issue[] = [];
  for (const opening of room.openings) {
    const zone = openingClearZone(room, opening);
    for (const item of room.items) {
      if (rectsOverlap(footprint(item), zone)) {
        issues.push({
          id: `opening-${opening.id}-${item.id}`,
          ruleId: "blocks-opening",
          severity: "error",
          message: `${itemName(item)} blocks the ${opening.kind} on the ${opening.wall} wall.`,
          itemIds: [item.id],
        });
      }
    }
  }
  return issues;
}

function checkClearance(room: Room): Issue[] {
  const issues: Issue[] = [];
  const bounds = roomRect(room);
  for (const item of room.items) {
    const entry = catalogEntry(item.catalog);
    if (!entry || entry.clearance <= 0) continue;
    const zone = clearanceRect(item, entry.clearance);
    if (!zone) continue;

    if (!rectInside(zone, bounds)) {
      issues.push({
        id: `clearance-wall-${item.id}`,
        ruleId: "clearance",
        severity: "warning",
        message: `${itemName(item)} needs ${entry.clearance}" clearance in front, but the wall is closer than that.`,
        itemIds: [item.id],
      });
      continue;
    }

    for (const other of room.items) {
      if (other.id === item.id) continue;
      if (rectsOverlap(zone, footprint(other), OVERLAP_EPSILON)) {
        issues.push({
          id: `clearance-${item.id}-${other.id}`,
          ruleId: "clearance",
          severity: "warning",
          message: `${itemName(other)} sits inside the clearance zone in front of ${itemName(item)}.`,
          itemIds: [item.id, other.id],
        });
      }
    }
  }
  return issues;
}

/** Rasterize free floor on a grid and BFS between openings; flag when doors aren't mutually reachable through a corridor at least WALKWAY_MIN_WIDTH wide. */
function checkWalkway(room: Room): Issue[] {
  if (room.openings.length < 2) return [];

  const cols = Math.max(1, Math.floor(room.width / GRID_STEP));
  const rows = Math.max(1, Math.floor(room.depth / GRID_STEP));
  const radiusCells = Math.ceil(WALKWAY_MIN_WIDTH / 2 / GRID_STEP);

  const blocked = new Uint8Array(cols * rows);
  const footprints = room.items.map(footprint);

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const cellRect: Rect = { x: cx * GRID_STEP, y: cy * GRID_STEP, w: GRID_STEP, h: GRID_STEP };
      // A cell is walkable only if a full corridor-radius square around its
      // center clears every piece of furniture — an approximation of "a
      // WALKWAY_MIN_WIDTH corridor can pass through here". Deliberately not
      // checked against room bounds: a corridor is allowed to run flush
      // along a wall (and a doorway sits ON the wall by definition), so only
      // furniture narrows it, not the walls themselves.
      const probe: Rect = {
        x: cellRect.x - radiusCells * GRID_STEP,
        y: cellRect.y - radiusCells * GRID_STEP,
        w: GRID_STEP + 2 * radiusCells * GRID_STEP,
        h: GRID_STEP + 2 * radiusCells * GRID_STEP,
      };
      const blockedByFurniture = footprints.some((fp) => rectsOverlap(probe, fp));
      blocked[cy * cols + cx] = blockedByFurniture ? 1 : 0;
    }
  }

  function cellsForOpening(opening: Opening): [number, number][] {
    const zone = openingClearZone(room, opening);
    const cells: [number, number][] = [];
    const x0 = Math.max(0, Math.floor(zone.x / GRID_STEP));
    const x1 = Math.min(cols - 1, Math.ceil((zone.x + zone.w) / GRID_STEP));
    const y0 = Math.max(0, Math.floor(zone.y / GRID_STEP));
    const y1 = Math.min(rows - 1, Math.ceil((zone.y + zone.h) / GRID_STEP));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!blocked[y * cols + x]) cells.push([x, y]);
      }
    }
    return cells;
  }

  function reachable(start: [number, number][]): Set<number> {
    const seen = new Set<number>();
    const queue: [number, number][] = [...start];
    for (const [x, y] of start) seen.add(y * cols + x);
    while (queue.length) {
      const [x, y] = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const idx = ny * cols + nx;
        if (blocked[idx] || seen.has(idx)) continue;
        seen.add(idx);
        queue.push([nx, ny]);
      }
    }
    return seen;
  }

  const issues: Issue[] = [];
  for (let i = 0; i < room.openings.length; i++) {
    const startCells = cellsForOpening(room.openings[i]);
    if (startCells.length === 0) continue;
    const reach = reachable(startCells);
    for (let j = i + 1; j < room.openings.length; j++) {
      const targetCells = cellsForOpening(room.openings[j]);
      const connected = targetCells.some(([x, y]) => reach.has(y * cols + x));
      if (!connected && targetCells.length > 0) {
        issues.push({
          id: `walkway-${room.openings[i].id}-${room.openings[j].id}`,
          ruleId: "walkway",
          severity: "warning",
          message: `No ${WALKWAY_MIN_WIDTH / 12}ft-wide walkway between the ${room.openings[i].wall} and ${room.openings[j].wall} openings.`,
          itemIds: [],
        });
      }
    }
  }
  return issues;
}

export function validateRoom(room: Room): Issue[] {
  return [
    ...checkOverlaps(room),
    ...checkBounds(room),
    ...checkOpenings(room),
    ...checkClearance(room),
    ...checkWalkway(room),
  ];
}
