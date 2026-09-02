"use client";

import { useEffect, useMemo, useRef } from "react";

import { roomIdFromPath, roomUrlSlug } from "@/src/model/slug";
import { Plan } from "@/src/render/Plan";
import { DEFAULT_PROJECT_ID, loadHome, saveHome } from "@/src/store/persist";
import { useStore } from "@/src/store/useStore";
import { CanvasSelectionPanel } from "@/src/ui/CanvasSelectionPanel";
import { Sidebar } from "@/src/ui/Sidebar";
import { Toolbar } from "@/src/ui/Toolbar";
import { validateRoom } from "@/src/validate/rules";

const AUTOSAVE_DEBOUNCE_MS = 400;

export function App() {
  const home = useStore((s) => s.home);
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const markHydrated = useStore((s) => s.markHydrated);
  const selectedRoomId = useStore((s) => s.selectedRoomId);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRoomId = useRef<string | null>(null);

  // Hydration must happen in an effect, not during render, so the SSR/static
  // export markup and the first client render match before storage is read.
  useEffect(() => {
    const stored = loadHome(DEFAULT_PROJECT_ID);
    if (stored) hydrate(stored);
    else markHydrated();

    // A room's URL (its slug's trailing id) wins over whatever room the
    // store would otherwise default to, so a shared/bookmarked link opens
    // straight into that room.
    const roomId = roomIdFromPath(window.location.pathname);
    if (roomId) {
      const { home: loadedHome, selectRoom } = useStore.getState();
      if (loadedHome.rooms.some((r) => r.id === roomId)) selectRoom(roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/forward between room URLs should switch rooms, same as clicking them.
  useEffect(() => {
    function onPopState() {
      const roomId = roomIdFromPath(window.location.pathname);
      const { home: currentHome, selectRoom } = useStore.getState();
      if (roomId && currentHome.rooms.some((r) => r.id === roomId)) selectRoom(roomId);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveHome(DEFAULT_PROJECT_ID, home), AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [home, hydrated]);

  const room = home.rooms.find((r) => r.id === selectedRoomId);

  // Keep the address bar in sync with the selected room: a fresh selection
  // gets its own history entry (so back/forward works), while a same-room
  // update (e.g. a rename changing its slug) replaces the current entry.
  useEffect(() => {
    if (!hydrated || !room) return;
    const path = `/${roomUrlSlug(room)}`;
    if (window.location.pathname === path) {
      lastSyncedRoomId.current = room.id;
      return;
    }
    if (lastSyncedRoomId.current === null || lastSyncedRoomId.current === room.id) {
      window.history.replaceState(null, "", path);
    } else {
      window.history.pushState(null, "", path);
    }
    lastSyncedRoomId.current = room.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, room?.id, room?.name]);

  const issues = useMemo(() => (room ? validateRoom(room) : []), [room]);
  const issueItemIds = useMemo(() => new Set(issues.flatMap((i) => i.itemIds)), [issues]);

  if (!hydrated) {
    return <div className="flex h-dvh items-center justify-center text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="grid h-dvh grid-cols-[minmax(280px,360px)_minmax(0,1fr)] grid-rows-[auto_1fr]">
      <div className="col-span-2 no-print">
        <Toolbar />
      </div>
      <div className="row-start-2 min-h-0 no-print">
        <Sidebar issues={issues} />
      </div>
      <div className="relative row-start-2 min-h-0 min-w-0 bg-page p-4">
        {room ? (
          <>
            <Plan room={room} units={home.units} issueItemIds={issueItemIds} />
            <CanvasSelectionPanel />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Add a room to get started.
          </div>
        )}
      </div>
    </div>
  );
}
