import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import { footprint } from "@/src/model/geometry";
import type { Item, Rect, Room } from "@/src/model/types";
import { useStore } from "@/src/store/useStore";
import { snapFootprint } from "./snap";

interface DragState {
  pointerId: number;
  /** The item actually grabbed — its footprint drives snapping for the whole group. */
  anchorItemId: string;
  /** Offset from the anchor's footprint top-left to the pointer, in inches, at drag start. */
  grabDx: number;
  grabDy: number;
  /** Snap candidates: footprints of every item NOT being moved by this drag. */
  others: Rect[];
  room: Room;
  /** Starting x/y of every item this drag moves (the anchor plus, for a group drag, the rest of the selection). */
  groupInitial: Map<string, { x: number; y: number }>;
}

/**
 * Pointer-driven drag for one item, or — when the grabbed item is part of an
 * active multi-selection — the whole selection as a rigid group. Coordinates
 * are converted from client space to plan-local inches via the SVG's own
 * CTM, so this stays correct regardless of the current zoom/scale.
 *
 * Group dragging works by tracking the anchor's own delta (computed the same
 * way single-item dragging always has, snapping included) and applying that
 * same delta to every other selected item's own starting position — so the
 * group moves as a rigid body, snapping only through the one item you
 * actually grabbed, against walls and items outside the group.
 */
export function useItemDrag(svgRef: RefObject<SVGSVGElement | null>) {
  const dragRef = useRef<DragState | null>(null);
  const dragItemsTo = useStore((s) => s.dragItemsTo);
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
      originY: number,
      selectedItemIds: string[]
    ) => {
      e.stopPropagation();

      // Grabbing an item that's already part of a multi-selection moves the
      // whole group; grabbing anything else resets the selection to just
      // that item, exactly like before.
      const isGroupDrag = selectedItemIds.length > 1 && selectedItemIds.includes(item.id);
      if (!isGroupDrag) selectItem(item.id);
      const movingIds = isGroupDrag ? selectedItemIds : [item.id];

      const pointerInches = clientToInches(e.clientX, e.clientY, pxPerInch, originX, originY);
      const fp = footprint(item);

      const movingSet = new Set(movingIds);
      const groupInitial = new Map(
        room.items.filter((it) => movingSet.has(it.id)).map((it) => [it.id, { x: it.x, y: it.y }])
      );

      dragRef.current = {
        pointerId: e.pointerId,
        anchorItemId: item.id,
        grabDx: pointerInches.x - fp.x,
        grabDy: pointerInches.y - fp.y,
        others: room.items.filter((it) => !movingSet.has(it.id)).map(footprint),
        room,
        groupInitial,
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

      const anchor = drag.room.items.find((it) => it.id === drag.anchorItemId);
      if (!anchor) return;
      const rawFp = footprint({ ...anchor, x: rawX, y: rawY });

      const snapped = snapFootprint(rawFp, drag.room.width, drag.room.depth, drag.others);

      // Invert footprint -> item position: center is preserved, item.w/d are unrotated.
      const centerX = snapped.x + rawFp.w / 2;
      const centerY = snapped.y + rawFp.h / 2;
      const anchorX = Math.round(centerX - anchor.w / 2);
      const anchorY = Math.round(centerY - anchor.d / 2);

      const anchorInitial = drag.groupInitial.get(drag.anchorItemId)!;
      const deltaX = anchorX - anchorInitial.x;
      const deltaY = anchorY - anchorInitial.y;

      const positions = Array.from(drag.groupInitial, ([id, init]) => ({
        id,
        x: init.x + deltaX,
        y: init.y + deltaY,
      }));

      dragItemsTo(positions);
    },
    [clientToInches, dragItemsTo]
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
