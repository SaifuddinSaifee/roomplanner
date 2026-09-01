import type { Room } from "@/src/model/types";

export interface Scale {
  pxPerInch: number;
  originX: number;
  originY: number;
}

/** Margin reserved around the room, in real-world inches, for dimension lines and labels. */
export const PLAN_MARGIN_IN = 54;

/**
 * Compute a scale and origin that fits `room` inside a `viewportWidth` x
 * `viewportHeight` px viewport, with room to spare for dimension lines.
 * Replaces the old fixed `S = 72`, `x0 = 214`, `y0 = 112` constants — a 20ft
 * hall now fits the same way a 9ft bedroom does.
 */
export function computeScale(
  room: Pick<Room, "width" | "depth">,
  viewportWidth: number,
  viewportHeight: number,
  marginIn: number = PLAN_MARGIN_IN
): Scale {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { pxPerInch: 1, originX: marginIn, originY: marginIn };
  }
  const totalW = room.width + marginIn * 2;
  const totalH = room.depth + marginIn * 2;
  const pxPerInch = Math.max(0.001, Math.min(viewportWidth / totalW, viewportHeight / totalH));

  const originX = (viewportWidth - room.width * pxPerInch) / 2;
  const originY = (viewportHeight - room.depth * pxPerInch) / 2;

  return { pxPerInch, originX, originY };
}

export function toPxX(inches: number, scale: Scale): number {
  return scale.originX + inches * scale.pxPerInch;
}

export function toPxY(inches: number, scale: Scale): number {
  return scale.originY + inches * scale.pxPerInch;
}

export function toPxLen(inches: number, scale: Scale): number {
  return inches * scale.pxPerInch;
}

export function toInches(px: number, originPx: number, scale: Scale): number {
  return (px - originPx) / scale.pxPerInch;
}
