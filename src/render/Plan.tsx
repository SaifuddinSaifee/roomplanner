"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { useItemDrag } from "@/src/interact/useDrag";
import { clamp } from "@/src/model/geometry";
import type { Room, Units } from "@/src/model/types";
import { useStore } from "@/src/store/useStore";
import { Compass } from "./Compass";
import { Dimensions } from "./Dimensions";
import { ItemNode } from "./ItemNode";
import { Openings } from "./Openings";
import { RoomShell } from "./RoomShell";
import { computeScale, computeViewScale, DEFAULT_VIEW, MAX_ZOOM, MIN_ZOOM, type ViewState } from "./scale";

const COMPASS_MARGIN = 40;
const ZOOM_STEP = 1.25;

interface PlanProps {
  room: Room;
  units: Units;
  issueItemIds: Set<string>;
  /** false on the print page: hides zoom/compass-rotate controls, keeps the view static. */
  interactive?: boolean;
}

const PLAN_DEFS = (
  <defs>
    <pattern id="floor" width="22" height="22" patternUnits="userSpaceOnUse">
      <rect width="22" height="22" fill="#f7f4ee" />
      <path d="M0 22L22 0M-5 5L5-5M17 27L27 17" stroke="#ede7de" strokeWidth={0.7} opacity={0.55} />
    </pattern>
    <style>{`
      /* The plan is a diagram, not a document — dragging over an item's
         label text should move the item, not start a native text
         selection. Disabling selection everywhere on the canvas also means
         the cursor we set below is what actually shows, instead of the
         browser's own I-beam winning over selectable text. */
      #plan-svg, #plan-svg * {
        user-select: none;
        -webkit-user-select: none;
      }
      .wall { stroke:#292b2a; stroke-linecap:square; }
      .detail { stroke:#262827; stroke-width:2; fill:none; }
      .swing { stroke:#8b8578; stroke-width:1.25; fill:none; stroke-dasharray:4 3; }
      .slider { stroke:#262827; stroke-width:2; fill:none; }
      .window { stroke:#5b7fa6; stroke-width:2.5; fill:none; }
      .dim { stroke:#242624; stroke-width:1.25; }
      .tick { stroke:#242624; stroke-width:1.25; }
      .dim-text { fill:#222422; font:600 11px Georgia,serif; }
      .label-bg { fill:#fff; opacity:0.85; }
      .item { cursor: grab; }
      .item-label { fill:#222321; font:700 11px Inter,Arial,sans-serif; cursor: move; }
      .item-label.small { font-size: 10px; }
      .item-dims { font-weight:500; font-size:9px; fill:#54524a; cursor: move; }
      .leader { stroke:#8b8578; stroke-width:1; }
      .selection-ring { stroke:#2b6cff; stroke-width:1.5; stroke-dasharray:4 3; }
      .item-issue > g > *:first-child { stroke:#c02626 !important; stroke-width:2.5 !important; }
    `}</style>
  </defs>
);

