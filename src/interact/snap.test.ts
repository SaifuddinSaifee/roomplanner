import { describe, expect, it } from "vitest";
import { snapFootprint, SNAP_TOLERANCE_IN } from "./snap";

describe("snapFootprint", () => {
  it("snaps to the near wall when within tolerance", () => {
    const rect = { x: SNAP_TOLERANCE_IN, y: 0, w: 10, h: 10 };
    const result = snapFootprint(rect, 100, 100, []);
    expect(result.x).toBe(0);
  });

  it("does not snap when just outside tolerance", () => {
    const rect = { x: SNAP_TOLERANCE_IN + 0.5, y: 0, w: 10, h: 10 };
    const result = snapFootprint(rect, 100, 100, []);
    expect(result.x).toBe(SNAP_TOLERANCE_IN + 0.5);
  });

  it("snaps exactly at the tolerance boundary", () => {
    const rect = { x: 0, y: SNAP_TOLERANCE_IN, w: 10, h: 10 };
    const result = snapFootprint(rect, 100, 100, []);
    expect(result.y).toBe(0);
  });

  it("snaps the far edge to the opposite wall", () => {
    const rect = { x: 100 - 10 - 2, y: 0, w: 10, h: 10 };
    const result = snapFootprint(rect, 100, 100, []);
    expect(result.x).toBe(90);
  });

  it("snaps to another item's edge", () => {
    const other = { x: 20, y: 0, w: 10, h: 10 };
    const rect = { x: 30 + 2, y: 0, w: 10, h: 10 };
    const result = snapFootprint(rect, 200, 200, [other]);
    expect(result.x).toBe(30);
  });

  it("leaves position untouched when no candidate is within tolerance", () => {
    const rect = { x: 50, y: 50, w: 10, h: 10 };
    const result = snapFootprint(rect, 200, 200, []);
    expect(result).toEqual({ x: 50, y: 50 });
  });
});
