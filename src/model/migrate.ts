import { makeDefaultHome } from "./defaults";
import type { Home, Item, Opening, Room, Rotation, Units, Wall } from "./types";

const WALLS: Wall[] = ["north", "east", "south", "west"];
const ROTATIONS: Rotation[] = [0, 90, 180, 270];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceOpening(raw: unknown, index: number): Opening | null {
  if (!isRecord(raw)) return null;
  const wall = WALLS.includes(raw.wall as Wall) ? (raw.wall as Wall) : null;
  const offset = Number(raw.offset);
  const width = Number(raw.width);
  if (!wall || !Number.isFinite(offset) || !Number.isFinite(width) || width <= 0) return null;
  const validKinds = ["door", "sliding", "window", "opening"];
  const kind = validKinds.includes(raw.kind as string) ? (raw.kind as Opening["kind"]) : "door";
  return {
    id: typeof raw.id === "string" ? raw.id : `opening-${index}`,
    wall,
    offset: Math.round(offset),
    width: Math.round(width),
    kind,
  };
}

function coerceItem(raw: unknown, index: number): Item | null {
  if (!isRecord(raw)) return null;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const w = Number(raw.w);
  const d = Number(raw.d);
  if (![x, y, w, d].every(Number.isFinite) || w <= 0 || d <= 0) return null;
  const rot = ROTATIONS.includes(raw.rot as Rotation) ? (raw.rot as Rotation) : 0;
  return {
    id: typeof raw.id === "string" ? raw.id : `item-${index}`,
    catalog: typeof raw.catalog === "string" ? raw.catalog : "coffee_table",
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    d: Math.round(d),
    rot,
    label: typeof raw.label === "string" ? raw.label : undefined,
  };
}

function coerceRoom(raw: unknown, index: number): Room | null {
  if (!isRecord(raw)) return null;
  const width = Number(raw.width);
  const depth = Number(raw.depth);
  if (!Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0) return null;

  const openings = Array.isArray(raw.openings)
    ? raw.openings.map(coerceOpening).filter((o): o is Opening => o !== null)
    : [];
  const items = Array.isArray(raw.items)
    ? raw.items.map(coerceItem).filter((i): i is Item => i !== null)
    : [];

  const validTypes = ["hall", "bedroom", "kitchen", "bathroom", "balcony", "other"];
  const type = validTypes.includes(raw.type as string) ? (raw.type as Room["type"]) : "other";

  return {
    id: typeof raw.id === "string" ? raw.id : `room-${index}`,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : `Room ${index + 1}`,
    type,
    width: Math.round(width),
    depth: Math.round(depth),
    openings,
    items,
  };
}

/**
 * Validate and repair an arbitrary JSON value into a Home. Unrecognized or
 * malformed fields fall back to sane defaults rather than throwing, so a
 * hand-edited or partially corrupted import still loads.
 */
export function migrate(raw: unknown): Home {
  if (!isRecord(raw)) return makeDefaultHome();

  const units: Units = raw.units === "mm" ? "mm" : "ft";
  const rooms = Array.isArray(raw.rooms)
    ? raw.rooms.map(coerceRoom).filter((r): r is Room => r !== null)
    : [];

  if (rooms.length === 0) return makeDefaultHome();

  return {
    version: 1,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "My home",
    units,
    rooms,
  };
}
