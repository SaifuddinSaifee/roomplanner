"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { Plan } from "@/src/render/Plan";
import { DEFAULT_PROJECT_ID, loadHome } from "@/src/store/persist";
import { useStore } from "@/src/store/useStore";
import { validateRoom } from "@/src/validate/rules";

function PrintPageContent() {
  const home = useStore((s) => s.home);
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const markHydrated = useStore((s) => s.markHydrated);
  const hideRemarks = useSearchParams().get("hideRemarks") === "1";

  useEffect(() => {
    const stored = loadHome(DEFAULT_PROJECT_ID);
    if (stored) hydrate(stored);
    else markHydrated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issuesByRoom = useMemo(
    () => Object.fromEntries(home.rooms.map((r) => [r.id, validateRoom(r)])),
    [home.rooms]
  );

  if (!hydrated) return null;

  return (
    <div className="bg-white">
      {home.rooms.map((room) => {
        const issues = issuesByRoom[room.id] ?? [];
        const issueItemIds = new Set(issues.flatMap((i) => i.itemIds));
        return (
          <section key={room.id} className="print-page flex h-[95vh] w-full flex-col p-6">
            <header className="mb-2 flex items-baseline justify-between">
              <h2 className="font-serif text-xl">{room.name}</h2>
              <span className="text-xs text-muted">
                {room.width}&quot; × {room.depth}&quot; · {room.items.length} items
              </span>
            </header>
            <div className="min-h-0 flex-1">
              <Plan room={room} units={home.units} issueItemIds={issueItemIds} interactive={false} />
            </div>
            {!hideRemarks && issues.length > 0 && (
              <ul className="mt-2 text-xs text-warn">
                {issues.map((issue) => (
                  <li key={issue.id}>{issue.message}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={null}>
      <PrintPageContent />
    </Suspense>
  );
}
