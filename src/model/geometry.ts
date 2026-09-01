import type { Item, Opening, Rect, Room } from "./types";

/** Axis-aligned bounding box of an item in room-local inches, accounting for rotation. */
export function footprint(item: Item): Rect {
  const rotated = item.rot === 90 || item.rot === 270;
  const w = rotated ? item.d : item.w;
  const h = rotated ? item.w : item.d;
  const cx = item.x + item.w / 2;
  const cy = item.y + item.d / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function rectsOverlap(a: Rect, b: Rect, epsilon = 0): boolean {
  return (
    a.x + a.w > b.x + epsilon &&
    b.x + b.w > a.x + epsilon &&
    a.y + a.h > b.y + epsilon &&
    b.y + b.h > a.y + epsilon
  );
}

export function rectInside(inner: Rect, outer: Rect, epsilon = 1e-6): boolean {
  return (
    inner.x >= outer.x - epsilon &&
    inner.y >= outer.y - epsilon &&
    inner.x + inner.w <= outer.x + outer.w + epsilon &&
    inner.y + inner.h <= outer.y + outer.h + epsilon
  );
}

export function roomRect(room: Room): Rect {
  return { x: 0, y: 0, w: room.width, h: room.depth };
}

/** The opening's location as a segment in room-local plan coordinates (x, y). */
export function openingSegment(
  room: Room,
  opening: Opening
): { x1: number; y1: number; x2: number; y2: number } {
  const { width: W, depth: D } = room;
  switch (opening.wall) {
    case "north":
      return { x1: opening.offset, y1: 0, x2: opening.offset + opening.width, y2: 0 };
    case "south":
      return { x1: opening.offset, y1: D, x2: opening.offset + opening.width, y2: D };
    case "west":
      return { x1: 0, y1: opening.offset, x2: 0, y2: opening.offset + opening.width };
    case "east":
      return { x1: W, y1: opening.offset, x2: W, y2: opening.offset + opening.width };
  }
}

/** Inward-facing unit normal for a wall (points into the room). */
export function wallInwardNormal(wall: Room["openings"][number]["wall"]): { nx: number; ny: number } {
  switch (wall) {
    case "north":
      return { nx: 0, ny: 1 };
    case "south":
      return { nx: 0, ny: -1 };
    case "west":
      return { nx: 1, ny: 0 };
    case "east":
      return { nx: -1, ny: 0 };
  }
}

/** The unit vector an item's front clearance projects toward, derived from rotation. rot 0 = front faces south (+y, "down" on plan). */
export function frontDirection(rot: Item["rot"]): { dx: number; dy: number } {
  switch (rot) {
    case 0:
      return { dx: 0, dy: 1 };
    case 90:
      return { dx: -1, dy: 0 };
    case 180:
      return { dx: 0, dy: -1 };
    case 270:
      return { dx: 1, dy: 0 };
  }
}

/** The clearance zone rect projected off an item's front face. */
export function clearanceRect(item: Item, clearance: number): Rect | null {
  if (clearance <= 0) return null;
  const fp = footprint(item);
  const { dx, dy } = frontDirection(item.rot);
  if (dx === 1) return { x: fp.x + fp.w, y: fp.y, w: clearance, h: fp.h };
  if (dx === -1) return { x: fp.x - clearance, y: fp.y, w: clearance, h: fp.h };
  if (dy === 1) return { x: fp.x, y: fp.y + fp.h, w: fp.w, h: clearance };
  return { x: fp.x, y: fp.y - clearance, w: fp.w, h: clearance };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
