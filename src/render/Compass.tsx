import type { PointerEvent } from "react";
import { LuRotateCw } from "react-icons/lu";

const ARM = 12;
const LABEL_OFFSET = 9;
const HEAD_LEN = 5.5;
const HEAD_HALF_W = 3.25;
const INNER_PADDING = 10;
const LABEL_HALF = 6;
const ROTATE_BTN = 24;
const BG = "#f7f4ee";
const LINE = "#8b8578";
const INK = "#1a1b1a";
const LABEL = "#54524a";
const NORTH = "#6f604d";

interface CompassProps {
  /** Center position in viewport px — fixed regardless of zoom/pan. */
  x: number;
  y: number;
  /** Degrees clockwise from north-up. Purely a view preference — not part of the room data. */
  rotation: number;
  interactive?: boolean;
  onRotate?: () => void;
}

/** One arrowhead triangle, tip at (tipX, tipY), pointing along (dx, dy) (a unit axis vector). */
function arrowhead(tipX: number, tipY: number, dx: number, dy: number) {
  const px = -dy * HEAD_HALF_W;
  const py = dx * HEAD_HALF_W;
  const backX = tipX - dx * HEAD_LEN;
  const backY = tipY - dy * HEAD_LEN;
  return `M${tipX} ${tipY} L${backX + px} ${backY + py} L${backX - px} ${backY - py} Z`;
}

interface DirectionLabelProps {
  rotation: number;
  x: number;
  y: number;
  label: string;
  north?: boolean;
}

/** Label anchored on the rotating rose but counter-rotated so text stays upright. */
function DirectionLabel({ rotation, x, y, label, north = false }: DirectionLabelProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${-rotation})`}>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={north ? 12 : 10}
        fontWeight={700}
        fill={north ? NORTH : LABEL}
        stroke="none"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Compass rose fixed to the bottom-left of the plan viewport. The cross and
 * arrowheads rotate with view preference; N/S/E/W labels stay upright.
 */
export function Compass({ x, y, rotation, interactive = false, onRotate }: CompassProps) {
  const labelReach = ARM + LABEL_OFFSET + LABEL_HALF;
  const radius = labelReach + INNER_PADDING;

  return (
    <g
      transform={`translate(${x} ${y})`}
      aria-label="Compass"
      onPointerDown={(e: PointerEvent<SVGGElement>) => e.stopPropagation()}
    >
      <g transform={`rotate(${rotation})`} stroke={INK} fill={INK}>
        <circle r={radius} fill={BG} stroke={LINE} strokeWidth={0.75} />

        <line x1={0} y1={-ARM} x2={0} y2={ARM} strokeWidth={1.75} />
        <line x1={-ARM} y1={0} x2={ARM} y2={0} strokeWidth={1.75} />

        <path d={arrowhead(0, ARM, 0, 1)} />
        <path d={arrowhead(ARM, 0, 1, 0)} />
        <path d={arrowhead(-ARM, 0, -1, 0)} />

        <g fill={NORTH} stroke={NORTH}>
          <line x1={0} y1={0} x2={0} y2={-ARM} strokeWidth={2.25} />
          <path d={arrowhead(0, -ARM, 0, -1)} />
        </g>

        <DirectionLabel rotation={rotation} x={0} y={-ARM - LABEL_OFFSET} label="N" north />
        <DirectionLabel rotation={rotation} x={0} y={ARM + LABEL_OFFSET} label="S" />
        <DirectionLabel rotation={rotation} x={ARM + LABEL_OFFSET} y={0} label="E" />
        <DirectionLabel rotation={rotation} x={-ARM - LABEL_OFFSET} y={0} label="W" />
      </g>

      {interactive && onRotate && (
        <g transform={`translate(${radius + 2} ${-(radius + 2)})`}>
          <foreignObject x={-ROTATE_BTN / 2} y={-ROTATE_BTN / 2} width={ROTATE_BTN} height={ROTATE_BTN}>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-panel/95 text-ink shadow-sm hover:bg-accent-soft"
              onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onRotate();
              }}
              aria-label="Rotate compass 45 degrees"
              title="Rotate compass 45°"
            >
              <LuRotateCw size={14} />
            </button>
          </foreignObject>
        </g>
      )}
    </g>
  );
}
