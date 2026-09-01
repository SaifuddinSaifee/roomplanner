"use client";

import type { ReactNode } from "react";

import type { Issue } from "@/src/validate/rules";
import { useStore } from "@/src/store/useStore";
import { Catalog } from "./Catalog";
import { Inspector } from "./Inspector";
import { Issues } from "./Issues";
import { RoomList } from "./RoomList";
import { RoomSettings } from "./RoomSettings";
import { Summary } from "./Summary";

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="mb-2.5 overflow-hidden rounded-xl border border-line bg-white/80">
      <summary className="cursor-pointer select-none px-3.5 py-3 text-sm font-bold">{title}</summary>
      <div className="px-3.5 pb-4">{children}</div>
    </details>
  );
}

interface SidebarProps {
  issues: Issue[];
}

export function Sidebar({ issues }: SidebarProps) {
  const rooms = useStore((s) => s.home.rooms);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const room = rooms.find((r) => r.id === selectedRoomId);

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-r border-line bg-panel/90 p-5">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-accent">Room Planner</p>
      <h1 className="mb-4 font-serif text-[26px] font-medium leading-tight">Plan your home</h1>

      <Section title="Rooms">
        <RoomList />
      </Section>

      {room && (
        <>
          <Section title="Room size & doors">
            <RoomSettings />
          </Section>

          <Section title="Add furniture">
            <Catalog />
          </Section>

          <Section title="Selected item">
            <Inspector />
          </Section>

          <Section title="Fit check">
            <Issues issues={issues} />
          </Section>
        </>
      )}

      <Section title="Home summary" defaultOpen={false}>
        <Summary />
      </Section>
    </aside>
  );
}
