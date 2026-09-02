"use client";

import { useStore } from "@/src/store/useStore";
import { Expander } from "./Expander";
import { ItemFields } from "./ItemFields";

/**
 * Floating "Selected item" panel docked on the canvas itself. Selecting an
 * item on the plan is far more common than selecting one from the sidebar,
 * so editing it shouldn't require scrolling past Rooms / Room size &
 * openings / Add furniture to reach the sidebar's own "Selected item"
 * section — this surfaces the same fields right where the selection happened.
 */
export function CanvasSelectionPanel() {
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const selectedItemIds = useStore((s) => s.selectedItemIds);
  const rooms = useStore((s) => s.home.rooms);

  const room = rooms.find((r) => r.id === selectedRoomId);
  const items = room?.items.filter((i) => selectedItemIds.includes(i.id)) ?? [];

  if (!room || items.length === 0) return null;

  const title = items.length === 1 ? "Selected item" : `Selected items (${items.length})`;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 w-[280px]">
      <Expander
        title={title}
        className="pointer-events-auto overflow-hidden rounded-xl border border-line bg-white/95 shadow-lg backdrop-blur"
      >
        <ItemFields room={room} items={items} />
      </Expander>
    </div>
  );
}
