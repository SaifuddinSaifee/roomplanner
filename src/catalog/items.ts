// Fixed furniture catalog. Sizes are defaults in inches, not a product database.

export type WallAffinity = "wall" | "corner" | "free";

export type CatalogCategory =
  | "Sleeping"
  | "Storage"
  | "Living"
  | "Work"
  | "Dining"
  | "Kitchen"
  | "Bathroom";

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

  // Storage
  { id: "wardrobe", name: "Wardrobe", category: "Storage", defaultW: 30, defaultD: 24, minW: 18, minD: 18, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "chest_drawers", name: "Chest of drawers", category: "Storage", defaultW: 32, defaultD: 18, minW: 18, minD: 14, resizable: true, wallAffinity: "wall", clearance: 24 },
  { id: "bookshelf", name: "Bookshelf", category: "Storage", defaultW: 30, defaultD: 12, minW: 18, minD: 10, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "shoe_rack", name: "Shoe rack", category: "Storage", defaultW: 24, defaultD: 12, minW: 12, minD: 10, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "loft_storage", name: "Loft storage", category: "Storage", defaultW: 36, defaultD: 24, minW: 18, minD: 18, resizable: true, wallAffinity: "wall", clearance: 0 },

  // Living
  { id: "sofa_3", name: "3-seat sofa", category: "Living", defaultW: 78, defaultD: 34, minW: 60, minD: 30, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "sofa_2", name: "2-seat sofa", category: "Living", defaultW: 58, defaultD: 34, minW: 48, minD: 30, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "armchair", name: "Armchair", category: "Living", defaultW: 32, defaultD: 32, minW: 26, minD: 26, resizable: true, wallAffinity: "free", clearance: 24 },
  { id: "coffee_table", name: "Coffee table", category: "Living", defaultW: 42, defaultD: 22, minW: 24, minD: 16, resizable: true, wallAffinity: "free", clearance: 0 },
  { id: "tv_unit", name: "TV unit", category: "Living", defaultW: 48, defaultD: 16, minW: 24, minD: 12, resizable: true, wallAffinity: "wall", clearance: 36 },

  // Work
  { id: "study_desk", name: "Study desk", category: "Work", defaultW: 48, defaultD: 24, minW: 30, minD: 18, resizable: true, wallAffinity: "wall", clearance: 30 },
  { id: "office_chair", name: "Office chair", category: "Work", defaultW: 22, defaultD: 22, minW: 18, minD: 18, resizable: false, wallAffinity: "free", clearance: 0 },

  // Dining
  { id: "dining_4", name: "4-seat table", category: "Dining", defaultW: 36, defaultD: 36, minW: 30, minD: 30, resizable: true, wallAffinity: "free", clearance: 30 },
  { id: "dining_6", name: "6-seat table", category: "Dining", defaultW: 72, defaultD: 36, minW: 60, minD: 32, resizable: true, wallAffinity: "free", clearance: 30 },

  // Kitchen
  { id: "counter_run", name: "Counter run", category: "Kitchen", defaultW: 72, defaultD: 24, minW: 24, minD: 22, resizable: true, wallAffinity: "wall", clearance: 36 },
  { id: "fridge", name: "Fridge", category: "Kitchen", defaultW: 30, defaultD: 30, minW: 24, minD: 24, resizable: false, wallAffinity: "wall", clearance: 30 },
  { id: "sink", name: "Sink", category: "Kitchen", defaultW: 24, defaultD: 22, minW: 18, minD: 18, resizable: true, wallAffinity: "wall", clearance: 24 },

  // Bathroom
  { id: "wc", name: "WC", category: "Bathroom", defaultW: 15, defaultD: 28, minW: 14, minD: 24, resizable: false, wallAffinity: "wall", clearance: 18 },
  { id: "basin", name: "Basin", category: "Bathroom", defaultW: 20, defaultD: 18, minW: 16, minD: 14, resizable: true, wallAffinity: "wall", clearance: 18 },
  { id: "shower_tray", name: "Shower tray", category: "Bathroom", defaultW: 36, defaultD: 36, minW: 30, minD: 30, resizable: true, wallAffinity: "corner", clearance: 24 },
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
];

export function catalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG_BY_ID[id];
}
