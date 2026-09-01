"use client";

import { CATALOG, CATEGORY_ORDER } from "@/src/catalog/items";
import { drawSymbol } from "@/src/catalog/symbols";
import { useStore } from "@/src/store/useStore";

export function Catalog() {
  const addItem = useStore((s) => s.addItem);
  const selectedRoomId = useStore((s) => s.selectedRoomId);

  return (
    <div className="flex flex-col gap-3">
      {CATEGORY_ORDER.map((category) => {
        const entries = CATALOG.filter((e) => e.category === category);
        return (
          <div key={category}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">{category}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  disabled={!selectedRoomId}
                  onClick={() => addItem(entry.id)}
                  title={`Add ${entry.name}`}
                  className="flex flex-col items-center gap-1 rounded-lg border border-line bg-white p-1.5 text-center hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg viewBox="0 0 60 60" className="h-9 w-9">
                    <g transform={fitTransform(entry.defaultW, entry.defaultD)}>
                      {drawSymbol(entry.id, entry.defaultW, entry.defaultD)}
                    </g>
                  </svg>
                  <span className="text-[10px] font-medium leading-tight text-ink">{entry.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fitTransform(w: number, d: number): string {
  const pad = 6;
  const box = 60 - pad * 2;
  const scale = Math.min(box / w, box / d);
  const offsetX = (60 - w * scale) / 2;
  const offsetY = (60 - d * scale) / 2;
  return `translate(${offsetX} ${offsetY}) scale(${scale})`;
}
