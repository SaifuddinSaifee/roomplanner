"use client";

import { catalogEntry } from "@/src/catalog/items";
import { clamp } from "@/src/model/geometry";
import { useStore } from "@/src/store/useStore";
import { LengthField } from "./LengthField";

export function Inspector() {
  const units = useStore((s) => s.home.units);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const selectedItemId = useStore((s) => s.selectedItemId);
  const rooms = useStore((s) => s.home.rooms);
  const updateItem = useStore((s) => s.updateItem);
  const rotateItem = useStore((s) => s.rotateItem);
  const deleteItem = useStore((s) => s.deleteItem);

  const room = rooms.find((r) => r.id === selectedRoomId);
  const item = room?.items.find((i) => i.id === selectedItemId);

  if (!room) {
    return <p className="text-sm text-muted">Select a room to get started.</p>;
  }

  if (!item) {
    return <p className="text-sm text-muted">Select an item on the plan to edit it here.</p>;
  }

  const entry = catalogEntry(item.catalog);
  const resizable = entry?.resizable ?? true;
  const minW = entry?.minW ?? 1;
  const minD = entry?.minD ?? 1;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink">{item.label ?? entry?.name ?? item.catalog}</p>

      <div className="grid grid-cols-2 gap-2">
        <LengthField
          label="Width"
          value={item.w}
          units={units}
          disabled={!resizable}
          onCommit={(w) => updateItem(item.id, { w: Math.max(minW, w) })}
        />
        <LengthField
          label="Depth"
          value={item.d}
          units={units}
          disabled={!resizable}
          onCommit={(d) => updateItem(item.id, { d: Math.max(minD, d) })}
        />
        <LengthField
          label="From left (X)"
          value={item.x}
          units={units}
          onCommit={(x) => updateItem(item.id, { x: clamp(x, -room.width, room.width * 2) })}
        />
        <LengthField
          label="From top (Y)"
          value={item.y}
          units={units}
          onCommit={(y) => updateItem(item.id, { y: clamp(y, -room.depth, room.depth * 2) })}
        />
      </div>

      <div className="flex gap-1.5">
        <button
          className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-semibold hover:bg-accent-soft"
          onClick={() => rotateItem(item.id)}
        >
          Rotate 90° (R)
        </button>
        <button
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-semibold text-danger hover:bg-danger/10"
          onClick={() => deleteItem(item.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
