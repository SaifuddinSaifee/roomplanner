# Room Planner

A client-only Next.js app for laying out rectangular rooms with real furniture dimensions — drag, snap, and rotate placement, with fit checks for overlaps, blocked doorways, clearance zones, and walkway width.

Everything runs in the browser: there's no backend, no accounts, and no network calls. State autosaves to `localStorage` and round-trips through JSON export/import.

See [phase1.md](phase1.md) for the original product spec and [plans/plan1.md](plans/plan1.md) for the implementation plan.

## Contents

- [Quick start](#quick-start)
- [Features](#features)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Furniture catalog](#furniture-catalog)
- [Fit-check rules](#fit-check-rules)
- [Scripts](#scripts)
- [Tech stack](#tech-stack)
- [Production build & deployment](#production-build--deployment)
- [Contributing](#contributing)

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### Rooms

- Add, rename, duplicate, and delete rectangular rooms, each with a type (Hall, Bedroom, Kitchen, Bathroom, Balcony, Other)
- Room switcher in the sidebar — one room visible on canvas at a time
- Configure openings (door, sliding, window, opening) on any wall, positioned by offset and width

### Catalog

- 74 items across 11 categories: Sleeping, Storage, Living, Work, Dining, Kitchen, Bathroom, Lighting, Outdoor, Entryway, Kids & Nursery
- Each entry has a default size, a minimum size, a wall affinity (`wall`, `corner`, or `free`), and a required front clearance
- Full reference: [docs/furniture-catalog.md](docs/furniture-catalog.md)

### Placement

- Click a catalog item to drop it into the room; drag to move, with snapping to walls and other item edges
- Rotate in 90° steps
- Select an item to edit exact width, depth, and position numerically in the inspector
- Resize items that support it, directly on the canvas
- Delete key removes the selected item
- Undo/redo for all edits

### Measure tool

- Click-click distance tool: toggle it on, click a start point, move the mouse for a live rubber-band line and readout, click again to lock the measurement
- Points snap to walls, item edges, and item centers
- Hold Shift to constrain the line to the 8 compass directions from the anchor

### Fit checking

Real-time validation, shown as an issues list with offending items highlighted on the canvas (see [Fit-check rules](#fit-check-rules) for details):

- Item overlaps another item
- Item extends past a wall
- Item blocks a door/opening or its swing zone
- Item's required clearance zone is obstructed
- No walkway of minimum width connects the room's doors

### Units

- Toggle the whole app between feet-inches and millimeters at any time — this is a display setting only; all geometry is stored as integer inches

### Save, copy, export, print

- Autosaves the whole home to `localStorage`
- Copy or export the current room or the full house plan as PNG (1×/2×/4×), JPG, SVG, or JSON
- Import a house plan (append all rooms) or a single room (with a picker if the file holds several) from JSON
- Print view (`/print`) renders one room per page, with an option to hide remark callouts
- Home summary: total area, room count, furniture count per room
- Reset to the default home

## Project structure

```text
src/
  model/     schema, defaults, migration, units (integer-inch storage), geometry
  catalog/   furniture catalog and SVG symbols
  render/    the SVG plan renderer (scale, walls, openings, items, dimensions)
  interact/  drag, snap, and the measure tool
  validate/  fit-check rules
  store/     Zustand store, undo/redo, localStorage persistence, copy/export
  ui/        sidebar panels (rooms, catalog, inspector, issues, summary, toolbar)
app/
  page.tsx        the main editor
  print/page.tsx  the print view
```

## Data model

All lengths are stored as integer inches; `units` is a display preference only and never changes what's stored. A `Home` is a named collection of `Room`s:

```ts
interface Home {
  version: 1;
  name: string;
  units: "ft" | "mm";
  rooms: Room[];
}

interface Room {
  id: string;
  name: string;
  type: "hall" | "bedroom" | "kitchen" | "bathroom" | "balcony" | "other";
  width: number;   // interior width, inches
  depth: number;   // interior depth, inches
  openings: Opening[];
  items: Item[];
}

interface Opening {
  id: string;
  wall: "north" | "east" | "south" | "west";
  offset: number;  // inches from the wall's start corner
  width: number;   // inches, along the wall
  kind: "door" | "sliding" | "window" | "opening";
}

interface Item {
  id: string;
  catalog: string;   // references a CatalogEntry id
  x: number;         // unrotated top-left, inches from room's interior top-left
  y: number;
  w: number;         // unrotated footprint, inches
  d: number;
  rot: 0 | 90 | 180 | 270;
  label?: string;
}
```

Rooms stay independent canvases — there's no shared-wall stitching into a single floor plan, and only rectangular rooms are supported.

## Furniture catalog

Each `CatalogEntry` in [`src/catalog/items.ts`](src/catalog/items.ts) carries:

| Field | Meaning |
| --- | --- |
| `defaultW` / `defaultD` | Width × depth an item is placed at by default (inches) |
| `minW` / `minD` | Smallest footprint the item can be resized down to |
| `resizable` | Whether the footprint can be drag-resized |
| `wallAffinity` | `wall` = must sit flush against a wall, `corner` = must sit in a corner, `free` = anywhere |
| `clearance` | Required front clearance in inches that the validator checks against (`0` = none enforced) |

The full item-by-item table lives in [docs/furniture-catalog.md](docs/furniture-catalog.md) — keep it in sync by hand (or ask the assistant to re-sync it) whenever `items.ts` changes.

## Fit-check rules

Implemented in [`src/validate/rules.ts`](src/validate/rules.ts):

| Rule | Severity | What it flags |
| --- | --- | --- |
| `overlap` | error | Two items' footprints overlap |
| `out-of-bounds` | error | An item extends past the room's walls |
| `blocks-opening` | error | An item sits in a door's swing arc, or in the threshold band of a sliding/window/fixed opening |
| `clearance` | warning | An item's required front-clearance zone is blocked by a wall or another item |
| `walkway` | warning | No corridor at least 2.5 ft wide connects every door-type opening (BFS over a 3"-grid, doors and sliding openings only — windows aren't walk-through endpoints) |

## Scripts

```bash
pnpm dev     # start the dev server
pnpm test    # vitest — model/geometry/snap/validation rules
pnpm lint    # eslint
pnpm build   # static export (output: 'export'), deployable to Vercel/Netlify
```

## Tech stack

- **Next.js** (static export, no server-side rendering needed — the app is entirely client-side)
- **React** + **Zustand** for state, undo/redo, and localStorage persistence
- **TypeScript** throughout — the schema in `src/model/types.ts` is effectively the spec for the whole app
- **Tailwind CSS** for UI styling
- **SVG** as the rendering target for both the live canvas and exports (PNG/JPG rasterized from SVG markup, plus native SVG and JSON export)
- **Vitest** for unit tests on geometry, snapping, units, and validation rules

## Production build & deployment

`next.config.ts` sets `output: "export"`, so this app builds to a fully static site — there's no Node.js server involved at runtime, no API routes, and no server-side rendering. `pnpm start` (`next start`) does not apply here and shouldn't be used.

```bash
pnpm build
```

This runs a full type check, then writes static HTML/CSS/JS to `out/`. Every route (`/`, `/print`) is prerendered at build time; all interactivity (state, drag/snap, validation, persistence) runs client-side after load.

To preview the production build locally:

```bash
pnpm dlx serve out
```

### Deploying `out/`

Because the output is plain static assets, any static host works:

- **Vercel / Netlify** — connect the repo and set the build command to `pnpm build` and the output/publish directory to `out`. Both platforms auto-detect this from `next.config.ts` in most cases.
- **GitHub Pages, Cloudflare Pages, S3 + CloudFront, or any static file server** — run `pnpm build` and upload the contents of `out/` as-is.
- **Nginx or another self-hosted server** — point the document root at `out/` and serve it directly.

There's nothing to configure server-side: no environment variables, no database, no API keys. All persistence is `localStorage` in the visitor's own browser.

## Contributing

- **Install & run**: `pnpm install`, then `pnpm dev`.
- **Before opening a PR**, run all three checks locally — CI-equivalent gates for this project:

  ```bash
  pnpm lint
  pnpm test
  pnpm build
  ```

- **Tests live next to the code they cover** (e.g. `src/model/geometry.test.ts` beside `src/model/geometry.ts`). Add or update a test whenever you touch `model/`, `interact/`, `render/`, or `validate/` logic — these are the modules with the most edge cases (rotation, snapping, unit conversion, fit-check rules).
- **Keep [docs/furniture-catalog.md](docs/furniture-catalog.md) in sync** by hand whenever you add, remove, or resize an entry in `src/catalog/items.ts` — the app reads only the TypeScript source, but the doc is the human-readable reference.
- **Respect the data model**: all lengths are stored as integer inches (see [Data model](#data-model)). Don't introduce fractional inches or alternate units into stored state — convert only at the display/formatting layer.
- **This app is client-only by design** (see [Production build & deployment](#production-build--deployment)). Avoid adding anything that needs a server, an API route, or `getServerSideProps`-style dynamic rendering — it will break the static export.
- Keep pull requests focused — prefer several small, reviewable PRs over one large one spanning unrelated areas (e.g. don't mix a catalog change with a validation-rule change).
