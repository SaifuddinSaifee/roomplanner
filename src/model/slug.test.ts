import { describe, expect, it } from "vitest";
import { isRoomId, makeRoomId, roomIdFromPath, roomUrlSlug } from "./slug";

describe("makeRoomId", () => {
  it("generates 7-character lowercase alphanumeric ids", () => {
    for (let i = 0; i < 200; i += 1) {
      const id = makeRoomId();
      expect(id).toMatch(/^[a-z0-9]{7}$/);
      expect(isRoomId(id)).toBe(true);
    }
  });
});

describe("roomUrlSlug", () => {
  it("appends the room id after a slugified name", () => {
    expect(roomUrlSlug({ id: "a3f9k2p", name: "Living Room" })).toBe("living-room-a3f9k2p");
  });

  it("collapses punctuation and mixed case", () => {
    expect(roomUrlSlug({ id: "a3f9k2p", name: "Kid's  Room! #2" })).toBe("kid-s-room-2-a3f9k2p");
  });

  it("falls back to 'room' for a name with no sluggable characters", () => {
    expect(roomUrlSlug({ id: "a3f9k2p", name: "!!!" })).toBe("room-a3f9k2p");
  });
});

describe("roomIdFromPath", () => {
  it("recovers the id from a full slug path", () => {
    expect(roomIdFromPath("/living-room-a3f9k2p")).toBe("a3f9k2p");
  });

  it("recovers the id when the name has no dashes", () => {
    expect(roomIdFromPath("/room-a3f9k2p")).toBe("a3f9k2p");
  });

  it("returns null for the root path", () => {
    expect(roomIdFromPath("/")).toBeNull();
  });

  it("returns null when the trailing segment isn't a valid room id", () => {
    expect(roomIdFromPath("/living-room-tooshort")).toBeNull();
    expect(roomIdFromPath("/living-room-a3f9k2pxx")).toBeNull();
    expect(roomIdFromPath("/living-room-UPPER12")).toBeNull();
  });

  it("returns null for unrelated static routes", () => {
    expect(roomIdFromPath("/print")).toBeNull();
  });
});
