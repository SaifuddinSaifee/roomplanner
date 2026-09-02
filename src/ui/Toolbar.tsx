"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { renderHousePlanSvg, renderRoomPlanSvg, type RenderedSvg } from "@/src/render/staticPlan";
import {
  copyImageBlobToClipboard,
  copyTextToClipboard,
  downloadBlob,
  downloadFileBlob,
  svgMarkupToJpgBlob,
  svgMarkupToPngBlob,
} from "@/src/store/download";
import { useStore } from "@/src/store/useStore";
import { Dropdown, ToolbarMenu } from "@/src/ui/ToolbarMenu";

type Scope = "room" | "house";
type CopyFormat = "png" | "jpg" | "svg" | "json";
type ExportFormat = "png" | "png-2x" | "png-4x" | "svg" | "json";

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

function slug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-") || "untitled";
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

  const selectedRoom = home.rooms.find((r) => r.id === selectedRoomId);
  const hasRooms = home.rooms.length > 0;

  function flashStatus(message: string) {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setStatus(message);
    statusTimer.current = setTimeout(() => setStatus(null), 1800);
  }

  /** Renders the requested scope as a standalone SVG — independent of the live canvas's current zoom/pan/container size. */
  function getRenderedSvg(scope: Scope): RenderedSvg | null {
    if (scope === "room") return selectedRoom ? renderRoomPlanSvg(selectedRoom, units) : null;
    return renderHousePlanSvg(home.rooms, units);
  }

  function scopedHomeJson(scope: Scope): string | null {
    if (scope === "house") return JSON.stringify(home, null, 2);
    if (!selectedRoom) return null;
    return JSON.stringify({ version: 1, name: selectedRoom.name, units, rooms: [selectedRoom] }, null, 2);
  }

  async function handleCopy(scope: Scope, format: CopyFormat) {
    if (format === "json") {
      const text = scopedHomeJson(scope);
      if (!text) {
        flashStatus("No room selected");
        return;
      }
      flashStatus((await copyTextToClipboard(text)) ? "Copied JSON" : "Copy JSON failed");
      return;
    }

    const rendered = getRenderedSvg(scope);
    if (!rendered) {
      flashStatus(scope === "room" ? "No room selected" : "No rooms to copy");
      return;
    }

    if (format === "svg") {
      flashStatus((await copyTextToClipboard(rendered.markup)) ? "Copied SVG" : "Copy SVG failed");
      return;
    }

    const blob =
      format === "png"
        ? await svgMarkupToPngBlob(rendered.markup, rendered.width, rendered.height, 2)
        : await svgMarkupToJpgBlob(rendered.markup, rendered.width, rendered.height, 2);
    const ok = await copyImageBlobToClipboard(blob, format === "png" ? "image/png" : "image/jpeg");
    flashStatus(ok ? `Copied ${format.toUpperCase()}` : `Copy ${format.toUpperCase()} failed`);
  }

  async function handleExport(scope: Scope, format: ExportFormat) {
    if (format === "json") {
      const text = scopedHomeJson(scope);
      if (!text) {
        flashStatus("No room selected");
        return;
      }
      const filename = scope === "room" ? `${slug(selectedRoom!.name)}.json` : "roomplanner-project.json";
      downloadBlob(text, "application/json", filename);
      return;
    }

    const rendered = getRenderedSvg(scope);
    if (!rendered) {
      flashStatus(scope === "room" ? "No room selected" : "No rooms to export");
      return;
    }
    const filenameBase = scope === "room" ? slug(selectedRoom!.name) : slug(home.name || "house-plan");

    if (format === "svg") {
      downloadBlob(rendered.markup, "image/svg+xml;charset=utf-8", `${filenameBase}.svg`);
      return;
    }

    const scaleFactor = format === "png-4x" ? 4 : format === "png-2x" ? 2 : 1;
    const suffix = format === "png-4x" ? "@4x" : format === "png-2x" ? "@2x" : "";
    const blob = await svgMarkupToPngBlob(rendered.markup, rendered.width, rendered.height, scaleFactor);
    if (!blob) {
      flashStatus("Export failed");
      return;
    }
    downloadFileBlob(blob, `${filenameBase}${suffix}.png`);
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
            heading: "Current room",
            items: [
              { key: "room-png", label: "PNG", disabled: !selectedRoom, onSelect: () => handleCopy("room", "png") },
              { key: "room-jpg", label: "JPG", disabled: !selectedRoom, onSelect: () => handleCopy("room", "jpg") },
              { key: "room-svg", label: "SVG", disabled: !selectedRoom, onSelect: () => handleCopy("room", "svg") },
              { key: "room-json", label: "JSON", disabled: !selectedRoom, onSelect: () => handleCopy("room", "json") },
            ],
          },
          {
            heading: "Complete house plan",
            items: [
              { key: "house-png", label: "PNG", disabled: !hasRooms, onSelect: () => handleCopy("house", "png") },
              { key: "house-jpg", label: "JPG", disabled: !hasRooms, onSelect: () => handleCopy("house", "jpg") },
              { key: "house-svg", label: "SVG", disabled: !hasRooms, onSelect: () => handleCopy("house", "svg") },
              { key: "house-json", label: "JSON", disabled: !hasRooms, onSelect: () => handleCopy("house", "json") },
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
            heading: "Current room",
            items: [
              { key: "room-png", label: "PNG", disabled: !selectedRoom, onSelect: () => handleExport("room", "png") },
              {
                key: "room-png-2x",
                label: "PNG — 2× (high quality)",
                disabled: !selectedRoom,
                onSelect: () => handleExport("room", "png-2x"),
              },
              {
                key: "room-png-4x",
                label: "PNG — 4× (high quality)",
                disabled: !selectedRoom,
                onSelect: () => handleExport("room", "png-4x"),
              },
              { key: "room-svg", label: "SVG", disabled: !selectedRoom, onSelect: () => handleExport("room", "svg") },
              { key: "room-json", label: "JSON", disabled: !selectedRoom, onSelect: () => handleExport("room", "json") },
            ],
          },
          {
            heading: "Complete house plan",
            items: [
              { key: "house-png", label: "PNG", disabled: !hasRooms, onSelect: () => handleExport("house", "png") },
              {
                key: "house-png-2x",
                label: "PNG — 2× (high quality)",
                disabled: !hasRooms,
                onSelect: () => handleExport("house", "png-2x"),
              },
              {
                key: "house-png-4x",
                label: "PNG — 4× (high quality)",
                disabled: !hasRooms,
                onSelect: () => handleExport("house", "png-4x"),
              },
              { key: "house-svg", label: "SVG", disabled: !hasRooms, onSelect: () => handleExport("house", "svg") },
              { key: "house-json", label: "JSON", disabled: !hasRooms, onSelect: () => handleExport("house", "json") },
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
