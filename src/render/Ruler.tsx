"use client";

import type { Units } from "@/src/model/types";
import type { Scale } from "./scale";

const MM_PER_INCH = 25.4;

/** Ruler bar thickness, in px — also the size of the corner square where the two bars meet. */
export const RULER_SIZE = 22;

const BG = "#f7f4ee";
const LINE = "#8b8578";
const LABEL = "#54524a";

interface Tick {
  pos: number;
  label: string | null;
  major: boolean;
}

/**
 * Pick a "nice" tick step, in inches, for the ruler's *displayed* unit: a
 * 1-2-5-ish progression in feet/inches or millimetres rather than raw
 * inches, so labels read as round numbers regardless of zoom level. Steps
 * grow until consecutive major ticks are at least `minPxGap` apart.
 */
function niceStepInches(units: Units, pxPerInch: number, minPxGap: number): number {
  const steps =
    units === "mm"
      ? [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000].map((mm) => mm / MM_PER_INCH)
      : [1, 2, 3, 6, 12, 24, 60, 120, 240, 600, 1200, 2400, 6000, 12000, 24000];
  for (const step of steps) {
    if (step * pxPerInch >= minPxGap) return step;
  }
  return steps[steps.length - 1];
}

function tickLabel(inches: number, units: Units): string {
  if (units === "mm") {
    const mm = Math.round(inches * MM_PER_INCH);
    if (mm !== 0 && mm % 1000 === 0) return `${mm / 1000}m`;
    return `${mm}`;
  }
  const rounded = Math.round(inches);
  if (rounded % 12 === 0) return `${rounded / 12}'`;
  return `${rounded}"`;
}

/** Major ticks (labeled) plus one unlabeled minor tick halfway between each pair, across the visible span. */
function computeTicks(pxPerInch: number, originPx: number, lengthPx: number, units: Units): Tick[] {
  if (pxPerInch <= 0) return [];
  const step = niceStepInches(units, pxPerInch, 46);
  const minInches = -originPx / pxPerInch;
  const maxInches = (lengthPx - originPx) / pxPerInch;
  const start = Math.floor(minInches / step) * step;

  const ticks: Tick[] = [];
  for (let v = start; v <= maxInches + step; v += step) {
    ticks.push({ pos: originPx + v * pxPerInch, label: tickLabel(v, units), major: true });
    const halfPos = originPx + (v + step / 2) * pxPerInch;
    if (halfPos >= 0 && halfPos <= lengthPx) ticks.push({ pos: halfPos, label: null, major: false });
  }
  return ticks;
}

interface RulerProps {
  viewportWidth: number;
  viewportHeight: number;
  scale: Scale;
  units: Units;
}

/**
 * Fixed ruler bars along the top and left edges of the plan viewport,
 * showing the room's own coordinate system (0 at the north/west walls) in
 * the current display units. Ticks track pan/zoom via `scale`, exactly like
 * everything else drawn from it — this component is just a read of that
 * scale, not a second source of truth for it.
 */
export function Ruler({ viewportWidth, viewportHeight, scale, units }: RulerProps) {
  if (viewportWidth <= 0 || viewportHeight <= 0) return null;

  const xTicks = computeTicks(scale.pxPerInch, scale.originX, viewportWidth, units);
  const yTicks = computeTicks(scale.pxPerInch, scale.originY, viewportHeight, units);

  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect x={0} y={0} width={viewportWidth} height={RULER_SIZE} fill={BG} stroke={LINE} strokeWidth={0.75} />
      <rect x={0} y={0} width={RULER_SIZE} height={viewportHeight} fill={BG} stroke={LINE} strokeWidth={0.75} />

      {xTicks.map((t, i) => (
        <g key={`x${i}`}>
          <line
            x1={t.pos}
            y1={RULER_SIZE}
            x2={t.pos}
            y2={RULER_SIZE - (t.major ? 10 : 5)}
            stroke={LINE}
            strokeWidth={0.75}
          />
          {t.label && (
            <text x={t.pos + 3} y={RULER_SIZE - 12} fontSize={8.5} fontWeight={600} fill={LABEL}>
              {t.label}
            </text>
          )}
        </g>
      ))}

      {yTicks.map((t, i) => (
        <g key={`y${i}`}>
          <line
            x1={RULER_SIZE}
            y1={t.pos}
            x2={RULER_SIZE - (t.major ? 10 : 5)}
            y2={t.pos}
            stroke={LINE}
            strokeWidth={0.75}
          />
          {t.label && (
            <text
              x={RULER_SIZE - 12}
              y={t.pos - 3}
              fontSize={8.5}
              fontWeight={600}
              fill={LABEL}
              textAnchor="end"
              transform={`rotate(-90 ${RULER_SIZE - 12} ${t.pos - 3})`}
            >
              {t.label}
            </text>
          )}
        </g>
      ))}

      <rect x={0} y={0} width={RULER_SIZE} height={RULER_SIZE} fill={BG} stroke={LINE} strokeWidth={0.75} />
    </g>
  );
}
