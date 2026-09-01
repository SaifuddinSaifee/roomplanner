import { wallLength } from "@/src/model/geometry";
import type { Room, Wall } from "@/src/model/types";
import { toPxLen, toPxX, toPxY, type Scale } from "./scale";

const WALL_THICKNESS = 6;

/** Wall endpoints as a function of position `t` along the wall, in room-local inches. */
function wallPoint(room: Room, wall: Wall, t: number): { x: number; y: number } {
  switch (wall) {
    case "north":
      return { x: t, y: 0 };
    case "south":
      return { x: t, y: room.depth };
    case "west":
      return { x: 0, y: t };
    case "east":
      return { x: room.width, y: t };
  }
}

function wallSegments(room: Room, wall: Wall): [number, number][] {
  const length = wallLength(room, wall);
  const openings = room.openings
    .filter((o) => o.wall === wall)
    .map((o) => [o.offset, o.offset + o.width] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  const segments: [number, number][] = [];
  let cursor = 0;
  for (const [start, end] of openings) {
    if (start > cursor) segments.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < length) segments.push([cursor, length]);
  return segments;
}

interface RoomShellProps {
  room: Room;
  scale: Scale;
}

export function RoomShell({ room, scale }: RoomShellProps) {
  const walls: Wall[] = ["north", "east", "south", "west"];

  return (
    <>
      <rect
        x={toPxX(0, scale)}
        y={toPxY(0, scale)}
        width={toPxLen(room.width, scale)}
        height={toPxLen(room.depth, scale)}
        fill="url(#floor)"
      />
      {walls.map((wall) =>
        wallSegments(room, wall).map(([start, end], i) => {
          const p1 = wallPoint(room, wall, start);
          const p2 = wallPoint(room, wall, end);
          return (
            <line
              key={`${wall}-${i}`}
              className="wall"
              x1={toPxX(p1.x, scale)}
              y1={toPxY(p1.y, scale)}
              x2={toPxX(p2.x, scale)}
              y2={toPxY(p2.y, scale)}
              strokeWidth={WALL_THICKNESS}
            />
          );
        })
      )}
    </>
  );
}

export { wallPoint, wallSegments };
