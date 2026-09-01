"use client";

import { useStore } from "@/src/store/useStore";
import { ItemFields } from "./ItemFields";

export function Inspector() {
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const selectedItemId = useStore((s) => s.selectedItemId);
  const rooms = useStore((s) => s.home.rooms);

  const room = rooms.find((r) => r.id === selectedRoomId);
  const item = room?.items.find((i) => i.id === selectedItemId);

  if (!room) {
    return <p className="text-sm text-muted">Select a room to get started.</p>;
  }

  if (!item) {
    return <p className="text-sm text-muted">Select an item on the plan to edit it here.</p>;
  }

  return <ItemFields room={room} item={item} />;
}
