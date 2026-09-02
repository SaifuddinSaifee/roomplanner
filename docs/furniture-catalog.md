# Furniture catalog

Structured reference for every entry in [`src/catalog/items.ts`](../src/catalog/items.ts). This file is documentation only — the app reads from the TypeScript source, not from this table. Regenerate this file by hand whenever `items.ts` changes (or ask the assistant to re-sync it).

All dimensions are inches. `Clearance` is the required front clearance the validator (`src/validate/rules.ts`) checks against, in inches; `0` means none is enforced.

**Columns**

| Column | Meaning |
| --- | --- |
| Default W × D | Width × depth an item is placed at by default |
| Min W × D | Smallest footprint the item can be resized down to (only relevant if resizable) |
| Resizable | Whether the user can drag-resize the footprint |
| Wall affinity | `wall` = must sit flush against a wall; `corner` = must sit in a corner; `free` = can be placed anywhere |

---

## Sleeping (8 items)

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `bed_single` | Single bed | 39 × 75 | 36 × 72 | Yes | wall | 24 |
| `bed_double` | Double bed | 54 × 75 | 48 × 72 | Yes | wall | 24 |
| `bed_queen` | Queen bed | 60 × 80 | 54 × 76 | Yes | wall | 30 |
| `bed_king` | King bed | 76 × 80 | 72 × 76 | Yes | wall | 30 |
| `bedside_table` | Bedside table | 18 × 18 | 12 × 12 | Yes | wall | 0 |
| `dressing_table` *(new)* | Dressing table | 24 × 24 | 18 × 18 | Yes | wall | 24 |
| `bunk_bed` *(new)* | Bunk bed | 40 × 80 | 38 × 76 | No | wall | 24 |
| `daybed` *(new)* | Daybed | 36 × 78 | 30 × 72 | Yes | wall | 24 |

## Storage (8 items)

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `wardrobe` | Wardrobe | 30 × 24 | 18 × 18 | Yes | wall | 30 |
| `chest_drawers` | Chest of drawers | 32 × 18 | 18 × 14 | Yes | wall | 24 |
| `bookshelf` | Bookshelf | 30 × 12 | 18 × 10 | Yes | wall | 18 |
| `shoe_rack` | Shoe rack | 24 × 12 | 12 × 10 | Yes | wall | 18 |
| `loft_storage` | Loft storage | 36 × 24 | 18 × 18 | Yes | wall | 0 |
| `sideboard` *(new)* | Sideboard | 60 × 18 | 48 × 16 | Yes | wall | 24 |
| `display_cabinet` *(new)* | Display cabinet | 36 × 16 | 24 × 14 | Yes | wall | 24 |
| `filing_cabinet` *(new)* | Filing cabinet | 15 × 20 | 12 × 16 | No | wall | 18 |

## Living (13 items)

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `sofa_3` | 3-seat sofa | 78 × 34 | 60 × 30 | Yes | wall | 30 |
| `sofa_2` | 2-seat sofa | 58 × 34 | 48 × 30 | Yes | wall | 30 |
| `armchair` | Armchair | 32 × 32 | 26 × 26 | Yes | free | 24 |
| `recliner` *(new)* | Recliner | 34 × 38 | 30 × 34 | Yes | free | 30 |
| `coffee_table` | Coffee table | 42 × 22 | 24 × 16 | Yes | free | 0 |
| `ottoman` *(new)* | Ottoman | 24 × 24 | 18 × 18 | Yes | free | 0 |
| `side_table` *(new)* | Side table | 20 × 20 | 14 × 14 | Yes | free | 0 |
| `side_table_iron` *(new, iron)* | Iron side table | 18 × 18 | 14 × 14 | Yes | free | 0 |
| `iron_table_long` *(new, iron)* | Long iron table | 48 × 12 | 40 × 10 | Yes | free | 18 |
| `table` *(new)* | Table | 48 × 24 | 36 × 18 | Yes | free | 0 |
| `tv_unit` | TV unit | 48 × 16 | 24 × 12 | Yes | wall | 36 |
| `media_console` *(new)* | Media console | 60 × 18 | 36 × 14 | Yes | wall | 30 |
| `bar_cart` *(new)* | Bar cart | 28 × 16 | 20 × 14 | No | free | 18 |

## Work (4 items)

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `study_desk` | Study desk | 48 × 24 | 30 × 18 | Yes | wall | 30 |
| `office_chair` | Office chair | 22 × 22 | 18 × 18 | No | free | 0 |
| `standing_desk` *(new)* | Standing desk | 48 × 28 | 36 × 22 | Yes | wall | 30 |
| `meeting_table` *(new)* | Meeting table | 60 × 36 | 48 × 30 | Yes | free | 36 |

## Dining (6 items)

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `dining_2` *(new)* | 2-seat table | 28 × 28 | 24 × 24 | Yes | free | 24 |
| `dining_4` | 4-seat table | 36 × 36 | 30 × 30 | Yes | free | 30 |
| `dining_6` | 6-seat table | 72 × 36 | 60 × 32 | Yes | free | 30 |
| `dining_8` *(new)* | 8-seat table | 90 × 40 | 80 × 36 | Yes | free | 36 |
| `dining_table_iron` *(new, iron)* | Iron dining table | 72 × 36 | 60 × 32 | Yes | free | 30 |
| `bar_stool` *(new)* | Bar stool | 15 × 15 | 12 × 12 | No | free | 0 |

