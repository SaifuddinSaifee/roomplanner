import type { Home, Room } from "./types";

/**
 * The original hardcoded bedroom from RoomPlanner.html, ported to data.
 * 9ft x 11.5ft room -> 108in x 138in. Wall convention: north = y=0 edge,
 * south = y=depth edge, west = x=0 edge, east = x=width edge; offsets run
 * left-to-right on north/south and top-to-bottom on west/east.
 */
export function makeDefaultBedroom(): Room {
  return {
    id: "bedroom-1",
    name: "Bedroom 1",
    type: "bedroom",
    width: 108,
    depth: 138,
    openings: [
      { id: "o-balcony", wall: "west", offset: 0, width: 60, kind: "sliding" },
      { id: "o-bathroom", wall: "east", offset: 40, width: 28, kind: "sliding" },
      { id: "o-entry", wall: "south", offset: 78, width: 24, kind: "door" },
    ],
    items: [
      { id: "i-wardrobe-1", catalog: "wardrobe", x: 0, y: 0, w: 30, d: 24, rot: 0, label: "Wardrobe 1" },
      { id: "i-desk", catalog: "study_desk", x: 30, y: 0, w: 48, d: 24, rot: 0 },
      { id: "i-wardrobe-2", catalog: "wardrobe", x: 78, y: 0, w: 30, d: 24, rot: 0, label: "Wardrobe 2" },
      { id: "i-bed", catalog: "bed_double", x: 18, y: 60, w: 54, d: 78, rot: 180 },
      { id: "i-bedside", catalog: "bedside_table", x: 0, y: 120, w: 18, d: 18, rot: 180 },
    ],
  };
}

export function makeDefaultHome(): Home {
  return {
    version: 1,
    name: "My home",
    units: "ft",
    rooms: [makeDefaultBedroom()],
  };
}
