import { openingSegment, wallInwardNormal } from "@/src/model/geometry";
import type { Room } from "@/src/model/types";
import { toPxLen, toPxX, toPxY, type Scale } from "./scale";

interface OpeningsProps {
  room: Room;
  scale: Scale;
}

export function Openings({ room, scale }: OpeningsProps) {
  return (
    <>
      {room.openings.map((opening) => {
        const seg = openingSegment(room, opening);
        const { nx, ny } = wallInwardNormal(opening.wall);
        const x1 = toPxX(seg.x1, scale);
        const y1 = toPxY(seg.y1, scale);
        const x2 = toPxX(seg.x2, scale);
        const y2 = toPxY(seg.y2, scale);

        if (opening.kind === "door") {
          const swing = toPxLen(opening.width, scale);
          // Hinge at the segment start; leaf sweeps 90deg into the room.
          const leafEndX = x1 + nx * swing;
          const leafEndY = y1 + ny * swing;
          const arcX = x2;
          const arcY = y2;
          return (
            <g key={opening.id} className="opening-door">
              <line x1={x1} y1={y1} x2={leafEndX} y2={leafEndY} className="detail" />
              <path
                d={`M ${leafEndX} ${leafEndY} A ${swing} ${swing} 0 0 ${nx + ny > 0 ? 1 : 0} ${arcX} ${arcY}`}
                className="swing"
              />
            </g>
          );
        }

        if (opening.kind === "sliding") {
          const offset = 3;
          const ox1 = x1 + nx * offset;
          const oy1 = y1 + ny * offset;
          const ox2 = x2 + nx * offset;
          const oy2 = y2 + ny * offset;
          return (
            <g key={opening.id} className="opening-sliding">
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="slider" />
              <line x1={ox1} y1={oy1} x2={ox2} y2={oy2} className="slider" />
            </g>
          );
        }

        return <line key={opening.id} x1={x1} y1={y1} x2={x2} y2={y2} className="slider" />;
      })}
    </>
  );
}
