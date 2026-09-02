import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./useStore";

function resetStore() {
  useStore.getState().resetHome();
  useStore.setState({ clipboard: [] });
}

function currentRoom() {
  const { home, selectedRoomId } = useStore.getState();
  const room = home.rooms.find((r) => r.id === selectedRoomId);
  if (!room) throw new Error("no selected room");
  return room;
}

describe("useStore selection and clipboard", () => {
  beforeEach(resetStore);

  it("toggleItemSelection adds and removes items from the selection", () => {
    const room = currentRoom();
    const [a, b] = room.items;

    useStore.getState().selectItem(a.id);
    expect(useStore.getState().selectedItemIds).toEqual([a.id]);

    useStore.getState().toggleItemSelection(b.id);
    expect(useStore.getState().selectedItemIds).toEqual([a.id, b.id]);

    useStore.getState().toggleItemSelection(b.id);
    expect(useStore.getState().selectedItemIds).toEqual([a.id]);
  });

  it("deleteSelectedItems removes every selected item and clears the selection", () => {
    const room = currentRoom();
    const [a, b] = room.items;
    const countBefore = room.items.length;

    useStore.getState().selectItem(a.id);
    useStore.getState().toggleItemSelection(b.id);
    useStore.getState().deleteSelectedItems();

    const after = currentRoom();
    expect(after.items).toHaveLength(countBefore - 2);
    expect(after.items.find((i) => i.id === a.id)).toBeUndefined();
    expect(after.items.find((i) => i.id === b.id)).toBeUndefined();
    expect(useStore.getState().selectedItemIds).toEqual([]);
  });

  it("rotateSelectedItems rotates every selected item independently", () => {
    const room = currentRoom();
    const [a, b] = room.items;
    const rotA = a.rot;
    const rotB = b.rot;

    useStore.getState().selectItem(a.id);
    useStore.getState().toggleItemSelection(b.id);
    useStore.getState().rotateSelectedItems();

    const after = currentRoom();
    expect(after.items.find((i) => i.id === a.id)?.rot).toBe((rotA + 90) % 360);
    expect(after.items.find((i) => i.id === b.id)?.rot).toBe((rotB + 90) % 360);
  });

  it("duplicateSelection clones the item with a fresh id and an offset position", () => {
    const room = currentRoom();
    const original = room.items[0];

    useStore.getState().selectItem(original.id);
    useStore.getState().duplicateSelection();

    const after = currentRoom();
    expect(after.items).toHaveLength(room.items.length + 1);
    const newIds = useStore.getState().selectedItemIds;
    expect(newIds).toHaveLength(1);
    const clone = after.items.find((i) => i.id === newIds[0]);
    expect(clone).toBeDefined();
    expect(clone!.id).not.toBe(original.id);
    expect(clone!.catalog).toBe(original.catalog);
    expect(clone!.w).toBe(original.w);
    expect(clone!.d).toBe(original.d);
    expect(clone!.x).toBe(original.x + 12);
    expect(clone!.y).toBe(original.y + 12);
  });

  it("copySelection + pasteClipboard carries an item into a different room", () => {
    const roomA = currentRoom();
    const original = roomA.items[0];

    useStore.getState().selectItem(original.id);
    useStore.getState().copySelection();
    expect(useStore.getState().clipboard).toHaveLength(1);

    useStore.getState().addRoom("Hall", "hall");
    const roomB = currentRoom();
    expect(roomB.id).not.toBe(roomA.id);
    expect(roomB.items).toHaveLength(0);

    useStore.getState().pasteClipboard();

    const roomBAfter = currentRoom();
    expect(roomBAfter.items).toHaveLength(1);
    expect(roomBAfter.items[0].catalog).toBe(original.catalog);
    expect(roomBAfter.items[0].id).not.toBe(original.id);

    // The source room and item are untouched by copy.
    const roomAAfter = useStore.getState().home.rooms.find((r) => r.id === roomA.id)!;
    expect(roomAAfter.items.find((i) => i.id === original.id)).toEqual(original);
  });

  it("pasting repeatedly cascades the offset instead of stacking exactly on top", () => {
    const room = currentRoom();
    const original = room.items[0];

    useStore.getState().selectItem(original.id);
    useStore.getState().copySelection();
    useStore.getState().pasteClipboard();
    const firstPasteId = useStore.getState().selectedItemIds[0];
    useStore.getState().pasteClipboard();
    const secondPasteId = useStore.getState().selectedItemIds[0];

    const after = currentRoom();
    const firstPaste = after.items.find((i) => i.id === firstPasteId)!;
    const secondPaste = after.items.find((i) => i.id === secondPasteId)!;
    expect(firstPaste.x).toBe(original.x + 12);
    expect(secondPaste.x).toBe(original.x + 24);
  });

  it("updateSelectedItems applies the same width to every selected item", () => {
    const room = currentRoom();
    // The default fixture's two wardrobes are identical apart from position.
    const wardrobes = room.items.filter((i) => i.catalog === "wardrobe");
    expect(wardrobes).toHaveLength(2);

    useStore.getState().selectItem(wardrobes[0].id);
    useStore.getState().toggleItemSelection(wardrobes[1].id);
    useStore.getState().updateSelectedItems({ w: 36 });

    const after = currentRoom();
    for (const w of wardrobes) {
      expect(after.items.find((i) => i.id === w.id)?.w).toBe(36);
    }
  });

  it("moveSelectedItems shifts every selected item by the same delta, regardless of type", () => {
    const room = currentRoom();
    // Wardrobe + desk: deliberately NOT the same item, to prove move doesn't
    // require homogeneity the way updateSelectedItems does.
    const wardrobe = room.items.find((i) => i.catalog === "wardrobe")!;
    const desk = room.items.find((i) => i.catalog === "study_desk")!;
    const [wx, wy, dx0, dy0] = [wardrobe.x, wardrobe.y, desk.x, desk.y];

    useStore.getState().selectItem(wardrobe.id);
    useStore.getState().toggleItemSelection(desk.id);
    useStore.getState().moveSelectedItems(5, -3);

    const after = currentRoom();
    expect(after.items.find((i) => i.id === wardrobe.id)).toMatchObject({ x: wx + 5, y: wy - 3 });
    expect(after.items.find((i) => i.id === desk.id)).toMatchObject({ x: dx0 + 5, y: dy0 - 3 });
  });

  it("dragItemsTo updates multiple items' positions in a single batch", () => {
    const room = currentRoom();
    const [a, b] = room.items;

    useStore.getState().dragItemsTo([
      { id: a.id, x: 10, y: 20 },
      { id: b.id, x: 30, y: 40 },
    ]);

    const after = currentRoom();
    expect(after.items.find((i) => i.id === a.id)).toMatchObject({ x: 10, y: 20 });
    expect(after.items.find((i) => i.id === b.id)).toMatchObject({ x: 30, y: 40 });
  });
});
