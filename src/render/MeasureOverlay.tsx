"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

import type { MeasurePoint } from "@/src/interact/useMeasure";
import type { Units } from "@/src/model/types";
import { formatLength } from "@/src/model/units";
import { toPxX, toPxY, type Scale } from "./scale";

const COLOR = "#e0862c";
const CHAR_W = 6.8;
const PAD_X = 10;
const BOX_H = 22;
const CLOSE_W = 20;

interface MeasureOverlayProps {
  anchor: MeasurePoint;
  live: MeasurePoint;
  locked: boolean;
  scale: Scale;
  units: Units;
  onClear: () => void;
}

/**
 * The measure tool's live rubber-band line (while the second point hasn't
 * been clicked yet) or locked, finalized measurement — a line between the
 * two points plus a floating "tooltip" label with the distance, mirroring
 * the click-click contract in `useMeasureTool`.
 */
export function MeasureOverlay({ anchor, live, locked, scale, units, onClear }: MeasureOverlayProps) {
  const x1 = toPxX(anchor.x, scale);
  const y1 = toPxY(anchor.y, scale);
  const x2 = toPxX(live.x, scale);
  const y2 = toPxY(live.y, scale);

  const distanceIn = Math.hypot(live.x - anchor.x, live.y - anchor.y);
  const label = formatLength(distanceIn, units);

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const closeW = locked ? CLOSE_W : 0;
  const boxW = label.length * CHAR_W + PAD_X * 2 + closeW;
  const boxX = mx - boxW / 2;

  return (
    <g aria-label="Measurement">
      <g pointerEvents="none">
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLOR} strokeWidth={1.5} strokeDasharray="5 3" />
        <circle cx={x1} cy={y1} r={3.5} fill={COLOR} />
        <circle cx={x2} cy={y2} r={3.5} fill={COLOR} />
        <rect x={boxX} y={my - BOX_H / 2} width={boxW} height={BOX_H} rx={5} fill="#1a1b1a" opacity={0.92} />
        <text x={boxX + PAD_X} y={my + 4} textAnchor="start" fontSize={11} fontWeight={700} fill="#ffffff">
          {label}
        </text>
      </g>
      {locked && (
        <g
          transform={`translate(${boxX + boxW - closeW / 2} ${my})`}
          pointerEvents="auto"
          onPointerDown={(e: ReactPointerEvent<SVGGElement>) => {
            e.stopPropagation();
            onClear();
          }}
          role="button"
          aria-label="Clear measurement"
          style={{ cursor: "pointer" }}
        >
          <circle r={8} fill="#ffffff" fillOpacity={0.14} />
          <text textAnchor="middle" dy={3.5} fontSize={10} fontWeight={700} fill="#ffffff">
            ×
          </text>
        </g>
      )}
    </g>
  );
}
