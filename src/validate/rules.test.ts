import { describe, expect, it } from "vitest";
import type { Item, Room } from "@/src/model/types";
import { validateRoom } from "./rules";

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "r1",
    name: "Test room",
    type: "bedroom",
    width: 120,
    depth: 120,
    openings: [],
    items: [],
    ...overrides,
  };
}

function makeItem(overrides: Partial<Item>): Item {
  return { id: "i1", catalog: "coffee_table", x: 0, y: 0, w: 20, d: 20, rot: 0, ...overrides };
}

describe("validateRoom", () => {
  it("reports no issues for a clean layout", () => {
    const room = makeRoom({
      items: [makeItem({ id: "a", x: 0, y: 0, w: 20, d: 20 })],
    });
    expect(validateRoom(room)).toEqual([]);
  });

  it("flags overlapping items", () => {
    const room = makeRoom({
      items: [
        makeItem({ id: "a", x: 0, y: 0, w: 20, d: 20 }),
        makeItem({ id: "b", x: 10, y: 10, w: 20, d: 20 }),
      ],
    });
    const issues = validateRoom(room);
    expect(issues.some((i) => i.ruleId === "overlap" && i.itemIds.includes("a") && i.itemIds.includes("b"))).toBe(
      true
    );
  });

  it("flags an item extending past a wall", () => {
    const room = makeRoom({
      items: [makeItem({ id: "a", x: 110, y: 0, w: 20, d: 20 })],
    });
    const issues = validateRoom(room);
    expect(issues.some((i) => i.ruleId === "out-of-bounds" && i.itemIds.includes("a"))).toBe(true);
  });

  it("flags an item blocking a door opening", () => {
    const room = makeRoom({
      openings: [{ id: "o1", wall: "south", offset: 40, width: 30, kind: "door" }],
      items: [makeItem({ id: "a", catalog: "sofa_3", x: 40, y: 100, w: 30, d: 20 })],
    });
    const issues = validateRoom(room);
    expect(issues.some((i) => i.ruleId === "blocks-opening" && i.itemIds.includes("a"))).toBe(true);
  });

  it("flags an obstructed clearance zone", () => {
    // wardrobe against the north wall (front faces south / +y), clearance 30in;
    // a second item sits directly in that clearance zone.
    const room = makeRoom({
      items: [
        makeItem({ id: "wardrobe", catalog: "wardrobe", x: 0, y: 0, w: 30, d: 24, rot: 0 }),
        makeItem({ id: "blocker", catalog: "coffee_table", x: 0, y: 30, w: 20, d: 10, rot: 0 }),
      ],
    });
    const issues = validateRoom(room);
    expect(
      issues.some((i) => i.ruleId === "clearance" && i.itemIds.includes("wardrobe") && i.itemIds.includes("blocker"))
    ).toBe(true);
  });

  it("does not flag clearance when the zone is clear", () => {
    const room = makeRoom({
      items: [makeItem({ id: "wardrobe", catalog: "wardrobe", x: 0, y: 0, w: 30, d: 24, rot: 0 })],
    });
    const issues = validateRoom(room);
    expect(issues.some((i) => i.ruleId === "clearance")).toBe(false);
  });

  it("flags no walkway when a full-width barrier separates the openings", () => {
    // West opening near the top, east opening near the bottom, and a
    // furniture wall spanning the full room width between them — there is
    // no way around it, so the two doors are not mutually reachable.
    const room = makeRoom({
      width: 120,
      depth: 120,
      openings: [
        { id: "o1", wall: "west", offset: 10, width: 30, kind: "door" },
        { id: "o2", wall: "east", offset: 80, width: 30, kind: "door" },
      ],
      items: [makeItem({ id: "barrier", catalog: "counter_run", x: 0, y: 55, w: 120, d: 10, rot: 0 })],
    });
    const issues = validateRoom(room);
    expect(issues.some((i) => i.ruleId === "walkway")).toBe(true);
  });

  it("does not flag walkway when a clear corridor connects the openings", () => {
    const room = makeRoom({
      width: 120,
      depth: 120,
      openings: [
        { id: "o1", wall: "west", offset: 10, width: 30, kind: "door" },
        { id: "o2", wall: "east", offset: 10, width: 30, kind: "door" },
      ],
      items: [],
    });
    const issues = validateRoom(room);
    expect(issues.some((i) => i.ruleId === "walkway")).toBe(false);
  });

  it("does not require a walkway to or between windows", () => {
    // A single door plus a window shouldn't trigger "no walkway" — a window
    // isn't a place you walk through, so it's not a walkway endpoint.
    const room = makeRoom({
      width: 120,
      depth: 120,
      openings: [
        { id: "o1", wall: "west", offset: 10, width: 30, kind: "door" },
        { id: "o2", wall: "east", offset: 10, width: 30, kind: "window" },
      ],
      items: [],
    });
    const issues = validateRoom(room);
    expect(issues.some((i) => i.ruleId === "walkway")).toBe(false);
  });
});
