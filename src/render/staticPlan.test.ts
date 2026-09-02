import { describe, expect, it } from "vitest";

import { makeDefaultBedroom } from "@/src/model/defaults";
import type { Room } from "@/src/model/types";
import { renderHousePlanSvg, renderRoomPlanSvg } from "./staticPlan";

describe("renderRoomPlanSvg", () => {
  it("renders a standalone SVG document for one room", () => {
    const room = makeDefaultBedroom();
    const { markup, width, height } = renderRoomPlanSvg(room, "ft");

    expect(markup).toMatch(/^<\?xml/);
    expect(markup).toContain("<svg");
    expect(markup).toContain(`viewBox="0 0 ${width} ${height}"`);
    expect(markup).toContain(room.name);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  it("expands beyond the room rectangle to include an out-of-bounds item, without cropping it", () => {
    const base = makeDefaultBedroom();
    const withOverhang: Room = {
      ...base,
      items: [...base.items, { id: "i-loft", catalog: "loft_storage", x: 0, y: -84, w: 111, d: 84, rot: 0 }],
    };
    const inBounds = renderRoomPlanSvg(base, "ft");
    const overhung = renderRoomPlanSvg(withOverhang, "ft");
    expect(overhung.height).toBeGreaterThan(inBounds.height);
  });
});

describe("renderHousePlanSvg", () => {
  it("returns null for an empty house", () => {
    expect(renderHousePlanSvg([], "ft")).toBeNull();
  });

  it("stacks every room's name and markup into one SVG document, taller than any single room alone", () => {
    const roomA = { ...makeDefaultBedroom(), id: "a", name: "Bedroom A" };
    const roomB = { ...makeDefaultBedroom(), id: "b", name: "Bedroom B" };
    const combined = renderHousePlanSvg([roomA, roomB], "ft");
    const single = renderRoomPlanSvg(roomA, "ft");

    expect(combined).not.toBeNull();
    expect(combined!.markup).toContain("Bedroom A");
    expect(combined!.markup).toContain("Bedroom B");
    expect(combined!.height).toBeGreaterThan(single.height);
  });
});
