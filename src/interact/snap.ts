import { footprint } from "@/src/model/geometry";
import type { Point, Rect, Room } from "@/src/model/types";

export const SNAP_TOLERANCE_IN = 3;

/** How close, in screen px, a raw point must be to a candidate before the measure tool snaps to it. */
export const POINT_SNAP_TOLERANCE_PX = 24;

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SnapCandidates {
  /** Standalone points, e.g. item centers, that aren't already covered by a segment. */
  points: Point[];
  /** Wall lines and item edges — snapping targets anywhere along the segment, not just its ends. */
  segments: Segment[];
}

/** Room walls and every item's footprint edges/center — candidates for the measure tool's point-snap, covering whole edges (not just corners). */
export function measureSnapCandidates(room: Pick<Room, "width" | "depth" | "items">): SnapCandidates {
  const points: Point[] = [];
  const segments: Segment[] = [
    { x1: 0, y1: 0, x2: room.width, y2: 0 }, // north wall
    { x1: 0, y1: room.depth, x2: room.width, y2: room.depth }, // south wall
    { x1: 0, y1: 0, x2: 0, y2: room.depth }, // west wall
    { x1: room.width, y1: 0, x2: room.width, y2: room.depth }, // east wall
  ];

  for (const item of room.items) {
    const fp = footprint(item);
    segments.push(
      { x1: fp.x, y1: fp.y, x2: fp.x + fp.w, y2: fp.y },
      { x1: fp.x, y1: fp.y + fp.h, x2: fp.x + fp.w, y2: fp.y + fp.h },
      { x1: fp.x, y1: fp.y, x2: fp.x, y2: fp.y + fp.h },
      { x1: fp.x + fp.w, y1: fp.y, x2: fp.x + fp.w, y2: fp.y + fp.h }
    );
    points.push({ x: fp.x + fp.w / 2, y: fp.y + fp.h / 2 });
  }

  return { points, segments };
}

/** The closest point to `p` that lies on segment `seg` (clamped to its endpoints). */
function closestPointOnSegment(p: Point, seg: Segment): Point {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: seg.x1, y: seg.y1 };
  const t = Math.max(0, Math.min(1, ((p.x - seg.x1) * dx + (p.y - seg.y1) * dy) / lenSq));
  return { x: seg.x1 + t * dx, y: seg.y1 + t * dy };
}

/**
 * Nearest snap target to `point` within `toleranceIn` — a standalone point,
 * or the closest point along a wall/item edge (so snapping works anywhere
 * along an edge, not just at its corners) — or `point` itself if nothing is
 * close enough.
 */
export function snapPoint(point: Point, candidates: SnapCandidates, toleranceIn: number): Point {
  let best = point;
  let bestDist = toleranceIn;

  for (const c of candidates.points) {
    const dist = Math.hypot(point.x - c.x, point.y - c.y);
    if (dist <= bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  for (const seg of candidates.segments) {
    const c = closestPointOnSegment(point, seg);
    const dist = Math.hypot(point.x - c.x, point.y - c.y);
    if (dist <= bestDist) {
      bestDist = dist;
      best = c;
    }
  }

  return best;
}

/**
 * Snap `pos`/`pos + size` against a set of candidate edges (wall lines and
 * other items' edges), all in the same axis. Returns the adjusted position,
 * or the original if nothing is within tolerance. Operates on a single axis
 * so it composes for x and y independently, and works on the item's AABB
 * (footprint), so it is correct regardless of rotation.
 */
function snapAxis(pos: number, size: number, candidates: number[], tolerance: number): number {
  let best = pos;
  let bestDelta = tolerance;

  for (const c of candidates) {
    const startDelta = Math.abs(pos - c);
    if (startDelta <= bestDelta) {
      bestDelta = startDelta;
      best = c;
    }
    const endDelta = Math.abs(pos + size - c);
    if (endDelta <= bestDelta) {
      bestDelta = endDelta;
      best = c - size;
    }
  }

  return best;
}

/**
 * Snap a footprint rect against room walls and other items' footprints.
 * `others` should be the AABB footprints of every other item in the room.
 */
export function snapFootprint(
  rect: Rect,
  roomWidth: number,
  roomHeight: number,
  others: Rect[],
  tolerance: number = SNAP_TOLERANCE_IN
): { x: number; y: number } {
  const xCandidates = [0, roomWidth];
  const yCandidates = [0, roomHeight];

  for (const o of others) {
    xCandidates.push(o.x, o.x + o.w);
    yCandidates.push(o.y, o.y + o.h);
  }

  return {
    x: snapAxis(rect.x, rect.w, xCandidates, tolerance),
    y: snapAxis(rect.y, rect.h, yCandidates, tolerance),
  };
}
