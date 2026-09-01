## 1. The unlock: data model instead of hardcoded geometry

Right now `render()` draws a bed, a desk, two wardrobes and a bedside table by name. To support Hall, Kitchen, Bedroom 2, you cannot keep adding branches. You need a schema and a generic renderer.

```json
{
  "version": 1,
  "name": "2BHK layout",
  "units": "ft",
  "rooms": [
    {
      "id": "r1",
      "name": "Hall",
      "type": "hall",
      "width": 12,
      "depth": 15,
      "openings": [
        { "id": "o1", "wall": "south", "offset": 6.5, "width": 3, "kind": "door" },
        { "id": "o2", "wall": "west", "offset": 0, "width": 5, "kind": "sliding" }
      ],
      "items": [
        { "id": "i1", "catalog": "sofa_3", "x": 1.5, "y": 8, "w": 6, "d": 3, "rot": 0 }
      ]
    }
  ]
}
```

Two specific fixes worth calling out:

- **Openings become `{ wall, offset, width }`** instead of the current absolute pixel math (`bathStart`, `entryStart`). Change the room size today and every opening silently lands in the wrong place.
- **Items get `x`, `y`, `rot`** in feet, not derived positions. The bed is currently pinned to the bottom wall by formula. That has to become data.

Everything below depends on this landing first.

---

## 2. MVP feature set

### 2.1 Rooms
- Add room, name it, pick a type from a fixed list: Hall, Bedroom, Kitchen, Bathroom, Balcony, Other
- Rectangular rooms only
- Room switcher in the sidebar, one room visible on canvas at a time
- Duplicate room (Bedroom 1 to Bedroom 2 is the single most common action in a 2BHK)
- Delete room with confirm

### 2.2 Furniture catalog
Fixed catalog of roughly 20 items, each with a default size, a minimum size, and an SVG symbol. Not a product database, just shapes.

| Category | Items |
|---|---|
| Sleeping | Single bed, double bed, queen, king, bedside table |
| Storage | Wardrobe, chest of drawers, bookshelf, shoe rack, loft storage |
| Living | 3-seat sofa, 2-seat sofa, armchair, coffee table, TV unit |
| Work | Study desk, office chair |
| Dining | 4-seat table, 6-seat table |
| Kitchen | Counter run, fridge, sink |
| Bathroom | WC, basin, shower tray |

Each catalog entry carries three fields that make the app actually useful:

- `wallAffinity`: `wall` (wardrobe, TV unit), `corner`, or `free` (coffee table)
- `clearance`: front clearance in feet, for example 2.5 ft in front of a wardrobe so the door opens
- `resizable`: whether width and depth can be edited

### 2.3 Placement
- Click a catalog item to drop it into the room
- Drag to move, with snapping to walls and to other item edges at a 3 inch tolerance
- Rotate in 90 degree steps only. Free rotation is a trap, skip it.
- Select an item to edit exact width, depth and position numerically in the sidebar
- Delete key removes the selected item
- Single-level undo and redo

### 2.4 Fit checking
This is the reason someone uses the app instead of graph paper. Replace the current three ad hoc warnings with real rules:

- Item overlaps another item
- Item extends past a wall
- Item blocks a door opening or its swing arc
- Item clearance zone is obstructed, for example a wardrobe with less than 2.5 ft in front of it
- Main walkway narrower than 2.5 ft

Show these as a list with the offending item highlighted in red on the canvas. Do not block the user from doing it, just flag it.

### 2.5 Save and export
- Autosave the whole home to `localStorage`, keyed by project
- Export and import the project JSON so the file is portable
- Export current room as SVG, which already works
- Print the whole home, one room per page
- A home summary view: total area, room count, furniture count per room

---

## 3. Explicitly out of MVP

Name these now so they do not creep in.

| Cut | Why |
|---|---|
| Stitching rooms into one apartment floor plan | Shared walls and alignment is a hard geometry problem and doubles the build. Rooms stay independent canvases in v1. |
| Non-rectangular rooms, L shapes, angled walls | Polygon editing plus polygon collision is its own project |
| 3D view | Nice demo, zero planning value |
| Real product catalog with prices and links | Becomes a data maintenance job, not a product |
| Accounts, sharing, cloud sync | JSON export covers this for v1 |
| Auto layout or AI suggestions | Needs the manual tool to work first |
| Mobile drag and drop | Ship mobile as read only and print only |
| Free rotation, curved walls, stairs | Later |

---

## 4. Stack and structure

Stay client only. There is no server-side need in the MVP.

```
src/
  model/       schema.ts, defaults.ts, migrate.ts
  catalog/     items.ts, symbols.ts
  render/      room.ts, openings.ts, item.ts, dimensions.ts, scale.ts
  interact/    drag.ts, select.ts, snap.ts
  validate/    rules.ts
  store/       state.ts, persist.ts, undo.ts
  ui/          sidebar.ts, roomList.ts, inspector.ts, issues.ts
```

- **Vite plus TypeScript**, no framework. The UI is a sidebar and an SVG canvas. React would earn its keep only if the panels get much heavier.
- **TypeScript is worth it here.** The schema is the whole app, and you will be refactoring it for weeks.
- **Build SVG as real DOM nodes, not `innerHTML` strings.** This is the second big refactor. You cannot attach drag handlers or hit testing to a serialized string. Keep the string path only for export.
- **`localStorage` behind a small `persist` adapter**, so swapping to a backend later is one file. Note that if you ever run this as a Claude artifact rather than your own hosted page, browser storage will not work, so the adapter matters.
- Deploy as a static site on Vercel or Netlify.

---

## 5. Build order

| Phase | Work | Size |
|---|---|---|
| 0 | Extract schema, rewrite `render()` to draw from data, port the existing bedroom into JSON as a fixture. No new features, output should look identical. | Large |
| 1 | SVG as DOM nodes, computed scale to fit, select and drag and snap | Large |
| 2 | Catalog, add and delete items, inspector panel, 90 degree rotation | Medium |
| 3 | Multi-room, room switcher, duplicate room | Medium |
| 4 | Validation rules and issues panel | Medium |
| 5 | Persistence, JSON import and export, print, home summary | Small |

Phase 0 will feel like no progress and is the only phase that matters. Everything after it is additive.

---

## 6. Traps in the current file to fix during Phase 0

- `S = 72` px per foot with fixed `x0 = 214`, `y0 = 112` and a fixed `viewBox`. A 20 ft hall will run off the canvas. Compute scale and origin from room size and viewport.
- The `autoFit` checkbox mutates `deskWidth` and `wardrobeWidth` as a side effect of typing. Replace with an explicit constraint on the wall run, or drop it. Silent state mutation gets very confusing once there are twelve items.
- `feetLabel()` rounds to the nearest inch on every call, so displayed totals will not always add up to the room width. Store inches as the base integer unit and format on output.
- Labels are drawn at hardcoded offsets like `y0 + wardD - 62`. With arbitrary item sizes they will collide. Needs a small label placement pass, or move labels outside the item for anything under a threshold size.
- No metric option. Add a `units` toggle at the formatter layer now, since Indian users will want feet and millimetres both.
