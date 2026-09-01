"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useItemDrag } from "@/src/interact/useDrag";
import type { Room, Units } from "@/src/model/types";
import { useStore } from "@/src/store/useStore";
import { Dimensions } from "./Dimensions";
import { ItemNode } from "./ItemNode";
import { Openings } from "./Openings";
import { RoomShell } from "./RoomShell";
import { computeScale } from "./scale";

interface PlanProps {
  room: Room;
  units: Units;
  issueItemIds: Set<string>;
}

const PLAN_DEFS = (
  <defs>
    <pattern id="floor" width="22" height="22" patternUnits="userSpaceOnUse">
      <rect width="22" height="22" fill="#f7f4ee" />
      <path d="M0 22L22 0M-5 5L5-5M17 27L27 17" stroke="#ede7de" strokeWidth={0.7} opacity={0.55} />
    </pattern>
    <style>{`
      .wall { stroke:#292b2a; stroke-linecap:square; }
      .detail { stroke:#262827; stroke-width:2; fill:none; }
      .swing { stroke:#8b8578; stroke-width:1.25; fill:none; stroke-dasharray:4 3; }
      .slider { stroke:#262827; stroke-width:2; fill:none; }
      .dim { stroke:#242624; stroke-width:1.25; }
      .tick { stroke:#242624; stroke-width:1.25; }
      .dim-text { fill:#222422; font:600 11px Georgia,serif; }
      .label-bg { fill:#fff; opacity:0.85; }
      .item { cursor: grab; }
      .item-label { fill:#222321; font:700 11px Inter,Arial,sans-serif; }
      .item-label.small { font-size: 10px; }
      .item-dims { font-weight:500; font-size:9px; fill:#54524a; }
      .leader { stroke:#8b8578; stroke-width:1; }
      .selection-ring { stroke:#2b6cff; stroke-width:1.5; stroke-dasharray:4 3; }
      .item-issue > g > *:first-child { stroke:#c02626 !important; stroke-width:2.5 !important; }
    `}</style>
  </defs>
);

export function Plan({ room, units, issueItemIds }: PlanProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });

  const selectedItemId = useStore((s) => s.selectedItemId);
  const selectItem = useStore((s) => s.selectItem);
  const deleteItem = useStore((s) => s.deleteItem);
  const rotateItem = useStore((s) => s.rotateItem);

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!selectedItemId) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteItem(selectedItemId);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        rotateItem(selectedItemId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItemId, deleteItem, rotateItem]);

  const scale = computeScale(room, viewport.width, viewport.height);

  const handleBackgroundClick = useCallback(() => selectItem(null), [selectItem]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-0">
      <svg
        ref={svgRef}
        id="plan-svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        onPointerMove={(e) => drag.onPointerMove(e, scale.pxPerInch, scale.originX, scale.originY)}
        onPointerUp={drag.onPointerUp}
        onPointerDown={handleBackgroundClick}
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
            selected={item.id === selectedItemId}
            hasIssue={issueItemIds.has(item.id)}
            onPointerDown={(e) =>
              drag.onPointerDown(e, item, room, scale.pxPerInch, scale.originX, scale.originY)
            }
          />
        ))}
        <Dimensions room={room} scale={scale} units={units} />
      </svg>
    </div>
  );
}
