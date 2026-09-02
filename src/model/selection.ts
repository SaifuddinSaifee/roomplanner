import type { Item } from "./types";

/**
 * True when every item shares the same catalog entry and unrotated size and
 * rotation — i.e. they differ only in position (and possibly a custom
 * label, which is cosmetic, not dimensional). Gates bulk width/depth edits:
 * typing one Width into several items only makes sense when they already
 * agree on everything but where they sit. A single-item selection is always
 * "homogeneous" — there's nothing to disagree with.
 */
export function isHomogeneousSelection(items: Item[]): boolean {
  if (items.length === 0) return false;
  const [first, ...rest] = items;
  return rest.every(
    (item) => item.catalog === first.catalog && item.w === first.w && item.d === first.d && item.rot === first.rot
  );
}
