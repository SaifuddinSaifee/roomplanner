"use client";

import Link from "next/link";
import { useRef } from "react";
import type { ChangeEvent } from "react";

import { downloadBlob, serializePlanSvg } from "@/src/store/download";
import { useStore } from "@/src/store/useStore";

export function Toolbar() {
  const home = useStore((s) => s.home);
  const units = useStore((s) => s.home.units);
  const setUnits = useStore((s) => s.setUnits);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const importHome = useStore((s) => s.importHome);
  const resetHome = useStore((s) => s.resetHome);
  const selectedRoomId = useStore((s) => s.selectedRoomId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportJson() {
    downloadBlob(JSON.stringify(home, null, 2), "application/json", "roomplanner-project.json");
  }

  function exportSvg() {
    const svg = serializePlanSvg();
    if (!svg) return;
    const room = home.rooms.find((r) => r.id === selectedRoomId);
    const filename = `${room?.name.toLowerCase().replace(/\s+/g, "-") ?? "room"}.svg`;
    downloadBlob(svg, "image/svg+xml;charset=utf-8", filename);
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        importHome(JSON.parse(text));
      } catch {
        // Malformed JSON — migrate() would also reject, so just no-op here.
      }
    });
    e.target.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-panel px-4 py-2.5">
      <div className="flex overflow-hidden rounded-lg border border-line">
        <button
          className={`px-2.5 py-1 text-xs font-semibold ${units === "ft" ? "bg-accent text-white" : "bg-white text-ink"}`}
          onClick={() => setUnits("ft")}
        >
          ft-in
        </button>
        <button
          className={`px-2.5 py-1 text-xs font-semibold ${units === "mm" ? "bg-accent text-white" : "bg-white text-ink"}`}
          onClick={() => setUnits("mm")}
        >
          mm
        </button>
      </div>

      <button
        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
        disabled={!canUndo}
        onClick={undo}
      >
        Undo
      </button>
      <button
        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
        disabled={!canRedo}
        onClick={redo}
      >
        Redo
      </button>

      <div className="mx-1 h-5 w-px bg-line" />

      <button className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft" onClick={exportSvg}>
        Export SVG
      </button>
      <button className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft" onClick={exportJson}>
        Export JSON
      </button>
      <button
        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft"
        onClick={() => fileInputRef.current?.click()}
      >
        Import JSON
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
      <Link
        href="/print"
        target="_blank"
        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft"
      >
        Print
      </Link>

      <div className="ml-auto">
        <button
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
          onClick={() => {
            if (confirm("Reset to the default home? This clears all rooms.")) resetHome();
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