export function Plan({ room, units, issueItemIds, interactive = true }: PlanProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });
  const [view, setView] = useState<ViewState>(DEFAULT_VIEW);

  const selectedItemIds = useStore((s) => s.selectedItemIds);
  const selectItem = useStore((s) => s.selectItem);
  const toggleItemSelection = useStore((s) => s.toggleItemSelection);
  const deleteSelectedItems = useStore((s) => s.deleteSelectedItems);
  const rotateSelectedItems = useStore((s) => s.rotateSelectedItems);
  const copySelection = useStore((s) => s.copySelection);
  const pasteClipboard = useStore((s) => s.pasteClipboard);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const compassRotation = useStore((s) => s.compassRotation);
  const rotateCompass = useStore((s) => s.rotateCompass);

  const selectedSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);

  const drag = useItemDrag(svgRef);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setViewport({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Switching rooms re-fits the view instead of carrying over a zoom/pan that
  // made sense for a differently-sized room. Adjusting state during render
  // (rather than in an effect) avoids an extra commit — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [viewRoomId, setViewRoomId] = useState(room.id);
  if (room.id !== viewRoomId) {
    setViewRoomId(room.id);
    setView(DEFAULT_VIEW);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "c") {
        if (selectedItemIds.length === 0) return;
        e.preventDefault();
        copySelection();
      } else if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteClipboard();
      } else if (meta && e.key.toLowerCase() === "d") {
        if (selectedItemIds.length === 0) return;
        e.preventDefault();
        duplicateSelection();
      } else if (!meta && (e.key === "Delete" || e.key === "Backspace")) {
        if (selectedItemIds.length === 0) return;
        e.preventDefault();
        deleteSelectedItems();
      } else if (!meta && (e.key === "r" || e.key === "R")) {
        if (selectedItemIds.length === 0) return;
        e.preventDefault();
        rotateSelectedItems();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItemIds, deleteSelectedItems, rotateSelectedItems, copySelection, pasteClipboard, duplicateSelection]);

  const scale = interactive
    ? computeViewScale(room, viewport.width, viewport.height, view)
    : computeScale(room, viewport.width, viewport.height);

  const zoomByFactor = useCallback((factor: number) => {
    setView((prev) => ({ ...prev, zoom: clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM) }));
  }, []);
  const resetView = useCallback(() => setView(DEFAULT_VIEW), []);

  // Mouse-wheel zoom, centered on the cursor: the inches-point under the
  // pointer stays under the pointer as pxPerInch changes. This has to be a
  // native (non-passive) listener — React attaches its synthetic `onWheel`
  // as passive, so e.preventDefault() there throws instead of stopping the
  // page from scrolling while the user zooms the canvas.
  useEffect(() => {
    if (!interactive) return;
    const svg = svgRef.current;
    if (!svg) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = svg!.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);

      setView((prev) => {
        const newZoom = clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        if (newZoom === prev.zoom) return prev;
        const fit = computeScale(room, viewport.width, viewport.height);
        const oldScale = computeViewScale(room, viewport.width, viewport.height, prev);
        const inchesX = (px - oldScale.originX) / oldScale.pxPerInch;
        const inchesY = (py - oldScale.originY) / oldScale.pxPerInch;

        const newPxPerInch = fit.pxPerInch * newZoom;
        const baseOriginX = viewport.width / 2 - (room.width / 2) * newPxPerInch;
        const baseOriginY = viewport.height / 2 - (room.depth / 2) * newPxPerInch;
        return {
          zoom: newZoom,
          panX: px - baseOriginX - inchesX * newPxPerInch,
          panY: py - baseOriginY - inchesY * newPxPerInch,
        };
      });
    }

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [interactive, room, viewport]);

  // Background pointer handling does double duty: a plain click with no
  // movement clears the selection (unchanged behavior); a drag pans the
  // view. Item pointerdowns stopPropagation before this ever fires.
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(
    null
  );

  const handleBackgroundPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!interactive) {
        selectItem(null);
        return;
      }
      panRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, panX: view.panX, panY: view.panY, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [interactive, selectItem, view.panX, view.panY]
  );

  const handleBackgroundPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const pan = panRef.current;
      if (pan && e.pointerId === pan.pointerId) {
        const dx = e.clientX - pan.startX;
        const dy = e.clientY - pan.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) pan.moved = true;
        if (pan.moved) setView((prev) => ({ ...prev, panX: pan.panX + dx, panY: pan.panY + dy }));
      }
      drag.onPointerMove(e, scale.pxPerInch, scale.originX, scale.originY);
    },
    [drag, scale.pxPerInch, scale.originX, scale.originY]
  );

  const handleBackgroundPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const pan = panRef.current;
      if (pan && e.pointerId === pan.pointerId) {
        if (!pan.moved) selectItem(null);
        panRef.current = null;
      }
      drag.onPointerUp(e);
    },
    [drag, selectItem]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-0 rounded-xl border border-line overflow-hidden">
      <svg
        ref={svgRef}
        id="plan-svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={handleBackgroundPointerUp}
        onPointerDown={handleBackgroundPointerDown}
        style={{ cursor: interactive ? "grab" : "default", touchAction: "none" }}
        role="img"
        aria-label={`Floor plan of ${room.name}`}
      >
        {PLAN_DEFS}
        <rect x={0} y={0} width={viewport.width} height={viewport.height} fill="#ffffff" />
        <RoomShell room={room} scale={scale} />
        <Openings room={room} scale={scale} />
        {room.items.map((item) => (
          <ItemNode
            key={item.id}
            item={item}
            scale={scale}
            units={units}
            selected={selectedSet.has(item.id)}
            hasIssue={issueItemIds.has(item.id)}
            onPointerDown={(e: ReactPointerEvent<SVGGElement>) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                // Shift/Cmd/Ctrl-click adds or removes this item from the
                // selection without moving anything — a plain click is what
                // starts a drag, so multi-select and drag never fight.
                e.stopPropagation();
                toggleItemSelection(item.id);
                return;
              }
              drag.onPointerDown(e, item, room, scale.pxPerInch, scale.originX, scale.originY, selectedItemIds);
            }}
          />
        ))}
        <Dimensions room={room} scale={scale} units={units} />
        <Compass
          x={COMPASS_MARGIN}
          y={viewport.height - COMPASS_MARGIN}
          rotation={compassRotation}
          interactive={interactive}
          onRotate={rotateCompass}
        />
      </svg>
      {interactive && (
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg border border-line bg-panel/95 px-1.5 py-1 text-ink shadow-sm">
          <button
            className="h-6 w-6 rounded-md text-sm font-semibold hover:bg-accent-soft disabled:opacity-30"
            onClick={() => zoomByFactor(1 / ZOOM_STEP)}
            disabled={view.zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-10 text-center text-xs font-semibold text-muted">{Math.round(view.zoom * 100)}%</span>
          <button
            className="h-6 w-6 rounded-md text-sm font-semibold hover:bg-accent-soft disabled:opacity-30"
            onClick={() => zoomByFactor(ZOOM_STEP)}
            disabled={view.zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
          <div className="mx-1 h-4 w-px bg-line" />
          <button
            className="rounded-md px-1.5 py-0.5 text-xs font-semibold hover:bg-accent-soft"
            onClick={resetView}
            title="Reset zoom and pan"
          >
            Fit
          </button>
        </div>
      )}
    </div>
  );
}
