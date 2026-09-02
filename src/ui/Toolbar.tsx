"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import {
  copyPlanJpgToClipboard,
  copyPlanPngToClipboard,
  copyPlanSvgToClipboard,
  copyTextToClipboard,
  downloadBlob,
  downloadFileBlob,
  planSvgToPngBlob,
  serializePlanSvg,
} from "@/src/store/download";
import { useStore } from "@/src/store/useStore";
import { Dropdown, ToolbarMenu } from "@/src/ui/ToolbarMenu";

type CopyFormat = "png" | "jpg" | "svg" | "json";
type ExportFormat = "png" | "svg" | "json" | "png-2x" | "png-4x";

/** Print-view toggles, round-tripped to `/print` as query params since it opens in a separate tab/document. */
interface PrintOptions {
  hideRemarks: boolean;
}

const DEFAULT_PRINT_OPTIONS: PrintOptions = { hideRemarks: false };

function printHref(options: PrintOptions): string {
  const params = new URLSearchParams();
  if (options.hideRemarks) params.set("hideRemarks", "1");
  const qs = params.toString();
  return qs ? `/print?${qs}` : "/print";
}

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
  const [status, setStatus] = useState<string | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [printOptions, setPrintOptions] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS);

  function flashStatus(message: string) {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setStatus(message);
    statusTimer.current = setTimeout(() => setStatus(null), 1800);
  }

  function roomFilename(tail: string): string {
    const room = home.rooms.find((r) => r.id === selectedRoomId);
    const base = room?.name.toLowerCase().replace(/\s+/g, "-") ?? "room";
    return `${base}${tail}`;
  }

  async function handleCopy(format: CopyFormat) {
    const ok =
      format === "png"
        ? await copyPlanPngToClipboard()
        : format === "jpg"
          ? await copyPlanJpgToClipboard()
          : format === "svg"
            ? await copyPlanSvgToClipboard()
            : await copyTextToClipboard(JSON.stringify(home, null, 2));
    flashStatus(ok ? `Copied ${format.toUpperCase()}` : `Copy ${format.toUpperCase()} failed`);
  }

  async function handleExport(format: ExportFormat) {
    if (format === "json") {
      downloadBlob(JSON.stringify(home, null, 2), "application/json", "roomplanner-project.json");
      return;
    }
    if (format === "svg") {
      const svg = serializePlanSvg();
      if (!svg) {
        flashStatus("Nothing to export");
        return;
      }
      downloadBlob(svg, "image/svg+xml;charset=utf-8", roomFilename(".svg"));
      return;
    }
    const scale = format === "png-4x" ? 4 : format === "png-2x" ? 2 : 1;
    const suffix = format === "png-4x" ? "@4x" : format === "png-2x" ? "@2x" : "";
    const blob = await planSvgToPngBlob(scale);
    if (!blob) {
      flashStatus("Nothing to export");
      return;
    }
    downloadFileBlob(blob, roomFilename(`${suffix}.png`));
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

      <div className="mx-1 h-5 w-px bg-line" />

      <ToolbarMenu
        label="Copy"
        sections={[
          {
            items: [
              { key: "png", label: "PNG", onSelect: () => handleCopy("png") },
              { key: "jpg", label: "JPG", onSelect: () => handleCopy("jpg") },
              { key: "svg", label: "SVG", onSelect: () => handleCopy("svg") },
              { key: "json", label: "JSON", onSelect: () => handleCopy("json") },
            ],
          },
        ]}
      />

      <Dropdown label="Print">
        {(close) => (
          <div className="w-56">
            <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-muted">Options</div>
            <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft">
              <input
                type="checkbox"
                checked={printOptions.hideRemarks}
                onChange={(e) => setPrintOptions((prev) => ({ ...prev, hideRemarks: e.target.checked }))}
                className="h-3.5 w-3.5 rounded border-line accent-accent"
              />
              Remove remarks
            </label>
            <div className="mt-1 border-t border-line pt-1">
              <Link
                href={printHref(printOptions)}
                target="_blank"
                onClick={close}
                className="block px-3 py-1.5 text-left text-xs font-semibold text-accent hover:bg-accent-soft"
              >
                Open print view →
              </Link>
            </div>
          </div>
        )}
      </Dropdown>

      <ToolbarMenu
        label="Export"
        sections={[
          {
            items: [
              { key: "png", label: "PNG", onSelect: () => handleExport("png") },
              { key: "svg", label: "SVG", onSelect: () => handleExport("svg") },
              { key: "json", label: "JSON", onSelect: () => handleExport("json") },
            ],
          },
          {
            heading: "High-quality PNG",
            items: [
              { key: "png-2x", label: "2× original size", onSelect: () => handleExport("png-2x") },
              { key: "png-4x", label: "4× original size", onSelect: () => handleExport("png-4x") },
            ],
          },
        ]}
      />

      <button
        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-accent-soft"
        onClick={() => fileInputRef.current?.click()}
      >
        Import JSON
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />

      {status && <span className="text-xs font-medium text-muted">{status}</span>}

      <div className="ml-auto flex items-center gap-1.5">
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
