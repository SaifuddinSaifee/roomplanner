# Room Planner — Next.js MVP (phase1.md, phases 0–5)

## Context

Today the project is a single 650-line file, [RoomPlanner.html](RoomPlanner.html), that draws one hardcoded bedroom. `render()` (lines 371–570) builds an `innerHTML` string that names a bed, a desk, two wardrobes and a bedside table individually, positions them by formula (`bedY = y1 - state.bedLength * S`), and pins the whole drawing to a fixed `S = 72` px/ft with origin `x0 = 214, y0 = 112` inside a fixed `viewBox="0 0 1120 1080"`. Openings are absolute pixel math off `bathStart` / `entryStart`. Change the room size and every opening silently lands wrong; a 20 ft hall runs off the canvas; you cannot attach a drag handler to a serialized string.

[phase1.md](phase1.md) diagnoses this correctly: the fix is a **data model plus a generic renderer**, not more branches. This plan implements the full MVP — the schema, a React/SVG renderer drawing from data, a ~23-item catalog, drag/snap/rotate placement, multi-room, real fit-checking rules, and persistence with import/export/print.

Deviation from the spec, at the user's direction: the app is **Next.js (App Router) + TypeScript + Tailwind v4**, not Vite + vanilla TS. This costs nothing here — the app stays 100% client-side with `output: 'export'`, and React gives us phase1's "SVG as real DOM nodes, not `innerHTML`" requirement for free. No auth, no server, no user management.

Decisions confirmed with the user: full MVP scope; Tailwind v4 carrying the existing warm-paper palette; clean schematic SVG symbols for all catalog items rather than porting the current per-item illustrations.

---

## Core model decisions

These three lock in before anything else and everything depends on them.

**1. Integer inches are the base unit.** Trap #3 in phase1.md: `feetLabel()` (line 341) rounds to the nearest inch on every call, so displayed part totals will not sum to the displayed room width. Every length in the document is an integer number of inches. `units` on the document is a **display preference only** (`'ft'` | `'mm'`), applied by one formatter module at the output layer. `24` inches renders as `2'-0"` or `610 mm`; it is never stored as `2` or `609.6`.

**2. Openings are `{ wall, offset, width, kind }`.** Offset is measured in inches from the wall's start corner, walls ordered `north` (top, offset runs left→right), `east` (top→bottom), `south` (left→right), `west` (top→bottom). Resizing a room now moves openings sensibly instead of stranding them.

**3. Items carry `x`, `y`, `rot` as data.** `x`/`y` are the top-left of the *unrotated* footprint in inches from the room's top-left interior corner; `rot` is one of `0 | 90 | 180 | 270`, rotating about the item's center. A single helper `footprint(item)` in `src/model/geometry.ts` returns the axis-aligned box (swapping `w`/`d` at 90/270) and is the **only** thing collision, snapping, bounds and clearance ever consult.

```ts
// src/model/types.ts
type Home = { version: 1; name: string; units: 'ft' | 'mm'; rooms: Room[] };
type Room = { id: string; name: string; type: RoomType; width: number; depth: number;  // inches
              openings: Opening[]; items: Item[] };
type Opening = { id: string; wall: Wall; offset: number; width: number; kind: 'door' | 'sliding' | 'opening' };
type Item = { id: string; catalog: CatalogId; x: number; y: number; w: number; d: number; rot: 0|90|180|270; label?: string };
```

`src/model/migrate.ts` ships now as a version-dispatch stub (`migrate(unknown) => Home`) so a future schema bump is one file, and it also rejects/repairs malformed imported JSON.

---

## Structure

phase1.md's `src/` layout, mapped onto Next.js. App shell in `app/`, all logic in `src/`.

```
app/
  layout.tsx            root layout, font + globals
  page.tsx              'use client' shell: Sidebar | canvas
  globals.css           Tailwind v4 @theme tokens (warm paper palette)
  print/page.tsx        all rooms, one per page
src/
  model/    types.ts  defaults.ts  migrate.ts  units.ts  geometry.ts
  catalog/  items.ts  symbols.tsx
  render/   Plan.tsx  RoomShell.tsx  Openings.tsx  ItemNode.tsx  Dimensions.tsx  scale.ts
  interact/ useDrag.ts  snap.ts
  validate/ rules.ts
  store/    useStore.ts  persist.ts
  ui/       Sidebar.tsx  RoomList.tsx  Catalog.tsx  Inspector.tsx  Issues.tsx  Summary.tsx  Toolbar.tsx
```

