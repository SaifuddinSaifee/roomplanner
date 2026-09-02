import { renderToStaticMarkup } from "react-dom/server";

import { roomContentBounds } from "@/src/model/geometry";
import type { Room, Units } from "@/src/model/types";
import { formatLength } from "@/src/model/units";
import { Compass } from "./Compass";
import { Dimensions } from "./Dimensions";
import { ItemNode } from "./ItemNode";
import { Openings } from "./Openings";
import { PLAN_DEFS } from "./Plan";
import { RoomShell } from "./RoomShell";
import { computeScale } from "./scale";

const EXPORT_PX_PER_INCH = 8;
const EXPORT_MARGIN_IN = 40;
const COMPASS_MARGIN = 32;

export interface RenderedSvg {
  markup: string;
  width: number;
  height: number;
}

/** Pixel size that fits `room`'s content (room rectangle + any item outside it) at a fixed scale, with a flat margin — independent of any on-screen viewport, so the result never depends on the live canvas's current zoom/pan/container size. */
function exportViewport(room: Pick<Room, "width" | "depth" | "items">): { width: number; height: number } {
  const bounds = roomContentBounds(room);
  return {
    width: Math.max(1, Math.round((bounds.w + EXPORT_MARGIN_IN * 2) * EXPORT_PX_PER_INCH)),
    height: Math.max(1, Math.round((bounds.h + EXPORT_MARGIN_IN * 2) * EXPORT_PX_PER_INCH)),
  };
}

function withXmlHeader(markup: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
}

function noop() {}

/** Renders one room's floor plan as a standalone SVG, fitted tightly to its content. */
export function renderRoomPlanSvg(room: Room, units: Units): RenderedSvg {
  const { width, height } = exportViewport(room);
  const scale = computeScale(room, width, height, EXPORT_MARGIN_IN);

  const markup = renderToStaticMarkup(
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Floor plan of ${room.name}`}
    >
      {PLAN_DEFS}
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      <RoomShell room={room} scale={scale} />
      <Openings room={room} scale={scale} />
      {room.items.map((item) => (
        <ItemNode key={item.id} item={item} scale={scale} units={units} selected={false} hasIssue={false} onPointerDown={noop} />
      ))}
      <Dimensions room={room} scale={scale} units={units} />
      <Compass x={COMPASS_MARGIN} y={height - COMPASS_MARGIN} rotation={0} />
    </svg>
  );

  return { markup: withXmlHeader(markup), width, height };
}

/** Renders every room's floor plan stacked into one standalone SVG sheet, each labeled with its name and dimensions. Returns null if there are no rooms. */
export function renderHousePlanSvg(rooms: Room[], units: Units): RenderedSvg | null {
  if (rooms.length === 0) return null;

  const GAP = 56;
  const HEADER_H = 34;
  const entries = rooms.map((room) => ({ room, ...exportViewport(room) }));
  const totalWidth = Math.max(...entries.map((e) => e.width)) + GAP * 2;

  let cursorY = GAP;
  const placed = entries.map((e) => {
    const top = cursorY;
    cursorY += HEADER_H + e.height + GAP;
    return { ...e, top };
  });
  const totalHeight = cursorY;

  const markup = renderToStaticMarkup(
    <svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Complete house plan"
    >
      {PLAN_DEFS}
      <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="#ffffff" />
      {placed.map(({ room, width, height, top }) => {
        const scale = computeScale(room, width, height, EXPORT_MARGIN_IN);
        const x = (totalWidth - width) / 2;
        return (
          <g key={room.id}>
            <text x={x} y={top + HEADER_H - 12} style={{ font: "700 16px Georgia, serif", fill: "#222422" }}>
              {room.name}
            </text>
            <text x={x + width} y={top + HEADER_H - 12} textAnchor="end" style={{ font: "500 12px Inter, Arial, sans-serif", fill: "#54524a" }}>
              {formatLength(room.width, units)} × {formatLength(room.depth, units)} · {room.items.length} items
            </text>
            <g transform={`translate(${x} ${top + HEADER_H})`}>
              <rect x={0} y={0} width={width} height={height} fill="#ffffff" stroke="#e5e0d6" />
              <RoomShell room={room} scale={scale} />
              <Openings room={room} scale={scale} />
              {room.items.map((item) => (
                <ItemNode key={item.id} item={item} scale={scale} units={units} selected={false} hasIssue={false} onPointerDown={noop} />
              ))}
              <Dimensions room={room} scale={scale} units={units} />
              <Compass x={COMPASS_MARGIN} y={height - COMPASS_MARGIN} rotation={0} />
            </g>
          </g>
        );
      })}
    </svg>
  );

  return { markup: withXmlHeader(markup), width: totalWidth, height: totalHeight };
}
