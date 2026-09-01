import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import { footprint } from "@/src/model/geometry";
import type { Item, Room } from "@/src/model/types";
import { useStore } from "@/src/store/useStore";
import { snapFootprint } from "./snap";

interface DragState {
  pointerId: number;
  itemId: string;
  /** Offset from the item's footprint top-left to the pointer, in inches, at drag start. */
  grabDx: number;
  grabDy: number;
  others: ReturnType<typeof footprint>[];
  room: Room;
}

/**
 * Pointer-driven drag for a single item on the plan SVG. Coordinates are
 * converted from client space to plan-local inches via the SVG's own CTM, so
 * this stays correct regardless of the current zoom/scale.
 */
export function useItemDrag(svgRef: RefObject<SVGSVGElement | null>) {
  const dragRef = useRef<DragState | null>(null);
  const dragItemTo = useStore((s) => s.dragItemTo);
  const beginDrag = useStore((s) => s.beginDrag);
  const endDrag = useStore((s) => s.endDrag);
  const selectItem = useStore((s) => s.selectItem);

  const clientToInches = useCallback(
    (clientX: number, clientY: number, pxPerInch: number, originX: number, originY: number) => {
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

  const onPointerDown = useCallback(
    (
      e: ReactPointerEvent<SVGGElement>,
      item: Item,
      room: Room,
      pxPerInch: number,
      originX: number,
      originY: number
    ) => {
      e.stopPropagation();
      selectItem(item.id);

      const pointerInches = clientToInches(e.clientX, e.clientY, pxPerInch, originX, originY);
      const fp = footprint(item);

      dragRef.current = {
        pointerId: e.pointerId,
        itemId: item.id,
        grabDx: pointerInches.x - fp.x,
        grabDy: pointerInches.y - fp.y,
        others: room.items.filter((it) => it.id !== item.id).map(footprint),
        room,
      };

      beginDrag();
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [beginDrag, clientToInches, selectItem]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>, pxPerInch: number, originX: number, originY: number) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      const pointerInches = clientToInches(e.clientX, e.clientY, pxPerInch, originX, originY);
      const rawX = pointerInches.x - drag.grabDx;
      const rawY = pointerInches.y - drag.grabDy;

      const item = drag.room.items.find((it) => it.id === drag.itemId);
      if (!item) return;
      const rawFp = footprint({ ...item, x: rawX, y: rawY });

      const snapped = snapFootprint(rawFp, drag.room.width, drag.room.depth, drag.others);

      // Invert footprint -> item position: center is preserved, item.w/d are unrotated.
      const centerX = snapped.x + rawFp.w / 2;
      const centerY = snapped.y + rawFp.h / 2;
      const x = Math.round(centerX - item.w / 2);
      const y = Math.round(centerY - item.d / 2);

      dragItemTo(drag.itemId, x, y);
    },
    [clientToInches, dragItemTo]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      endDrag();
    },
    [endDrag]
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
