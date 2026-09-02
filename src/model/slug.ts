// Per-room URLs: /{slugified room name}-{roomId}, e.g. /living-room-a3f9k2p.
// The id is fixed-length lowercase alphanumeric so it can be recovered
// unambiguously from the end of the slug regardless of what's in the name.

import { customAlphabet } from "nanoid";

const ROOM_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ROOM_ID_LENGTH = 7;
const ROOM_ID_PATTERN = new RegExp(`^[a-z0-9]{${ROOM_ID_LENGTH}}$`);

export const makeRoomId = customAlphabet(ROOM_ID_ALPHABET, ROOM_ID_LENGTH);

export function isRoomId(value: string): boolean {
  return ROOM_ID_PATTERN.test(value);
}

// Non-ASCII letters (accented, non-Latin, ...) fall through to the "not
// a-z0-9" branch below and become separators, same as any other punctuation.
function slugifyRoomName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "room";
}

export function roomUrlSlug(room: { id: string; name: string }): string {
  return `${slugifyRoomName(room.name)}-${room.id}`;
}

/** Recover a room id from a slug or a full pathname, or null if none is present. */
export function roomIdFromPath(pathname: string): string | null {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment) return null;
  const lastDash = segment.lastIndexOf("-");
  const candidate = lastDash === -1 ? segment : segment.slice(lastDash + 1);
  return isRoomId(candidate) ? candidate : null;
}
