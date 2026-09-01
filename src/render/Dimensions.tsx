import type { Room, Units } from "@/src/model/types";
import { formatLength } from "@/src/model/units";
import { toPxX, toPxY, type Scale } from "./scale";

const OFFSET = 28;

interface DimensionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  vertical?: boolean;
}

function DimensionLine({ x1, y1, x2, y2, label, vertical = false }: DimensionLineProps) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const transform = vertical ? `rotate(-90 ${mx} ${my})` : undefined;

  return (
    <g>
      <line className="dim" x1={x1} y1={y1} x2={x2} y2={y2} />
      <line className="tick" x1={x1} y1={y1 - 6} x2={x1} y2={y1 + 6} />
      <line className="tick" x1={x2} y1={y2 - 6} x2={x2} y2={y2 + 6} />
      <rect className="label-bg" x={mx - 32} y={my - 10} width={64} height={20} transform={transform} />
      <text className="dim-text" x={mx} y={my + 4} textAnchor="middle" transform={transform}>
        {label}
      </text>
    </g>
  );
}

interface DimensionsProps {
  room: Room;
  scale: Scale;
  units: Units;
}

export function Dimensions({ room, scale, units }: DimensionsProps) {
  const x0 = toPxX(0, scale);
  const x1 = toPxX(room.width, scale);
  const y0 = toPxY(0, scale);
  const y1 = toPxY(room.depth, scale);

  return (
    <>
      <DimensionLine x1={x0} y1={y0 - OFFSET} x2={x1} y2={y0 - OFFSET} label={formatLength(room.width, units)} />
      <DimensionLine
        x1={x1 + OFFSET}
        y1={y0}
        x2={x1 + OFFSET}
        y2={y1}
        label={formatLength(room.depth, units)}
        vertical
      />
    </>
  );
}

export function dimensionsMargin(): number {
  return OFFSET + 20;
}