`next.config.ts` sets `output: 'export'` — deploys as a static site to Vercel/Netlify, per phase1 §4.

---

## Phase 0 — schema + generic renderer

The phase that "feels like no progress and is the only one that matters."

- Scaffold Next.js 15 + TS + Tailwind v4, `output: 'export'`, pnpm.
- `model/types.ts`, `model/defaults.ts`, `model/migrate.ts`, `model/units.ts` (`formatLength`, `parseLength`, ft-in and mm), `model/geometry.ts` (`footprint`, `rectsOverlap`, `rectInside`, `openingSegment(room, opening)` → the wall-space line segment).
- Port the current bedroom to a JSON fixture in `defaults.ts`: 9 ft × 11.5 ft → `108 × 138` inches, balcony sliding opening on `west` offset 0 width 60, entry door `south` offset 78 width 24, bathroom `east` offset 40 width 28, plus the two wardrobes, desk, bed and bedside table as catalog items at their computed positions.
- `render/scale.ts` — **fixes trap #1.** `computeScale(room, viewport)` returns `{ pxPerInch, originX, originY }` from the measured container (via `ResizeObserver`) and the room bounds plus a fixed margin in inches for dimension lines and exterior labels. Nothing is hardcoded to 72 / 214 / 112.
- `render/Plan.tsx` + `RoomShell.tsx` + `Openings.tsx` + `ItemNode.tsx` — React components emitting real `<rect>`/`<path>`/`<text>` DOM nodes in px space. `<defs>` carries the floor pattern, drop shadow and arrow marker ported verbatim from lines 428–447.
- `Dimensions.tsx` — the overall width/depth dimension lines, generalized from `dimensionLine()` (line 352).

Exit criterion: the default document renders a bedroom recognizably equivalent to today's output, with zero item-specific code in the renderer.

## Phase 1 — select, drag, snap

- `store/useStore.ts` — Zustand: `{ home, selectedRoomId, selectedItemId, past[], future[] }`. Undo/redo snapshots the whole `Home` (a few KB of JSON) onto a bounded 50-entry stack. This subsumes phase1's single-level ask at the same code cost and is far harder to get subtly wrong than a command/inverse-command design.
- `interact/useDrag.ts` — pointer events on the SVG; client→plan coords via `svg.getScreenCTM().inverse()`. Pointer capture so a drag survives leaving the element. One history entry per completed drag, not per pointermove.
- `interact/snap.ts` — candidate edges are the four walls and every other item's `footprint()` edges; snap at **3 in** tolerance, which is now a literal model-space constant rather than a pixel guess. Snapping runs on the AABB, so it is rotation-correct by construction.
- Selection ring on the selected item; click empty floor to deselect; `Delete`/`Backspace` removes it.

## Phase 2 — catalog, inspector, rotation

- `catalog/items.ts` — the ~23 entries from phase1 §2.2 (Sleeping, Storage, Living, Work, Dining, Kitchen, Bathroom), each `{ id, name, category, defaultW, defaultD, minW, minD, resizable, wallAffinity: 'wall'|'corner'|'free', clearance }` with all sizes in inches (e.g. wardrobe clearance `30` = 2.5 ft).
- `catalog/symbols.tsx` — one schematic symbol per entry, each a pure function of `(w, d)` in px so it scales to any size: bed with pillow blocks and a foot band, wardrobe with a door-swing line, sofa with arm/back bands, WC and basin outlines, sink bowl, fridge with a hinge line. Architectural line-work, no per-item hardcoding, no illustration-specific magic offsets.
- `ui/Catalog.tsx` — grouped by category; click drops the item at the room center (or snapped to the nearest wall for `wallAffinity: 'wall'`).
- `ui/Inspector.tsx` — numeric `w`, `d`, `x`, `y` for the selection, in the current display units via `units.ts` (typing `2'6"` or `760` both work). `resizable: false` entries lock w/d; `minW`/`minD` clamp. **Fixes trap #2**: no `autoFit` checkbox, no silent cross-field mutation — the current `autoFit` (lines 583–595) rewrites `deskWidth` as a side effect of typing in `wardrobeWidth`, which becomes unusable with twelve items. Editing a field edits exactly that field; a bad fit shows up in the issues panel instead.
- Rotate button + `R` key, 90° steps only.
- **Fixes trap #4**: `ItemNode` measures its own box and places the label inside only when the footprint clears a threshold (~36 × 24 in); below that the label moves outside with a leader line. No more `y0 + wardD - 62` hardcoded offsets.

