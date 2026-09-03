"use client";

import { useEffect } from "react";

import type { Room, Units } from "@/src/model/types";
import { formatLength } from "@/src/model/units";
import { renderRoomPlanSvg } from "@/src/render/staticPlan";

interface ImportRoomModalProps {
  rooms: Room[];
  units: Units;
  onSelect: (room: Room) => void;
  onClose: () => void;
}

/**
 * "Import room" expects a single-room file; when the uploaded JSON turns out
 * to hold more than one (a whole house plan, or another multi-room export),
 * this lets the user see each room's floor plan and pick the one they
 * actually meant to bring in, instead of silently grabbing the first one.
 */
export function ImportRoomModal({ rooms, units, onSelect, onClose }: ImportRoomModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a room to import"
    >
      <style>{`.import-room-thumb svg { display: block; width: 100%; height: 100%; }`}</style>
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-ink">This file has {rooms.length} rooms</h2>
            <p className="mt-0.5 text-xs text-muted">Pick the one you want to import — the rest will be left out.</p>
          </div>
          <button
            className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-accent-soft hover:text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3">
          {rooms.map((room, i) => {
            const { markup } = renderRoomPlanSvg(room, units);
            return (
              <button
                key={`${room.id}-${i}`}
                className="flex flex-col overflow-hidden rounded-lg border border-line bg-white text-left transition hover:border-accent hover:shadow-md"
                onClick={() => onSelect(room)}
              >
                <div className="import-room-thumb flex h-40 items-center justify-center bg-page p-3">
                  <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: markup }} />
                </div>
                <div className="border-t border-line px-3 py-2">
                  <div className="truncate text-xs font-semibold text-ink">{room.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {formatLength(room.width, units)} × {formatLength(room.depth, units)} · {room.items.length} item
                    {room.items.length === 1 ? "" : "s"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
