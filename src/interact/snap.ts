import type { Rect } from "@/src/model/types";

export const SNAP_TOLERANCE_IN = 3;

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
