import { nanoid } from "nanoid";
import { create } from "zustand";

import { catalogEntry } from "@/src/catalog/items";
import { makeDefaultHome } from "@/src/model/defaults";
import { clamp, wallLength } from "@/src/model/geometry";
import { migrate } from "@/src/model/migrate";
import { makeRoomId } from "@/src/model/slug";
import type { Home, Item, Opening, Room, RoomType, Rotation, Units } from "@/src/model/types";

const HISTORY_LIMIT = 50;
const PASTE_OFFSET = 12; // inches — visibly offsets a paste/duplicate from its source

interface StoreState {
  home: Home;
  selectedRoomId: string | null;
  selectedItemIds: string[];
  /** In-memory clipboard, session-only — never persisted with the document. */
  clipboard: Item[];
  /** North-arrow orientation, in degrees — a view preference, session-only like the clipboard, never written into `home` or exported project JSON. */
  compassRotation: number;
  past: Home[];
  future: Home[];
  /** Snapshot taken at the start of a drag gesture; committed to history on drag end. */
  gestureSnapshot: Home | null;
  hydrated: boolean;

  hydrate: (home: Home) => void;
  markHydrated: () => void;

  selectRoom: (roomId: string | null) => void;
  /** Replace the selection with just this item (or clear it, for null). */
  selectItem: (itemId: string | null) => void;
  /** Add/remove one item from the current selection — shift/cmd-click. */
  toggleItemSelection: (itemId: string) => void;
  /** Replace the selection with this exact set — used after paste/duplicate. */
  selectItems: (itemIds: string[]) => void;

  addRoom: (name: string, type: RoomType) => void;
  duplicateRoom: (roomId: string) => void;
  deleteRoom: (roomId: string) => void;
  renameRoom: (roomId: string, name: string) => void;
  resizeRoom: (roomId: string, patch: Partial<Pick<Room, "width" | "depth">>) => void;

  addOpening: (roomId: string) => void;
  updateOpening: (roomId: string, openingId: string, patch: Partial<Omit<Opening, "id">>) => void;
  deleteOpening: (roomId: string, openingId: string) => void;

  addItem: (catalogId: string) => void;
  /** Position edits are always per-item; width/depth may be applied to one item or shared across a homogeneous selection by the caller. */
  updateItem: (itemId: string, patch: Partial<Pick<Item, "x" | "y" | "w" | "d">>) => void;
  /** Apply the same width/depth patch to every currently selected item. */
  updateSelectedItems: (patch: Partial<Pick<Item, "w" | "d">>) => void;
  /** Shift every currently selected item by the same (dx, dy) — a rigid group move, coherent for any selection. */
  moveSelectedItems: (dx: number, dy: number) => void;
  rotateSelectedItems: () => void;
  deleteSelectedItems: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  duplicateSelection: () => void;
  /** Rotate the compass by 45°, wrapping at 360 — a display-only preference. */
  rotateCompass: () => void;

  beginDrag: () => void;
  /** Batch position update used by drag — one item, or a whole group moving together. */
  dragItemsTo: (positions: { id: string; x: number; y: number }[]) => void;
  endDrag: () => void;

  setUnits: (units: Units) => void;
  setHomeName: (name: string) => void;
  importHome: (raw: unknown) => void;
  /** Append rooms (e.g. from an imported file) to the current home, rather than replacing it — ids are regenerated so they never collide with existing rooms. */
  importRooms: (rooms: Room[]) => void;
  resetHome: () => void;

  undo: () => void;
  redo: () => void;
}

function currentRoom(home: Home, roomId: string | null): Room | undefined {
  return home.rooms.find((r) => r.id === roomId);
}

function withRoom(home: Home, roomId: string, fn: (room: Room) => Room): Home {
  return { ...home, rooms: home.rooms.map((r) => (r.id === roomId ? fn(r) : r)) };
}

const MIN_OPENING_WIDTH = 12; // inches

