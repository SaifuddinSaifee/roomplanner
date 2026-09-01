import { nanoid } from "nanoid";
import { create } from "zustand";

import { catalogEntry } from "@/src/catalog/items";
import { makeDefaultHome } from "@/src/model/defaults";
import { migrate } from "@/src/model/migrate";
import type { Home, Item, Room, RoomType, Rotation, Units } from "@/src/model/types";

const HISTORY_LIMIT = 50;

interface StoreState {
  home: Home;
  selectedRoomId: string | null;
  selectedItemId: string | null;
  past: Home[];
  future: Home[];
  /** Snapshot taken at the start of a drag gesture; committed to history on drag end. */
  gestureSnapshot: Home | null;
  hydrated: boolean;

  hydrate: (home: Home) => void;
  markHydrated: () => void;

  selectRoom: (roomId: string | null) => void;
  selectItem: (itemId: string | null) => void;

  addRoom: (name: string, type: RoomType) => void;
  duplicateRoom: (roomId: string) => void;
  deleteRoom: (roomId: string) => void;
  renameRoom: (roomId: string, name: string) => void;

  addItem: (catalogId: string) => void;
  updateItem: (itemId: string, patch: Partial<Pick<Item, "x" | "y" | "w" | "d">>) => void;
  rotateItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;

  beginDrag: () => void;
  dragItemTo: (itemId: string, x: number, y: number) => void;
  endDrag: () => void;

  setUnits: (units: Units) => void;
  setHomeName: (name: string) => void;
  importHome: (raw: unknown) => void;
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

export const useStore = create<StoreState>((set) => ({
  home: makeDefaultHome(),
  selectedRoomId: null,
  selectedItemId: null,
  past: [],
  future: [],
  gestureSnapshot: null,
  hydrated: false,

  hydrate: (home) => set({ home, selectedRoomId: home.rooms[0]?.id ?? null, selectedItemId: null, hydrated: true }),
  markHydrated: () => set({ hydrated: true }),

  selectRoom: (roomId) => set({ selectedRoomId: roomId, selectedItemId: null }),
  selectItem: (itemId) => set({ selectedItemId: itemId }),

  addRoom: (name, type) =>
    set((state) => {
      const room: Room = { id: nanoid(8), name, type, width: 120, depth: 120, openings: [], items: [] };
      return {
        past: pushHistory(state),
        future: [],
        home: { ...state.home, rooms: [...state.home.rooms, room] },
        selectedRoomId: room.id,
        selectedItemId: null,
      };
    }),

  duplicateRoom: (roomId) =>
    set((state) => {
      const room = currentRoom(state.home, roomId);
      if (!room) return {};
      const idMap = new Map<string, string>();
      const clone: Room = {
        ...room,
        id: nanoid(8),
        name: `${room.name} copy`,
        openings: room.openings.map((o) => ({ ...o, id: nanoid(8) })),
        items: room.items.map((item) => {
          const newId = nanoid(8);
          idMap.set(item.id, newId);
          return { ...item, id: newId };
        }),
      };
      const index = state.home.rooms.findIndex((r) => r.id === roomId);
      const rooms = [...state.home.rooms];
      rooms.splice(index + 1, 0, clone);
      return {
        past: pushHistory(state),
        future: [],
        home: { ...state.home, rooms },
        selectedRoomId: clone.id,
        selectedItemId: null,
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
        selectedItemId: wasSelected ? null : state.selectedItemId,
      };
    }),

  renameRoom: (roomId, name) =>
    set((state) => ({
      past: pushHistory(state),
      future: [],
      home: withRoom(state.home, roomId, (r) => ({ ...r, name })),
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
        selectedItemId: item.id,
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

  rotateItem: (itemId) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId) return {};
      const room = currentRoom(state.home, roomId);
      const item = room?.items.find((it) => it.id === itemId);
      if (!room || !item) return {};

      // footprint()'s center is derived from x/y/w/d alone, so it is already
      // invariant under rot — no position adjustment needed here.
      const nextRot = (((item.rot + 90) % 360) as Rotation);

      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          items: r.items.map((it) => (it.id === itemId ? { ...it, rot: nextRot } : it)),
        })),
      };
    }),

  deleteItem: (itemId) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId) return {};
      return {
        past: pushHistory(state),
        future: [],
        home: withRoom(state.home, roomId, (r) => ({ ...r, items: r.items.filter((it) => it.id !== itemId) })),
        selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      };
    }),

  beginDrag: () => set((state) => ({ gestureSnapshot: state.gestureSnapshot ?? state.home })),

  dragItemTo: (itemId, x, y) =>
    set((state) => {
      const roomId = state.selectedRoomId;
      if (!roomId) return {};
      return {
        home: withRoom(state.home, roomId, (r) => ({
          ...r,
          items: r.items.map((it) => (it.id === itemId ? { ...it, x, y } : it)),
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
    set({ home, selectedRoomId: home.rooms[0]?.id ?? null, selectedItemId: null, past: [], future: [] });
  },

  resetHome: () => {
    const home = makeDefaultHome();
    set({ home, selectedRoomId: home.rooms[0]?.id ?? null, selectedItemId: null, past: [], future: [] });
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
