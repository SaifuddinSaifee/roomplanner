import { describe, expect, it } from "vitest";
import { computeScale, computeViewScale, DEFAULT_VIEW } from "./scale";

const room = { width: 120, depth: 138, items: [] };

describe("computeViewScale", () => {
  it("matches the auto-fit scale when zoom is 1 and pan is 0", () => {
    const fit = computeScale(room, 800, 600);
    const view = computeViewScale(room, 800, 600, DEFAULT_VIEW);
    expect(view.pxPerInch).toBeCloseTo(fit.pxPerInch);
    expect(view.originX).toBeCloseTo(fit.originX);
    expect(view.originY).toBeCloseTo(fit.originY);
  });

  it("doubling zoom doubles pxPerInch and keeps the room centered", () => {
    const fit = computeScale(room, 800, 600);
    const zoomed = computeViewScale(room, 800, 600, { zoom: 2, panX: 0, panY: 0 });
    expect(zoomed.pxPerInch).toBeCloseTo(fit.pxPerInch * 2);

    // The room's own center (in inches) should still land at the viewport center.
    const centerXPx = zoomed.originX + (room.width / 2) * zoomed.pxPerInch;
    const centerYPx = zoomed.originY + (room.depth / 2) * zoomed.pxPerInch;
    expect(centerXPx).toBeCloseTo(400);
    expect(centerYPx).toBeCloseTo(300);
  });

  it("panning shifts the origin by exactly the pan offset, independent of zoom", () => {
    const noPan = computeViewScale(room, 800, 600, { zoom: 1.5, panX: 0, panY: 0 });
    const panned = computeViewScale(room, 800, 600, { zoom: 1.5, panX: 40, panY: -15 });
    expect(panned.originX - noPan.originX).toBeCloseTo(40);
    expect(panned.originY - noPan.originY).toBeCloseTo(-15);
    expect(panned.pxPerInch).toBeCloseTo(noPan.pxPerInch);
  });
});