## Phase 3 — multi-room

- `ui/RoomList.tsx` — add room (name + type from Hall/Bedroom/Kitchen/Bathroom/Balcony/Other), switch, rename, **duplicate** (deep clone with fresh ids — the 2BHK's most common action), delete with confirm.
- One room on canvas at a time. Rooms stay independent canvases; stitching into a floor plan is explicitly out of MVP.

## Phase 4 — validation

`validate/rules.ts`, pure `(room) => Issue[]`, `Issue = { id, ruleId, severity, message, itemIds[] }`. Replaces the three ad hoc warnings at lines 415–418. Nothing is blocked — issues are flagged, per §2.4.

1. **Overlap** — pairwise AABB intersection of `footprint()`, with a 0.5 in epsilon.
2. **Out of bounds** — footprint not contained in the room rect.
3. **Blocks an opening** — footprint intersects the opening's swing region: for `kind: 'door'`, the quarter-disc of radius = opening width swept inward from the hinge; for `sliding`/`opening`, a 6 in threshold band.
4. **Clearance obstructed** — the clearance rect projected off the item's front face (front derived from `rot`) intersects another item or a wall. This is what makes a wardrobe with 1 ft in front of it a real finding.
5. **Walkway too narrow** — rasterize free floor on a 3 in grid, then BFS between openings requiring a corridor radius ≥ 15 in (2.5 ft wide). Flags when doors are not mutually reachable through a walkable path. Grid + BFS is the honest implementable version of this rule; an exact largest-inscribed-corridor computation is not worth it here.

`ui/Issues.tsx` lists them; hovering a row highlights the offending items in red on the canvas.

## Phase 5 — persistence, export, print, summary

- `store/persist.ts` — the adapter phase1 §4 asks for: `load()` / `save()` / `clear()`, `localStorage` keyed `roomplanner:<projectId>`, every access in `try/catch` with an in-memory fallback (storage genuinely throws in private windows and sandboxed embeds). Debounced autosave. Hydration happens in an effect, never during render, so SSR output and first client render match.
- Export / import project JSON (`migrate()` validates on import). Reuse the existing `downloadBlob()` helper (lines 614–624) and the `serializedSvg()` clone-and-serialize approach (lines 605–612) — the string path stays, but only for export.
- Export current room as SVG; keep the copy-to-clipboard button.
- `app/print/page.tsx` — every room, `break-after: page`, sidebar hidden, extending the existing `@media print` block (lines 232–237).
- `ui/Summary.tsx` — total area, room count, per-room furniture count.
- **Fixes trap #5**: units toggle (ft-in / mm) in the toolbar, driven entirely by `units.ts` at the formatter layer.

---

## Verification

**Automated** — add Vitest and cover the pure modules, which is exactly where the geometry bugs hide:
- `units.ts` — round-trip `parseLength(formatLength(n)) === n` across ft-in and mm; confirm part totals sum to the whole (the trap #3 regression).
- `geometry.ts` — `footprint()` at all four rotations, overlap and containment edge cases.
- `snap.ts` — snapping at exactly 3 in, just inside, just outside.
- `rules.ts` — one fixture room per rule, asserting it fires and that a clean layout produces zero issues.

Run: `pnpm test`, `pnpm build` (must succeed with `output: 'export'`), `pnpm lint`.

**Manual, via `pnpm dev`:**
1. Default bedroom loads and looks equivalent to the current [RoomPlanner.html](RoomPlanner.html) output.
2. Set room width to 20 ft — the plan rescales to fit the canvas and openings stay proportionally placed (the two headline traps).
3. Drag a wardrobe to a wall — it snaps flush; drag it beside another item — edges snap.
4. Rotate a bed twice — footprint, label placement and snapping all follow.
5. Push a wardrobe against a wall with a chair 1 ft in front — the clearance issue appears and both items highlight red.
6. Add a Hall, duplicate it to Bedroom 2, delete one with confirm.
7. Reload the page — the layout is still there. Export JSON, clear storage, re-import — identical layout.
8. Open `/print` — one room per page in the browser print preview.
9. Toggle ft ↔ mm — every label and inspector field converts, and nothing in the geometry moves.
