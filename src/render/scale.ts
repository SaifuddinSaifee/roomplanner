import { roomContentBounds } from "@/src/model/geometry";
import type { Room } from "@/src/model/types";

export interface Scale {
  pxPerInch: number;
  originX: number;
  originY: number;
}

/** Margin reserved around the room, in real-world inches, for dimension lines and labels. */
export const PLAN_MARGIN_IN = 54;

/**
 * Compute a scale and origin that fits `room` — its wall rectangle *and*
 * every item's footprint, since items can be dragged past the walls (loft
 * storage mounted above/beside the room, say) — inside a `viewportWidth` x
 * `viewportHeight` px viewport, with room to spare for dimension lines.
 * Replaces the old fixed `S = 72`, `x0 = 214`, `y0 = 112` constants — a 20ft
 * hall now fits the same way a 9ft bedroom does.
 */
export function computeScale(
  room: Pick<Room, "width" | "depth" | "items">,
  viewportWidth: number,
  viewportHeight: number,
  marginIn: number = PLAN_MARGIN_IN
): Scale {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { pxPerInch: 1, originX: marginIn, originY: marginIn };
  }
  const bounds = roomContentBounds(room);
  const totalW = bounds.w + marginIn * 2;
  const totalH = bounds.h + marginIn * 2;
  const pxPerInch = Math.max(0.001, Math.min(viewportWidth / totalW, viewportHeight / totalH));

  const centerX = bounds.x + bounds.w / 2;
  const centerY = bounds.y + bounds.h / 2;
  const originX = viewportWidth / 2 - centerX * pxPerInch;
  const originY = viewportHeight / 2 - centerY * pxPerInch;

  return { pxPerInch, originX, originY };
}

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4;

/** User-driven view adjustment on top of the auto-fit scale — never persisted with the document. */
export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

export const DEFAULT_VIEW: ViewState = { zoom: 1, panX: 0, panY: 0 };

/**
 * Like `computeScale`, but lets the user zoom/pan on top of the auto-fit
 * baseline. Zooming multiplies the fit `pxPerInch`; panning is a raw px
 * offset added after re-centering, so it reads the same at any zoom level.
 */
export function computeViewScale(
  room: Pick<Room, "width" | "depth" | "items">,
  viewportWidth: number,
  viewportHeight: number,
  view: ViewState,
  marginIn: number = PLAN_MARGIN_IN
): Scale {
  const fit = computeScale(room, viewportWidth, viewportHeight, marginIn);
  const bounds = roomContentBounds(room);
  const pxPerInch = fit.pxPerInch * view.zoom;
  const originX = viewportWidth / 2 - (bounds.x + bounds.w / 2) * pxPerInch + view.panX;
  const originY = viewportHeight / 2 - (bounds.y + bounds.h / 2) * pxPerInch + view.panY;
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
