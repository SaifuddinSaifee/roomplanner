import { describe, expect, it } from "vitest";
import { isHomogeneousSelection } from "./selection";
import type { Item } from "./types";

function makeItem(overrides: Partial<Item> = {}): Item {
  return { id: "i1", catalog: "wardrobe", x: 0, y: 0, w: 30, d: 24, rot: 0, ...overrides };
}

describe("isHomogeneousSelection", () => {
  it("is false for an empty selection", () => {
    expect(isHomogeneousSelection([])).toBe(false);
  });

  it("is true for a single item", () => {
    expect(isHomogeneousSelection([makeItem()])).toBe(true);
  });

  it("is true for identical items at different positions", () => {
    const a = makeItem({ id: "a", x: 0, y: 0 });
    const b = makeItem({ id: "b", x: 50, y: 50 });
    expect(isHomogeneousSelection([a, b])).toBe(true);
  });

  it("ignores label differences", () => {
    const a = makeItem({ id: "a", label: "Wardrobe 1" });
    const b = makeItem({ id: "b", label: "Wardrobe 2" });
    expect(isHomogeneousSelection([a, b])).toBe(true);
  });

  it("is false when catalog differs", () => {
    const a = makeItem({ id: "a", catalog: "wardrobe" });
    const b = makeItem({ id: "b", catalog: "bookshelf" });
    expect(isHomogeneousSelection([a, b])).toBe(false);
  });

  it("is false when width or depth differs", () => {
    const a = makeItem({ id: "a", w: 30 });
    const b = makeItem({ id: "b", w: 36 });
    expect(isHomogeneousSelection([a, b])).toBe(false);
  });

  it("is false when rotation differs", () => {
    const a = makeItem({ id: "a", rot: 0 });
    const b = makeItem({ id: "b", rot: 90 });
    expect(isHomogeneousSelection([a, b])).toBe(false);
  });
});
