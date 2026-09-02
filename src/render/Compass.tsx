import type { PointerEvent } from "react";

const ARM = 15;
const LABEL_OFFSET = 9;
const HEAD_LEN = 6;
const HEAD_HALF_W = 3.5;
const HANDLE_R = 7;

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
  // Perpendicular to (dx, dy) for the two back corners of the triangle.
  const px = -dy * HEAD_HALF_W;
  const py = dx * HEAD_HALF_W;
  const backX = tipX - dx * HEAD_LEN;
  const backY = tipY - dy * HEAD_LEN;
  return `M${tipX} ${tipY} L${backX + px} ${backY + py} L${backX - px} ${backY - py} Z`;
}

/**
 * A simple plus-shaped compass rose fixed to the bottom-left of the plan
 * viewport: N/S/E/W arms with arrowheads and labels, no border or badge.
 * Lives directly inside #plan-svg (not the room-scaled group), so it rides
 * along with SVG/print export but is unaffected by zoom or pan. Its
 * rotation is view state only — never written into the exported project JSON.
 */
export function Compass({ x, y, rotation, interactive = false, onRotate }: CompassProps) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      aria-label="Compass"
      onPointerDown={(e: PointerEvent<SVGGElement>) => e.stopPropagation()}
    >
      <g transform={`rotate(${rotation})`} stroke="#1a1b1a" fill="#1a1b1a">
        <line x1={0} y1={-ARM} x2={0} y2={ARM} strokeWidth={2} />
        <line x1={-ARM} y1={0} x2={ARM} y2={0} strokeWidth={2} />
        <path d={arrowhead(0, -ARM, 0, -1)} />
        <path d={arrowhead(0, ARM, 0, 1)} />
        <path d={arrowhead(ARM, 0, 1, 0)} />
        <path d={arrowhead(-ARM, 0, -1, 0)} />
        <text x={0} y={-ARM - LABEL_OFFSET + 3} textAnchor="middle" fontSize={11} fontWeight={700} stroke="none">
          N
        </text>
        <text x={0} y={ARM + LABEL_OFFSET + 3} textAnchor="middle" fontSize={11} fontWeight={700} stroke="none">
          S
        </text>
        <text x={ARM + LABEL_OFFSET} y={4} textAnchor="middle" fontSize={11} fontWeight={700} stroke="none">
          E
        </text>
        <text x={-ARM - LABEL_OFFSET} y={4} textAnchor="middle" fontSize={11} fontWeight={700} stroke="none">
          W
        </text>
      </g>
      {interactive && onRotate && (
        <g
          transform={`translate(${ARM + 6} ${ARM + 6})`}
          onPointerDown={(e: PointerEvent<SVGGElement>) => {
            e.stopPropagation();
            onRotate();
          }}
          role="button"
          aria-label="Rotate compass 45 degrees"
          style={{ cursor: "pointer" }}
        >
          <circle r={HANDLE_R} fill="#ffffff" fillOpacity={0.9} stroke="#8b8578" strokeWidth={1} />
          <text textAnchor="middle" dy={3.5} fontSize={9} fill="#242524">
            ⟳
          </text>
        </g>
      )}
    </g>
  );
}
