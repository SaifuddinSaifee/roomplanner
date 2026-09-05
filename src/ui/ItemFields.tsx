"use client";

import { useState } from "react";

import { catalogEntry } from "@/src/catalog/items";
import { clamp } from "@/src/model/geometry";
import { isHomogeneousSelection } from "@/src/model/selection";
import type { Item, Room } from "@/src/model/types";
import { useStore } from "@/src/store/useStore";
import { LengthField } from "./LengthField";

interface ItemFieldsProps {
  room: Room;
  /** The currently selected items in `room`, in selection order. Always at least 1. */
  items: Item[];
}

/**
 * The editable width/depth/position/rotate/delete controls for the current
 * selection. Shared by the sidebar inspector and the on-canvas selection
 * panel so both stay in sync by construction.
 *
 * With one item selected, this is a plain per-item editor. With several,
 * width/depth become a SHARED field that writes to every selected item at
 * once — but only when the selection is homogeneous (same catalog, same
 * current w/d/rot): typing one Width into a wardrobe and a sofa at the same
 * time isn't a coherent action. Position, rotate, and delete always work
 * per-item / across the whole selection regardless of homogeneity, since
 * "move each to its own spot" and "rotate/delete each" are always coherent.
 */
export function ItemFields({ room, items }: ItemFieldsProps) {
  const units = useStore((s) => s.home.units);
  const updateItem = useStore((s) => s.updateItem);
  const updateSelectedItems = useStore((s) => s.updateSelectedItems);
  const moveSelectedItems = useStore((s) => s.moveSelectedItems);
  const rotateSelectedItems = useStore((s) => s.rotateSelectedItems);
  const deleteSelectedItems = useStore((s) => s.deleteSelectedItems);
  const duplicateSelection = useStore((s) => s.duplicateSelection);

  // "Move by" is a one-shot nudge, not a persistent value — remounting the
  // fields after each commit resets their text back to a neutral 0 instead
  // of leaving the last-typed delta sitting there looking like a stored value.
  const [moveKey, setMoveKey] = useState(0);
  function commitMove(dx: number, dy: number) {
    moveSelectedItems(dx, dy);
    setMoveKey((k) => k + 1);
  }

  const [first, ...rest] = items;
  const entry = catalogEntry(first.catalog);
  const resizable = entry?.resizable ?? true;
  const minW = entry?.minW ?? 8;
  const minD = entry?.minD ?? 8;

  if (items.length === 1) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-ink">{first.label ?? entry?.name ?? first.catalog}</p>

        <div className="grid grid-cols-2 gap-2">
          <LengthField
            label="Width"
            value={first.w}
            units={units}
            disabled={!resizable}
            onCommit={(w) => updateItem(first.id, { w: Math.max(minW, w) })}
          />
          <LengthField
            label="Depth"
            value={first.d}
            units={units}
            disabled={!resizable}
            onCommit={(d) => updateItem(first.id, { d: Math.max(minD, d) })}
          />
          <LengthField
            label="From left (X)"
            value={first.x}
            units={units}
            onCommit={(x) => updateItem(first.id, { x: clamp(x, -room.width, room.width * 2) })}
          />
          <LengthField
            label="From top (Y)"
            value={first.y}
            units={units}
            onCommit={(y) => updateItem(first.id, { y: clamp(y, -room.depth, room.depth * 2) })}
          />
        </div>

        <ActionButtons
          onRotate={rotateSelectedItems}
          onDuplicate={duplicateSelection}
          onDelete={deleteSelectedItems}
        />
      </div>
    );
  }

  const homogeneous = isHomogeneousSelection(items);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink">
        {items.length} × {homogeneous ? (entry?.name ?? first.catalog) : "mixed items"}
      </p>

      <div>
        <p className="mb-1 text-[11px] text-muted">
          Move the whole selection — drag any one of them on the plan, or nudge by an exact amount:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <LengthField key={`dx-${moveKey}`} label="Move X by" value={0} units={units} onCommit={(dx) => commitMove(dx, 0)} />
          <LengthField key={`dy-${moveKey}`} label="Move Y by" value={0} units={units} onCommit={(dy) => commitMove(0, dy)} />
        </div>
      </div>

      {homogeneous ? (
        <>
          <p className="text-[11px] text-muted">Same item — editing width or depth applies to all {items.length}.</p>
          <div className="grid grid-cols-2 gap-2">
            <LengthField
              label="Width"
              value={first.w}
              units={units}
              disabled={!resizable}
              onCommit={(w) => updateSelectedItems({ w: Math.max(minW, w) })}
            />
            <LengthField
              label="Depth"
              value={first.d}
              units={units}
              disabled={!resizable}
              onCommit={(d) => updateSelectedItems({ d: Math.max(minD, d) })}
            />
          </div>
        </>
      ) : (
        <p className="text-[11px] text-muted">
          {rest.length + 1} items of different types or sizes — select only matching items to edit width/depth
          together.
        </p>
      )}

      <ActionButtons onRotate={rotateSelectedItems} onDuplicate={duplicateSelection} onDelete={deleteSelectedItems} />
    </div>
  );
}

function ActionButtons({
  onRotate,
  onDuplicate,
  onDelete,
}: {
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-semibold hover:bg-accent-soft"
        onClick={onRotate}
      >
        Rotate 90° (R)
      </button>
      <button
        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-semibold hover:bg-accent-soft"
        onClick={onDuplicate}
        title="Duplicate (Cmd/Ctrl+D)"
      >
        Duplicate
      </button>
      <button
        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-semibold text-danger hover:bg-danger/10"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}
