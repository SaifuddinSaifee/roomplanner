import type { PointerEvent } from "react";
import { catalogEntry } from "@/src/catalog/items";
import { drawSymbol } from "@/src/catalog/symbols";
import { footprint } from "@/src/model/geometry";
import type { Item, Units } from "@/src/model/types";
import { formatLength } from "@/src/model/units";
import { toPxLen, toPxX, toPxY, type Scale } from "./scale";

// Below this footprint size (px), the label moves outside the shape with a
// leader line instead of overlapping the symbol. Fixes the old hardcoded
// `y0 + wardD - 62` label offsets, which collided once sizes were arbitrary.
const LABEL_INSIDE_MIN_W = 70;
const LABEL_INSIDE_MIN_H = 46;

interface ItemNodeProps {
  item: Item;
  scale: Scale;
  units: Units;
  selected: boolean;
  hasIssue: boolean;
  onPointerDown: (e: PointerEvent<SVGGElement>) => void;
}

export function ItemNode({ item, scale, units, selected, hasIssue, onPointerDown }: ItemNodeProps) {
  const entry = catalogEntry(item.catalog);
  const name = item.label ?? entry?.name ?? item.catalog;

  const wPx = toPxLen(item.w, scale);
  const dPx = toPxLen(item.d, scale);
  const cxPx = toPxX(item.x + item.w / 2, scale);
  const cyPx = toPxY(item.y + item.d / 2, scale);

  const fp = footprint(item);
  const fpWPx = toPxLen(fp.w, scale);
  const fpHPx = toPxLen(fp.h, scale);
  const labelInside = fpWPx >= LABEL_INSIDE_MIN_W && fpHPx >= LABEL_INSIDE_MIN_H;

  const dims = `${formatLength(item.w, units)} × ${formatLength(item.d, units)}`;

  return (
    <g
      transform={`translate(${cxPx} ${cyPx}) rotate(${item.rot})`}
      className={`item${selected ? " item-selected" : ""}${hasIssue ? " item-issue" : ""}`}
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
      aria-label={name}
    >
      <g transform={`translate(${-wPx / 2} ${-dPx / 2})`}>
        {drawSymbol(item.catalog, wPx, dPx)}
        {selected && (
          <rect
            x={-3}
            y={-3}
            width={wPx + 6}
            height={dPx + 6}
            fill="none"
            className="selection-ring"
          />
        )}
      </g>
      {labelInside ? (
        <text className="item-label" textAnchor="middle" transform={`rotate(${-item.rot})`}>
          <tspan x={0} dy={-2}>{name}</tspan>
          <tspan x={0} dy={14} className="item-dims">{dims}</tspan>
        </text>
      ) : (
        <g transform={`rotate(${-item.rot})`}>
          <line x1={0} y1={0} x2={0} y2={-dPx / 2 - 14} className="leader" />
          <text className="item-label small" textAnchor="middle" y={-dPx / 2 - 18}>
            {name}
          </text>
        </g>
      )}
    </g>
  );
}
