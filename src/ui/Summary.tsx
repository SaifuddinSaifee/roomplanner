"use client";

import { formatLength } from "@/src/model/units";
import { useStore } from "@/src/store/useStore";

export function Summary() {
  const home = useStore((s) => s.home);

  const totalAreaSqIn = home.rooms.reduce((sum, r) => sum + r.width * r.depth, 0);
  const totalAreaSqFt = totalAreaSqIn / 144;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted">Rooms</span>
        <span className="font-semibold">{home.rooms.length}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Total area</span>
        <span className="font-semibold">{totalAreaSqFt.toFixed(1)} sq ft</span>
      </div>
      <ul className="flex flex-col gap-1 border-t border-line pt-2">
        {home.rooms.map((room) => (
          <li key={room.id} className="flex justify-between text-xs">
            <span className="text-muted">
              {room.name} ({formatLength(room.width, home.units)} × {formatLength(room.depth, home.units)})
            </span>
            <span className="font-semibold">{room.items.length} items</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
