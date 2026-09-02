"use client";

import { useStore } from "@/src/store/useStore";
import { ItemFields } from "./ItemFields";

export function Inspector() {
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const selectedItemIds = useStore((s) => s.selectedItemIds);
  const rooms = useStore((s) => s.home.rooms);

  const room = rooms.find((r) => r.id === selectedRoomId);
  const items = room?.items.filter((i) => selectedItemIds.includes(i.id)) ?? [];

  if (!room) {
    return <p className="text-sm text-muted">Select a room to get started.</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        Select an item on the plan to edit it here (shift/cmd-click to select several).
      </p>
    );
  }

  return <ItemFields room={room} items={items} />;
}
