import { useCallback, useState } from "react";
import type { RefObject } from "react";

import type { Point, Room } from "@/src/model/types";
import { measureSnapCandidates, POINT_SNAP_TOLERANCE_PX, snapPoint } from "./snap";

export type MeasurePoint = Point;

interface PointerLike {
  clientX: number;
  clientY: number;
  shiftKey?: boolean;
}

type MeasureRoom = Pick<Room, "width" | "depth" | "items">;

const EIGHT_DIR_STEP = Math.PI / 4;

/** Projects `point` onto the nearest of the 8 compass directions from `anchor`, keeping the same distance. */
function constrainToEightDirections(anchor: Point, point: Point): Point {
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return point;
  const angle = Math.round(Math.atan2(dy, dx) / EIGHT_DIR_STEP) * EIGHT_DIR_STEP;
  return { x: anchor.x + Math.cos(angle) * dist, y: anchor.y + Math.sin(angle) * dist };
}

/**
 * Click-click distance tool: toggle it on, click a first point, move the
 * mouse to see a live rubber-band line and distance readout, click a second
 * point to lock the measurement in place. Clicking again after a lock starts
 * a fresh measurement from that new point. Entirely view state — never
 * touches room data, and (like `compassRotation`) is not persisted.
 *
 * Points snap to walls, item edges (anywhere along them, not just corners),
 * and item centers, within `POINT_SNAP_TOLERANCE_PX`. Holding Shift while a
 * first point is set additionally constrains the line to the 8 compass
 * directions from that anchor — applied on top of the snapped point, not
 * instead of it, so a straight measurement can still land exactly on a
 * nearby wall/edge/center.
 */
export function useMeasureTool(svgRef: RefObject<SVGSVGElement | null>) {
  const [active, setActive] = useState(false);
  const [anchor, setAnchor] = useState<Point | null>(null);
  const [live, setLive] = useState<Point | null>(null);
  const [locked, setLocked] = useState(false);

  const clientToInches = useCallback(
    (clientX: number, clientY: number, pxPerInch: number, originX: number, originY: number): Point => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const inverse = ctm.inverse();
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const local = pt.matrixTransform(inverse);
      return { x: (local.x - originX) / pxPerInch, y: (local.y - originY) / pxPerInch };
    },
    [svgRef]
  );

  const resolvePoint = useCallback(
    (
      e: PointerLike,
      pxPerInch: number,
      originX: number,
      originY: number,
      room: MeasureRoom,
      currentAnchor: Point | null
    ): Point => {
      const raw = clientToInches(e.clientX, e.clientY, pxPerInch, originX, originY);
      const toleranceIn = POINT_SNAP_TOLERANCE_PX / pxPerInch;
      const snapped = snapPoint(raw, measureSnapCandidates(room), toleranceIn);
      // Shift constrains the *angle* on top of the snap, not instead of it —
      // snapping still pulls the point onto a wall/edge/center, Shift just
      // additionally locks the resulting line to the nearest 8th of a turn.
      if (currentAnchor && e.shiftKey) return constrainToEightDirections(currentAnchor, snapped);
      return snapped;
    },
    [clientToInches]
  );

  const reset = useCallback(() => {
    setAnchor(null);
    setLive(null);
    setLocked(false);
  }, []);

  const toggle = useCallback(() => {
    setActive((prev) => !prev);
    reset();
  }, [reset]);

  /** Returns true if the click was consumed as a measurement click, so callers can skip their normal pointerdown handling. */
  const handlePointerDown = useCallback(
    (e: PointerLike, pxPerInch: number, originX: number, originY: number, room: MeasureRoom): boolean => {
      if (!active) return false;
      if (!anchor || locked) {
        const point = resolvePoint(e, pxPerInch, originX, originY, room, null);
        setAnchor(point);
        setLive(point);
        setLocked(false);
      } else {
        setLive(resolvePoint(e, pxPerInch, originX, originY, room, anchor));
        setLocked(true);
      }
      return true;
    },
    [active, anchor, locked, resolvePoint]
  );

  const handlePointerMove = useCallback(
    (e: PointerLike, pxPerInch: number, originX: number, originY: number, room: MeasureRoom) => {
      if (!active || !anchor || locked) return;
      setLive(resolvePoint(e, pxPerInch, originX, originY, room, anchor));
    },
    [active, anchor, locked, resolvePoint]
  );

  return { active, anchor, live, locked, toggle, reset, handlePointerDown, handlePointerMove };
}
