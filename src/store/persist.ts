import { migrate } from "@/src/model/migrate";
import type { Home } from "@/src/model/types";

// Small adapter so swapping localStorage for a backend later is one file.
// Every access is wrapped: storage genuinely throws in private windows and
// sandboxed embeds (e.g. this app running inside a Claude artifact).

const KEY_PREFIX = "roomplanner:";

function storageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadHome(projectId: string): Home | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + projectId);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveHome(projectId: string, home: Home): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(KEY_PREFIX + projectId, JSON.stringify(home));
  } catch {
    // Storage full, disabled, or unavailable — autosave silently no-ops.
  }
}

export function clearHome(projectId: string): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(KEY_PREFIX + projectId);
  } catch {
    // ignore
  }
}

export const DEFAULT_PROJECT_ID = "default";
