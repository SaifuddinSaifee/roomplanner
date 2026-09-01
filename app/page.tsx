"use client";

import { useEffect, useMemo, useRef } from "react";

import { Plan } from "@/src/render/Plan";
import { DEFAULT_PROJECT_ID, loadHome, saveHome } from "@/src/store/persist";
import { useStore } from "@/src/store/useStore";
import { CanvasSelectionPanel } from "@/src/ui/CanvasSelectionPanel";
import { Sidebar } from "@/src/ui/Sidebar";
import { Toolbar } from "@/src/ui/Toolbar";
import { validateRoom } from "@/src/validate/rules";

const AUTOSAVE_DEBOUNCE_MS = 400;

export default function Home() {
  const home = useStore((s) => s.home);
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const markHydrated = useStore((s) => s.markHydrated);
  const selectedRoomId = useStore((s) => s.selectedRoomId);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydration must happen in an effect, not during render, so the SSR/static
  // export markup and the first client render match before storage is read.
  useEffect(() => {
    const stored = loadHome(DEFAULT_PROJECT_ID);
    if (stored) hydrate(stored);
    else markHydrated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
