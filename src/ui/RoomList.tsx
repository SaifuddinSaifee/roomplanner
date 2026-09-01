"use client";

import { useState } from "react";

import { ROOM_TYPES } from "@/src/model/types";
import type { RoomType } from "@/src/model/types";
import { useStore } from "@/src/store/useStore";

export function RoomList() {
  const rooms = useStore((s) => s.home.rooms);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const selectRoom = useStore((s) => s.selectRoom);
  const addRoom = useStore((s) => s.addRoom);
  const duplicateRoom = useStore((s) => s.duplicateRoom);
  const deleteRoom = useStore((s) => s.deleteRoom);
  const renameRoom = useStore((s) => s.renameRoom);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<RoomType>("bedroom");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleAdd() {
    const name = newName.trim() || ROOM_TYPES.find((t) => t.value === newType)?.label || "Room";
    addRoom(name, newType);
    setNewName("");
  }

  function startRename(roomId: string, current: string) {
    setRenamingId(roomId);
    setRenameValue(current);
  }

  function commitRename(roomId: string) {
    const trimmed = renameValue.trim();
    if (trimmed) renameRoom(roomId, trimmed);
    setRenamingId(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {rooms.map((room) => (
          <li key={room.id}>
            <div
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${
                room.id === selectedRoomId ? "border-accent bg-accent-soft" : "border-line bg-white"
              }`}
            >
              {renamingId === room.id ? (
                <input
                  autoFocus
                  className="min-w-0 flex-1 rounded border border-line px-1.5 py-0.5 text-sm"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(room.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                />
              ) : (
                <button
                  className="min-w-0 flex-1 truncate text-left font-semibold"
                  onClick={() => selectRoom(room.id)}
                  onDoubleClick={() => startRename(room.id, room.name)}
                  title="Click to select, double-click to rename"
                >
                  {room.name}
                  <span className="ml-1.5 font-normal text-muted">
                    {ROOM_TYPES.find((t) => t.value === room.type)?.label}
                  </span>
                </button>
              )}
              <button
                className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-accent-soft hover:text-ink"
                title="Duplicate room"
                onClick={() => duplicateRoom(room.id)}
              >
                ⧉
              </button>
              {confirmDeleteId === room.id ? (
                <span className="flex items-center gap-1 text-xs">
                  <button
                    className="rounded bg-danger px-1.5 py-0.5 text-white"
                    onClick={() => {
                      deleteRoom(room.id);
                      setConfirmDeleteId(null);
                    }}
                  >
                    Delete
                  </button>
                  <button className="rounded px-1.5 py-0.5 text-muted" onClick={() => setConfirmDeleteId(null)}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-danger/10 hover:text-danger"
                  title="Delete room"
                  onClick={() => setConfirmDeleteId(room.id)}
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-1.5 pt-1">
        <input
          className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1.5 text-sm"
          placeholder="Room name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <select
          className="rounded-lg border border-line px-1.5 py-1.5 text-sm"
          value={newType}
          onChange={(e) => setNewType(e.target.value as RoomType)}
        >
          {ROOM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-accent px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover" onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
}
