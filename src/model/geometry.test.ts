import { describe, expect, it } from "vitest";
import { clearanceRect, footprint, rectInside, rectsOverlap, roomContentBounds } from "./geometry";
import type { Item } from "./types";

function makeItem(overrides: Partial<Item> = {}): Item {
  return { id: "i1", catalog: "wardrobe", x: 10, y: 20, w: 30, d: 24, rot: 0, ...overrides };
}

describe("footprint", () => {
  it("matches x/y/w/h at rotation 0", () => {
    expect(footprint(makeItem({ rot: 0 }))).toEqual({ x: 10, y: 20, w: 30, h: 24 });
  });

  it("swaps w/d at 90 and 270 while keeping the center fixed", () => {
    const base = makeItem({ rot: 0 });
    const centerX = base.x + base.w / 2;
    const centerY = base.y + base.d / 2;

    for (const rot of [90, 270] as const) {
      const fp = footprint(makeItem({ rot }));
      expect(fp.w).toBe(24);
      expect(fp.h).toBe(30);
      expect(fp.x + fp.w / 2).toBeCloseTo(centerX);
      expect(fp.y + fp.h / 2).toBeCloseTo(centerY);
    }
  });

  it("keeps w/d unswapped at 180, still centered the same as 0", () => {
    const fp0 = footprint(makeItem({ rot: 0 }));
    const fp180 = footprint(makeItem({ rot: 180 }));
    expect(fp180).toEqual(fp0);
  });
});

describe("roomContentBounds", () => {
  const room = { width: 120, depth: 90 };

  it("matches the room rectangle when every item sits inside it", () => {
    const items = [makeItem({ x: 10, y: 10, w: 30, d: 24 })];
    expect(roomContentBounds({ ...room, items })).toEqual({ x: 0, y: 0, w: 120, h: 90 });
  });

  it("expands to include an item placed outside the room, e.g. loft storage above the top wall", () => {
    const items = [makeItem({ x: 20, y: -84, w: 40, d: 84 })];
    expect(roomContentBounds({ ...room, items })).toEqual({ x: 0, y: -84, w: 120, h: 174 });
  });

  it("unions bounds across multiple out-of-bounds items on different sides", () => {
    const items = [
      makeItem({ id: "left", x: -30, y: 0, w: 30, d: 90 }),
      makeItem({ id: "right", x: 130, y: 0, w: 20, d: 90 }),
    ];
    expect(roomContentBounds({ ...room, items })).toEqual({ x: -30, y: 0, w: 180, h: 90 });
  });

  it("returns the bare room rectangle when there are no items", () => {
    expect(roomContentBounds({ ...room, items: [] })).toEqual({ x: 0, y: 0, w: 120, h: 90 });
  });
});

describe("rectsOverlap", () => {
  it("detects overlap", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });

  it("detects touching-but-not-overlapping as non-overlapping", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it("detects clearly separate rects as non-overlapping", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 100, y: 100, w: 10, h: 10 })).toBe(false);
  });

  it("epsilon treats near-touching as non-overlapping", () => {
    // 0.3in of overlap, below the 0.5in epsilon used by the overlap rule
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9.7, y: 0, w: 10, h: 10 }, 0.5)).toBe(false);
  });
});

describe("rectInside", () => {
  it("accepts a rect fully inside the outer bounds", () => {
    expect(rectInside({ x: 1, y: 1, w: 5, h: 5 }, { x: 0, y: 0, w: 10, h: 10 })).toBe(true);
  });

  it("rejects a rect extending past a wall", () => {
    expect(rectInside({ x: 8, y: 1, w: 5, h: 5 }, { x: 0, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it("accepts a rect exactly flush with the bounds", () => {
    expect(rectInside({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 0, w: 10, h: 10 })).toBe(true);
  });
});

describe("clearanceRect", () => {
  it("projects off the front face for each rotation", () => {
    const item = makeItem({ x: 0, y: 0, w: 30, d: 24, rot: 0 });
    expect(clearanceRect(item, 20)).toEqual({ x: 0, y: 24, w: 30, h: 20 });

    const rotated180 = makeItem({ x: 0, y: 0, w: 30, d: 24, rot: 180 });
    expect(clearanceRect(rotated180, 20)).toEqual({ x: 0, y: -20, w: 30, h: 20 });

    // rot 90/270 swap the footprint to w=24,h=30 centered on (15,12), i.e.
    // footprint {x:3, y:-3, w:24, h:30} — clearance projects off its left/right edge.
    const rotated90 = makeItem({ x: 0, y: 0, w: 30, d: 24, rot: 90 });
    expect(clearanceRect(rotated90, 20)).toEqual({ x: -17, y: -3, w: 20, h: 30 });

    const rotated270 = makeItem({ x: 0, y: 0, w: 30, d: 24, rot: 270 });
    expect(clearanceRect(rotated270, 20)).toEqual({ x: 27, y: -3, w: 20, h: 30 });
  });

  it("returns null for zero clearance", () => {
    expect(clearanceRect(makeItem(), 0)).toBeNull();
  });
});
