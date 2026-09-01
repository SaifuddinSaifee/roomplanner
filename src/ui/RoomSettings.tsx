"use client";

import type { Opening, OpeningKind, Room, Wall } from "@/src/model/types";
import { useStore } from "@/src/store/useStore";
import { LengthField } from "./LengthField";

const WALLS: { value: Wall; label: string }[] = [
  { value: "north", label: "North" },
  { value: "east", label: "East" },
  { value: "south", label: "South" },
  { value: "west", label: "West" },
];

const KINDS: { value: OpeningKind; label: string }[] = [
  { value: "door", label: "Door" },
  { value: "sliding", label: "Sliding door" },
  { value: "window", label: "Window" },
  { value: "opening", label: "Archway (no door)" },
];

function OpeningRow({ room, opening }: { room: Room; opening: Opening }) {
  const units = useStore((s) => s.home.units);
  const updateOpening = useStore((s) => s.updateOpening);
  const deleteOpening = useStore((s) => s.deleteOpening);

  return (
    <div className="rounded-lg border border-line bg-white p-2.5">
      <div className="mb-2 flex items-center gap-1.5">
        <select
          className="min-w-0 flex-1 rounded border border-line px-1.5 py-1 text-xs"
          value={opening.wall}
          onChange={(e) => updateOpening(room.id, opening.id, { wall: e.target.value as Wall })}
        >
          {WALLS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label} wall
            </option>
          ))}
        </select>
        <select
          className="min-w-0 flex-1 rounded border border-line px-1.5 py-1 text-xs"
          value={opening.kind}
          onChange={(e) => updateOpening(room.id, opening.id, { kind: e.target.value as OpeningKind })}
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <button
          className="rounded px-1.5 py-1 text-xs text-muted hover:bg-danger/10 hover:text-danger"
          title="Delete opening"
          onClick={() => deleteOpening(room.id, opening.id)}
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <LengthField
          label="Offset from wall start"
          value={opening.offset}
          units={units}
          onCommit={(offset) => updateOpening(room.id, opening.id, { offset })}
        />
        <LengthField
          label="Width"
          value={opening.width}
          units={units}
          onCommit={(width) => updateOpening(room.id, opening.id, { width })}
        />
      </div>
    </div>
  );
}

export function RoomSettings() {
  const units = useStore((s) => s.home.units);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const rooms = useStore((s) => s.home.rooms);
  const resizeRoom = useStore((s) => s.resizeRoom);
  const addOpening = useStore((s) => s.addOpening);

  const room = rooms.find((r) => r.id === selectedRoomId);
  if (!room) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <LengthField
          label="Room width"
          value={room.width}
          units={units}
          onCommit={(width) => resizeRoom(room.id, { width })}
        />
        <LengthField
          label="Room depth"
          value={room.depth}
          units={units}
          onCommit={(depth) => resizeRoom(room.id, { depth })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Doors &amp; windows</p>
        {room.openings.length === 0 && (
          <p className="text-xs text-muted">No doors or windows yet.</p>
        )}
        {room.openings.map((opening) => (
          <OpeningRow key={opening.id} room={room} opening={opening} />
        ))}
        <button
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-semibold hover:bg-accent-soft"
          onClick={() => addOpening(room.id)}
        >
          Add opening
        </button>
        <p className="text-[11px] text-muted">
          Adds a door — use the second dropdown on it to change the type to sliding door, window, or archway.
        </p>
      </div>
    </div>
  );
}
