// Fixed furniture catalog. Sizes are defaults in inches, not a product database.

export type WallAffinity = "wall" | "corner" | "free";

export type CatalogCategory =
  | "Sleeping"
  | "Storage"
  | "Living"
  | "Work"
  | "Dining"
  | "Kitchen"
  | "Bathroom"
  | "Lighting"
  | "Outdoor"
  | "Entryway"
  | "Kids & Nursery";

export interface CatalogEntry {
  id: string;
  name: string;
  category: CatalogCategory;
  defaultW: number;
  defaultD: number;
  minW: number;
  minD: number;
  resizable: boolean;
  wallAffinity: WallAffinity;
  /** Required front clearance, inches. 0 if none. */
  clearance: number;
}

export const CATALOG: CatalogEntry[] = [
  // Sleeping
  { id: "bed_single", name: "Single bed", category: "Sleeping", defaultW: 39, defaultD: 75, minW: 36, minD: 72, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "bed_double", name: "Double bed", category: "Sleeping", defaultW: 54, defaultD: 75, minW: 48, minD: 72, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "bed_queen", name: "Queen bed", category: "Sleeping", defaultW: 60, defaultD: 80, minW: 54, minD: 76, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "bed_king", name: "King bed", category: "Sleeping", defaultW: 76, defaultD: 80, minW: 72, minD: 76, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "bedside_table", name: "Bedside table", category: "Sleeping", defaultW: 18, defaultD: 18, minW: 12, minD: 12, resizable: true, wallAffinity: "wall", clearance: 0 },
  { id: "dressing_table", name: "Dressing table", category: "Sleeping", defaultW: 24, defaultD: 24, minW: 18, minD: 18, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "bunk_bed", name: "Bunk bed", category: "Sleeping", defaultW: 40, defaultD: 80, minW: 38, minD: 76, resizable: false, wallAffinity: "wall", clearance: 24 },
  { id: "daybed", name: "Daybed", category: "Sleeping", defaultW: 36, defaultD: 78, minW: 30, minD: 72, resizable: true, wallAffinity: "wall", clearance: 24 },

  // Storage
  { id: "wardrobe", name: "Wardrobe", category: "Storage", defaultW: 30, defaultD: 24, minW: 18, minD: 18, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "chest_drawers", name: "Chest of drawers", category: "Storage", defaultW: 32, defaultD: 18, minW: 18, minD: 14, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "bookshelf", name: "Bookshelf", category: "Storage", defaultW: 30, defaultD: 12, minW: 18, minD: 10, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "shoe_rack", name: "Shoe rack", category: "Storage", defaultW: 24, defaultD: 12, minW: 12, minD: 10, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "loft_storage", name: "Loft storage", category: "Storage", defaultW: 36, defaultD: 24, minW: 18, minD: 18, resizable: true, wallAffinity: "wall", clearance: 0 },
  { id: "sideboard", name: "Sideboard", category: "Storage", defaultW: 60, defaultD: 18, minW: 48, minD: 16, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "display_cabinet", name: "Display cabinet", category: "Storage", defaultW: 36, defaultD: 16, minW: 24, minD: 14, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "filing_cabinet", name: "Filing cabinet", category: "Storage", defaultW: 15, defaultD: 20, minW: 12, minD: 16, resizable: false, wallAffinity: "wall", clearance: 18 },

  // Living
  { id: "sofa_3", name: "3-seat sofa", category: "Living", defaultW: 78, defaultD: 34, minW: 60, minD: 30, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "sofa_2", name: "2-seat sofa", category: "Living", defaultW: 58, defaultD: 34, minW: 48, minD: 30, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "armchair", name: "Armchair", category: "Living", defaultW: 32, defaultD: 32, minW: 26, minD: 26, resizable: true, wallAffinity: "free", clearance: 24 },
  { id: "recliner", name: "Recliner", category: "Living", defaultW: 34, defaultD: 38, minW: 30, minD: 34, resizable: true, wallAffinity: "free", clearance: 30 },
  { id: "coffee_table", name: "Coffee table", category: "Living", defaultW: 42, defaultD: 22, minW: 24, minD: 16, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "ottoman", name: "Ottoman", category: "Living", defaultW: 24, defaultD: 24, minW: 18, minD: 18, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "side_table", name: "Side table", category: "Living", defaultW: 20, defaultD: 20, minW: 14, minD: 14, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "side_table_iron", name: "Iron side table", category: "Living", defaultW: 18, defaultD: 18, minW: 14, minD: 14, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "iron_table_long", name: "Long iron table", category: "Living", defaultW: 48, defaultD: 12, minW: 40, minD: 10, resizable: true, wallAffinity: "free", clearance: 18 },
  { id: "table", name: "Table", category: "Living", defaultW: 48, defaultD: 24, minW: 36, minD: 18, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "tv_unit", name: "TV unit", category: "Living", defaultW: 48, defaultD: 16, minW: 24, minD: 12, resizable: true, wallAffinity: "wall", clearance: 36 },
  { id: "media_console", name: "Media console", category: "Living", defaultW: 60, defaultD: 18, minW: 36, minD: 14, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "bar_cart", name: "Bar cart", category: "Living", defaultW: 28, defaultD: 16, minW: 20, minD: 14, resizable: false, wallAffinity: "free", clearance: 18 },

  // Work
  { id: "study_desk", name: "Study desk", category: "Work", defaultW: 48, defaultD: 24, minW: 30, minD: 18, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "office_chair", name: "Office chair", category: "Work", defaultW: 22, defaultD: 22, minW: 18, minD: 18, resizable: false, wallAffinity: "free", clearance: 0 },
  { id: "standing_desk", name: "Standing desk", category: "Work", defaultW: 48, defaultD: 28, minW: 36, minD: 22, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "meeting_table", name: "Meeting table", category: "Work", defaultW: 60, defaultD: 36, minW: 48, minD: 30, resizable: true, wallAffinity: "free", clearance: 36 },

  // Dining
  { id: "dining_2", name: "2-seat table", category: "Dining", defaultW: 28, defaultD: 28, minW: 24, minD: 24, resizable: true, wallAffinity: "free", clearance: 24 },
  { id: "dining_4", name: "4-seat table", category: "Dining", defaultW: 36, defaultD: 36, minW: 30, minD: 30, resizable: true, wallAffinity: "free", clearance: 30 },
  { id: "dining_6", name: "6-seat table", category: "Dining", defaultW: 72, defaultD: 36, minW: 60, minD: 32, resizable: true, wallAffinity: "free", clearance: 30 },
  { id: "dining_8", name: "8-seat table", category: "Dining", defaultW: 90, defaultD: 40, minW: 80, minD: 36, resizable: true, wallAffinity: "free", clearance: 36 },
  { id: "dining_table_iron", name: "Iron dining table", category: "Dining", defaultW: 72, defaultD: 36, minW: 60, minD: 32, resizable: true, wallAffinity: "free", clearance: 30 },
  { id: "bar_stool", name: "Bar stool", category: "Dining", defaultW: 15, defaultD: 15, minW: 12, minD: 12, resizable: false, wallAffinity: "free", clearance: 0 },

  // Kitchen
  { id: "counter_run", name: "Counter run", category: "Kitchen", defaultW: 72, defaultD: 24, minW: 24, minD: 22, resizable: true, wallAffinity: "wall", clearance: 36 },
  { id: "fridge", name: "Fridge", category: "Kitchen", defaultW: 30, defaultD: 30, minW: 24, minD: 24, resizable: false, wallAffinity: "wall", clearance: 30 },
  { id: "sink", name: "Sink", category: "Kitchen", defaultW: 24, defaultD: 22, minW: 18, minD: 18, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "kitchen_island", name: "Kitchen island", category: "Kitchen", defaultW: 48, defaultD: 30, minW: 36, minD: 24, resizable: true, wallAffinity: "free", clearance: 36 },
  { id: "dishwasher", name: "Dishwasher", category: "Kitchen", defaultW: 24, defaultD: 24, minW: 24, minD: 24, resizable: false, wallAffinity: "wall", clearance: 24 },
  { id: "oven_range", name: "Oven / range", category: "Kitchen", defaultW: 30, defaultD: 26, minW: 24, minD: 24, resizable: false, wallAffinity: "wall", clearance: 30 },
  { id: "pantry_cabinet", name: "Pantry cabinet", category: "Kitchen", defaultW: 36, defaultD: 24, minW: 24, minD: 18, resizable: true, wallAffinity: "wall", clearance: 30 },

  // Bathroom
  { id: "wc", name: "WC", category: "Bathroom", defaultW: 15, defaultD: 28, minW: 14, minD: 24, resizable: false, wallAffinity: "wall", clearance: 18 },
  { id: "basin", name: "Basin", category: "Bathroom", defaultW: 20, defaultD: 18, minW: 16, minD: 14, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "shower_tray", name: "Shower tray", category: "Bathroom", defaultW: 36, defaultD: 36, minW: 30, minD: 30, resizable: true, wallAffinity: "corner", clearance: 24 },
  { id: "bathtub", name: "Bathtub", category: "Bathroom", defaultW: 60, defaultD: 30, minW: 54, minD: 28, resizable: false, wallAffinity: "wall", clearance: 24 },
  { id: "vanity", name: "Vanity", category: "Bathroom", defaultW: 36, defaultD: 22, minW: 24, minD: 18, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "linen_cabinet", name: "Linen cabinet", category: "Bathroom", defaultW: 24, defaultD: 16, minW: 18, minD: 14, resizable: true, wallAffinity: "wall", clearance: 18 },

  // Lighting
  { id: "floor_lamp", name: "Floor lamp", category: "Lighting", defaultW: 14, defaultD: 14, minW: 10, minD: 10, resizable: false, wallAffinity: "free", clearance: 6 },
  { id: "floor_lamp_arc", name: "Arc floor lamp", category: "Lighting", defaultW: 40, defaultD: 14, minW: 30, minD: 10, resizable: true, wallAffinity: "free", clearance: 12 },
  { id: "iron_floor_lamp", name: "Iron floor lamp", category: "Lighting", defaultW: 12, defaultD: 12, minW: 10, minD: 10, resizable: false, wallAffinity: "free", clearance: 6 },
  { id: "table_lamp", name: "Table lamp", category: "Lighting", defaultW: 8, defaultD: 8, minW: 6, minD: 6, resizable: false, wallAffinity: "free", clearance: 0 },
  { id: "pendant_light", name: "Pendant light", category: "Lighting", defaultW: 16, defaultD: 16, minW: 10, minD: 10, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "chandelier", name: "Chandelier", category: "Lighting", defaultW: 30, defaultD: 30, minW: 18, minD: 18, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "wall_sconce", name: "Wall sconce", category: "Lighting", defaultW: 6, defaultD: 4, minW: 4, minD: 3, resizable: false, wallAffinity: "wall", clearance: 0 },

  // Outdoor
  { id: "patio_table_iron", name: "Iron patio table", category: "Outdoor", defaultW: 36, defaultD: 36, minW: 30, minD: 30, resizable: true, wallAffinity: "free", clearance: 24 },
  { id: "patio_chair_iron", name: "Iron patio chair", category: "Outdoor", defaultW: 20, defaultD: 20, minW: 16, minD: 16, resizable: false, wallAffinity: "free", clearance: 0 },
  { id: "outdoor_sofa", name: "Outdoor sofa", category: "Outdoor", defaultW: 72, defaultD: 32, minW: 60, minD: 28, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "sun_lounger", name: "Sun lounger", category: "Outdoor", defaultW: 26, defaultD: 75, minW: 24, minD: 72, resizable: true, wallAffinity: "free", clearance: 24 },
  { id: "umbrella_stand", name: "Patio umbrella", category: "Outdoor", defaultW: 12, defaultD: 12, minW: 10, minD: 10, resizable: false, wallAffinity: "free", clearance: 0 },

  // Entryway
  { id: "console_table", name: "Console table", category: "Entryway", defaultW: 42, defaultD: 14, minW: 30, minD: 12, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "console_table_iron", name: "Iron console table", category: "Entryway", defaultW: 40, defaultD: 14, minW: 30, minD: 12, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "coat_rack", name: "Coat rack", category: "Entryway", defaultW: 16, defaultD: 16, minW: 12, minD: 12, resizable: false, wallAffinity: "free", clearance: 12 },
  { id: "entry_bench", name: "Entry bench", category: "Entryway", defaultW: 36, defaultD: 16, minW: 24, minD: 14, resizable: true, wallAffinity: "wall", clearance: 18 },

  // Kids & Nursery
  { id: "crib", name: "Crib", category: "Kids & Nursery", defaultW: 30, defaultD: 54, minW: 28, minD: 52, resizable: false, wallAffinity: "wall", clearance: 24 },
  { id: "kids_bed", name: "Kids bed", category: "Kids & Nursery", defaultW: 39, defaultD: 75, minW: 36, minD: 72, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "changing_table", name: "Changing table", category: "Kids & Nursery", defaultW: 34, defaultD: 18, minW: 24, minD: 16, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "toy_storage", name: "Toy storage", category: "Kids & Nursery", defaultW: 30, defaultD: 14, minW: 18, minD: 12, resizable: true, wallAffinity: "wall", clearance: 18 },
];

export const CATALOG_BY_ID: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((entry) => [entry.id, entry])
);

export const CATEGORY_ORDER: CatalogCategory[] = [
  "Sleeping",
  "Storage",
  "Living",
  "Work",
  "Dining",
  "Kitchen",
  "Bathroom",
  "Lighting",
  "Outdoor",
  "Entryway",
  "Kids & Nursery",
];

export function catalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG_BY_ID[id];
}