/** Keep an opening's offset/width within the (possibly just-resized) wall it sits on. */
function clampOpening(opening: Opening, room: Room): Opening {
  const length = wallLength(room, opening.wall);
  const width = clamp(opening.width, MIN_OPENING_WIDTH, Math.max(MIN_OPENING_WIDTH, length));
  const offset = clamp(opening.offset, 0, Math.max(0, length - width));
  return { ...opening, width, offset };
}

export const useStore = create<StoreState>((set) => ({
  home: makeDefaultHome(),
  selectedRoomId: null,
  selectedItemIds: [],
  clipboard: [],
  compassRotation: 0,
  past: [],
  future: [],
  gestureSnapshot: null,
  hydrated: false,

  hydrate: (home) => set({ home, selectedRoomId: home.rooms[0]?.id ?? null, selectedItemIds: [], hydrated: true }),
  // Called when there's nothing in storage yet, so the initial (default) home stands —
  // still needs a room selected, or the sidebar shows "add a room" despite one existing.
  markHydrated: () => set((state) => ({ hydrated: true, selectedRoomId: state.selectedRoomId ?? state.home.rooms[0]?.id ?? null })),

  selectRoom: (roomId) => set({ selectedRoomId: roomId, selectedItemIds: [] }),
  selectItem: (itemId) => set({ selectedItemIds: itemId ? [itemId] : [] }),
  toggleItemSelection: (itemId) =>
    set((state) => ({
      selectedItemIds: state.selectedItemIds.includes(itemId)
        ? state.selectedItemIds.filter((id) => id !== itemId)
        : [...state.selectedItemIds, itemId],
    })),
  selectItems: (itemIds) => set({ selectedItemIds: itemIds }),

  addRoom: (name, type) =>
    set((state) => {
      const room: Room = { id: makeRoomId(), name, type, width: 120, depth: 120, openings: [], items: [] };
      return {
        past: pushHistory(state),
        future: [],
        home: { ...state.home, rooms: [...state.home.rooms, room] },
        selectedRoomId: room.id,
        selectedItemIds: [],
      };
    }),

  duplicateRoom: (roomId) =>
    set((state) => {
      const room = currentRoom(state.home, roomId);
      if (!room) return {};
      const clone: Room = {
        ...room,
        id: makeRoomId(),
        name: `${room.name} copy`,
        openings: room.openings.map((o) => ({ ...o, id: nanoid(8) })),
        items: room.items.map((item) => ({ ...item, id: nanoid(8) })),
      };
      const index = state.home.rooms.findIndex((r) => r.id === roomId);
      const rooms = [...state.home.rooms];
      rooms.splice(index + 1, 0, clone);
      return {
        past: pushHistory(state),
        future: [],
        home: { ...state.home, rooms },
        selectedRoomId: clone.id,
        selectedItemIds: [],
      };
    }),

  deleteRoom: (roomId) =>
    set((state) => {
      const rooms = state.home.rooms.filter((r) => r.id !== roomId);
      const wasSelected = state.selectedRoomId === roomId;
      return {
        past: pushHistory(state),
        future: [],
        home: { ...state.home, rooms },
        selectedRoomId: wasSelected ? rooms[0]?.id ?? null : state.selectedRoomId,
        selectedItemIds: wasSelected ? [] : state.selectedItemIds,
      };
    }),

  renameRoom: (roomId, name) =>
    set((state) => ({
      past: pushHistory(state),
      future: [],
      home: withRoom(state.home, roomId, (r) => ({ ...r, name })),
    })),

  resizeRoom: (roomId, patch) =>
    set((state) => ({
      past: pushHistory(state),
      future: [],
      home: withRoom(state.home, roomId, (r) => {
        const resized: Room = {
          ...r,
          width: Math.max(1, patch.width ?? r.width),
          depth: Math.max(1, patch.depth ?? r.depth),
        };
        return { ...resized, openings: resized.openings.map((o) => clampOpening(o, resized)) };
      }),
    })),

  addOpening: (roomId) =>
    set((state) => {
      const room = currentRoom(state.home, roomId);
      if (!room) return {};
      const opening: Opening = clampOpening(
        { id: nanoid(8), wall: "south", offset: 0, width: 30, kind: "door" },
        room
      );
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({ ...r, openings: [...r.openings, opening] })),
      };
    }),

  updateOpening: (roomId, openingId, patch) =>
    set((state) => {
      const room = currentRoom(state.home, roomId);
      if (!room) return {};
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          openings: r.openings.map((o) => (o.id === openingId ? clampOpening({ ...o, ...patch }, r) : o)),
        })),
      };
    }),

  deleteOpening: (roomId, openingId) =>
    set((state) => ({
      past: pushHistory(state),
      future: [],
      home: withRoom(state.home, roomId, (r) => ({ ...r, openings: r.openings.filter((o) => o.id !== openingId) })),
    })),

  addItem: (catalogId) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId) return {};
      const room = currentRoom(state.home, roomId);
      if (!room) return {};
      const entry = catalogEntry(catalogId);
      if (!entry) return {};

      const w = Math.min(entry.defaultW, room.width);
      const d = Math.min(entry.defaultD, room.depth);
      const item: Item = {
        id: nanoid(8),
        catalog: catalogId,
        x: Math.max(0, Math.round((room.width - w) / 2)),
        y: Math.max(0, Math.round((room.depth - d) / 2)),
        w,
        d,
        rot: 0,
      };

      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({ ...r, items: [...r.items, item] })),
        selectedItemIds: [item.id],
      };
    }),

  updateItem: (itemId, patch) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId) return {};
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          items: r.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
        })),
      };
    }),

  updateSelectedItems: (patch) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId || state.selectedItemIds.length === 0) return {};
      const ids = new Set(state.selectedItemIds);
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          items: r.items.map((it) => (ids.has(it.id) ? { ...it, ...patch } : it)),
        })),
      };
    }),

  moveSelectedItems: (dx, dy) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId || state.selectedItemIds.length === 0 || (dx === 0 && dy === 0)) return {};
      const ids = new Set(state.selectedItemIds);
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          items: r.items.map((it) => (ids.has(it.id) ? { ...it, x: it.x + dx, y: it.y + dy } : it)),
        })),
      };
    }),

  rotateSelectedItems: () =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId || state.selectedItemIds.length === 0) return {};
      const ids = new Set(state.selectedItemIds);
      return {
        past: pushHistory(state),
        future: [],
        // footprint()'s center is derived from x/y/w/d alone, so it is
        // already invariant under rot — no position adjustment needed here.
        // Each item rotates independently around its own center, so this is
        // safe for any selection, homogeneous or not.
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          items: r.items.map((it) => (ids.has(it.id) ? { ...it, rot: (((it.rot + 90) % 360) as Rotation) } : it)),
        })),
      };
    }),

  deleteSelectedItems: () =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId || state.selectedItemIds.length === 0) return {};
      const ids = new Set(state.selectedItemIds);
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({ ...r, items: r.items.filter((it) => !ids.has(it.id)) })),
        selectedItemIds: [],
      };
    }),

  copySelection: () =>
    set((state) => {
      const roomId = state.selectedRoomId;
      const room = currentRoom(state.home, roomId);
      if (!room || state.selectedItemIds.length === 0) return {};
      const ids = new Set(state.selectedItemIds);
      const items = room.items.filter((it) => ids.has(it.id));
      if (items.length === 0) return {};
      return { clipboard: items.map((it) => ({ ...it })) };
    }),

  pasteClipboard: () =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId || state.clipboard.length === 0) return {};
      const newItems: Item[] = state.clipboard.map((item) => ({
        ...item,
        id: nanoid(8),
        x: item.x + PASTE_OFFSET,
        y: item.y + PASTE_OFFSET,
      }));
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({ ...r, items: [...r.items, ...newItems] })),
        selectedItemIds: newItems.map((it) => it.id),
        // Advance the clipboard to the just-pasted copies so repeated paste
        // cascades outward (12in, 24in, 36in...) instead of stacking exactly
        // on top of itself every time.
        clipboard: newItems,
      };
    }),

  duplicateSelection: () =>
    set((state) => {
      const roomId = state.selectedRoomId;
      const room = currentRoom(state.home, roomId);
      if (!roomId || !room || state.selectedItemIds.length === 0) return {};
      const ids = new Set(state.selectedItemIds);
      const selected = room.items.filter((it) => ids.has(it.id));
      if (selected.length === 0) return {};
      const newItems: Item[] = selected.map((item) => ({
        ...item,
        id: nanoid(8),
        x: item.x + PASTE_OFFSET,
        y: item.y + PASTE_OFFSET,
      }));
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({ ...r, items: [...r.items, ...newItems] })),
        selectedItemIds: newItems.map((it) => it.id),
      };
    }),

  rotateCompass: () => set((state) => ({ compassRotation: (state.compassRotation + 45) % 360 })),

  beginDrag: () => set((state) => ({ gestureSnapshot: state.gestureSnapshot ?? state.home })),

  dragItemsTo: (positions) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId) return {};
      const byId = new Map(positions.map((p) => [p.id, p]));
      return {
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          items: r.items.map((it) => {
            const p = byId.get(it.id);
            return p ? { ...it, x: p.x, y: p.y } : it;
          }),
        })),
      };
    }),

  endDrag: () =>
    set((state) => {
      const snapshot = state.gestureSnapshot;
      if (!snapshot) return { gestureSnapshot: null };
      if (snapshot === state.home) return { gestureSnapshot: null };
      return {
        past: [...state.past, snapshot].slice(-HISTORY_LIMIT),
        future: [],
        gestureSnapshot: null,
      };
    }),

  setUnits: (units) => set((state) => ({ home: { ...state.home, units } })),
  setHomeName: (name) => set((state) => ({ home: { ...state.home, name } })),

  importHome: (raw) => {
    const home = migrate(raw);
    set({ home, selectedRoomId: home.rooms[0]?.id ?? null, selectedItemIds: [], past: [], future: [] });
  },

  importRooms: (rooms) =>
    set((state) => {
      if (rooms.length === 0) return {};
      const cloned = rooms.map((room) => ({
        ...room,
        id: makeRoomId(),
        openings: room.openings.map((o) => ({ ...o, id: nanoid(8) })),
        items: room.items.map((item) => ({ ...item, id: nanoid(8) })),
      }));
      return {
        past: pushHistory(state),
        future: [],
        home: { ...state.home, rooms: [...state.home.rooms, ...cloned] },
        selectedRoomId: cloned[0].id,
        selectedItemIds: [],
      };
    }),

  resetHome: () => {
    const home = makeDefaultHome();
    set({ home, selectedRoomId: home.rooms[0]?.id ?? null, selectedItemIds: [], past: [], future: [] });
  },

  undo: () =>
    set((state) => {
      const prev = state.past[state.past.length - 1];
      if (!prev) return {};
      return {
        home: prev,
        past: state.past.slice(0, -1),
        future: [state.home, ...state.future].slice(0, HISTORY_LIMIT),
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return {};
      return {
        home: next,
        future: state.future.slice(1),
        past: [...state.past, state.home].slice(-HISTORY_LIMIT),
      };
    }),
}));

function pushHistory(state: StoreState): Home[] {
  return [...state.past, state.home].slice(-HISTORY_LIMIT);
}

export function selectRoomById(home: Home, roomId: string | null): Room | undefined {
  return currentRoom(home, roomId);
}
