# Room Planner

A client-only Next.js app for laying out rectangular rooms with real furniture dimensions, drag/snap/rotate placement, and fit checks (overlaps, blocked doorways, clearance zones, walkway width). See [phase1.md](phase1.md) for the product spec and [plans/plan1.md](plans/plan1.md) for the implementation plan.

## Develop

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test, lint, build

```bash
pnpm test    # vitest — model/geometry/snap/validation rules
pnpm lint
pnpm build   # static export (output: 'export'), deployable to Vercel/Netlify
```

## Structure

- `src/model` — schema, defaults, migration, units (integer-inch storage), geometry
- `src/catalog` — furniture catalog and SVG symbols
- `src/render` — the SVG plan renderer (scale, walls, openings, items, dimensions)
- `src/interact` — drag and snap
- `src/validate` — fit-check rules
- `src/store` — Zustand store, undo/redo, localStorage persistence
- `src/ui` — sidebar panels (rooms, catalog, inspector, issues, summary, toolbar)
- `app/` — the Next.js shell and `/print` view
