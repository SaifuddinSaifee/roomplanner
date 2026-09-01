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
  const selectedItemId = useStore((s) => s.selectedItemId);
  const rooms = useStore((s) => s.home.rooms);

  const room = rooms.find((r) => r.id === selectedRoomId);
  const item = room?.items.find((i) => i.id === selectedItemId);

  if (!room || !item) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 w-[280px]">
      <Expander
        title="Selected item"
        className="pointer-events-auto overflow-hidden rounded-xl border border-line bg-white/95 shadow-lg backdrop-blur"
      >
        <ItemFields room={room} item={item} />
      </Expander>
    </div>
  );
}
