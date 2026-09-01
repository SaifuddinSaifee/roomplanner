// All lengths in this file are integer inches unless noted otherwise.
// `units` is a display preference only — it never changes what is stored.

export type Units = "ft" | "mm";

export type Wall = "north" | "east" | "south" | "west";

export type OpeningKind = "door" | "sliding" | "opening";

export type RoomType =
  | "hall"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "balcony"
  | "other";

export type Rotation = 0 | 90 | 180 | 270;

export interface Opening {
  id: string;
  wall: Wall;
  /** Distance in inches from the wall's start corner to the opening's start. */
  offset: number;
  /** Opening width in inches, measured along the wall. */
  width: number;
  kind: OpeningKind;
}

export interface Item {
  id: string;
  catalog: string;
  /** Top-left of the unrotated footprint, inches from the room's interior top-left corner. */
  x: number;
  y: number;
  /** Unrotated footprint size, inches. */
  w: number;
  d: number;
  rot: Rotation;
  label?: string;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  /** Interior width (along north/south walls), inches. */
  width: number;
  /** Interior depth (along east/west walls), inches. */
  depth: number;
  openings: Opening[];
  items: Item[];
}

export interface Home {
  version: 1;
  name: string;
  units: Units;
  rooms: Room[];
}

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "hall", label: "Hall" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "balcony", label: "Balcony" },
  { value: "other", label: "Other" },
];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