## Kitchen (7 items)

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `counter_run` | Counter run | 72 × 24 | 24 × 22 | Yes | wall | 36 |
| `fridge` | Fridge | 30 × 30 | 24 × 24 | No | wall | 30 |
| `sink` | Sink | 24 × 22 | 18 × 18 | Yes | wall | 24 |
| `kitchen_island` *(new)* | Kitchen island | 48 × 30 | 36 × 24 | Yes | free | 36 |
| `dishwasher` *(new)* | Dishwasher | 24 × 24 | 24 × 24 | No | wall | 24 |
| `oven_range` *(new)* | Oven / range | 30 × 26 | 24 × 24 | No | wall | 30 |
| `pantry_cabinet` *(new)* | Pantry cabinet | 36 × 24 | 24 × 18 | Yes | wall | 30 |

## Bathroom (6 items)

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `wc` | WC | 15 × 28 | 14 × 24 | No | wall | 18 |
| `basin` | Basin | 20 × 18 | 16 × 14 | Yes | wall | 18 |
| `shower_tray` | Shower tray | 36 × 36 | 30 × 30 | Yes | corner | 24 |
| `bathtub` *(new)* | Bathtub | 60 × 30 | 54 × 28 | No | wall | 24 |
| `vanity` *(new)* | Vanity | 36 × 22 | 24 × 18 | Yes | wall | 24 |
| `linen_cabinet` *(new)* | Linen cabinet | 24 × 16 | 18 × 14 | Yes | wall | 18 |

## Lighting (7 items) — *new category*

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `floor_lamp` | Floor lamp | 14 × 14 | 10 × 10 | No | free | 6 |
| `floor_lamp_arc` | Arc floor lamp | 40 × 14 | 30 × 10 | Yes | free | 12 |
| `iron_floor_lamp` *(iron)* | Iron floor lamp | 12 × 12 | 10 × 10 | No | free | 6 |
| `table_lamp` | Table lamp | 8 × 8 | 6 × 6 | No | free | 0 |
| `pendant_light` | Pendant light | 16 × 16 | 10 × 10 | Yes | free | 0 |
| `chandelier` | Chandelier | 30 × 30 | 18 × 18 | Yes | free | 0 |
| `wall_sconce` | Wall sconce | 6 × 4 | 4 × 3 | No | wall | 0 |

## Outdoor (7 items) — *new category*

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `patio_table_iron` *(iron)* | Iron patio table | 36 × 36 | 30 × 30 | Yes | free | 24 |
| `patio_chair_iron` *(iron)* | Iron patio chair | 20 × 20 | 16 × 16 | No | free | 0 |
| `outdoor_sofa` | Outdoor sofa | 72 × 32 | 60 × 28 | Yes | wall | 30 |
| `sun_lounger` | Sun lounger | 26 × 75 | 24 × 72 | Yes | free | 24 |
| `umbrella_stand` | Patio umbrella | 12 × 12 | 10 × 10 | No | free | 0 |
| `open_deck` *(new)* | Open deck | 144 × 96 | 72 × 60 | Yes | wall | 0 |
| `balcony` *(new)* | Balcony | 96 × 48 | 48 × 30 | Yes | wall | 0 |

## Entryway (4 items) — *new category*

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `console_table` | Console table | 42 × 14 | 30 × 12 | Yes | wall | 18 |
| `console_table_iron` *(iron)* | Iron console table | 40 × 14 | 30 × 12 | Yes | wall | 18 |
| `coat_rack` | Coat rack | 16 × 16 | 12 × 12 | No | free | 12 |
| `entry_bench` | Entry bench | 36 × 16 | 24 × 14 | Yes | wall | 18 |

## Kids & Nursery (4 items) — *new category*

| ID | Name | Default W × D | Min W × D | Resizable | Wall affinity | Clearance |
| --- | --- | --- | --- | --- | --- | --- |
| `crib` | Crib | 30 × 54 | 28 × 52 | No | wall | 24 |
| `kids_bed` | Kids bed | 39 × 75 | 36 × 72 | Yes | wall | 24 |
| `changing_table` | Changing table | 34 × 18 | 24 × 16 | Yes | wall | 24 |
| `toy_storage` | Toy storage | 30 × 14 | 18 × 12 | Yes | wall | 18 |

---

## Summary

- **11 categories** total (7 existing + 4 new: Lighting, Outdoor, Entryway, Kids & Nursery)
- **74 items** total (26 existing + 48 new)
- **7 iron-frame items** added across Living, Dining, Lighting, Outdoor, and Entryway: `side_table_iron`, `iron_table_long`, `dining_table_iron`, `iron_floor_lamp`, `patio_table_iron`, `patio_chair_iron`, `console_table_iron`
- **7 lighting items** added: `floor_lamp`, `floor_lamp_arc`, `iron_floor_lamp`, `table_lamp`, `pendant_light`, `chandelier`, `wall_sconce`

Every new ID has a matching schematic symbol in [`src/catalog/symbols.tsx`](../src/catalog/symbols.tsx) and requires no other code changes — `CATEGORY_ORDER` and the `Catalog` UI component iterate the catalog generically.
