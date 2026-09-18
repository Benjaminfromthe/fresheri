// ─────────────────────────────────────────────────────────────
// Landing page hardcoded produce data
// Replace with live API call (GET /listings) when auth is wired.
//
// Privacy rules enforced here:
//   ✅ No farmer full name, phone, national ID, or exact address
//   ✅ Only cooperative/farm name + district-level region
//   ✅ Exact pickup location disclosed ONLY post-order
// ─────────────────────────────────────────────────────────────

export type FulfillmentOption = "SELF_PICKUP" | "DELIVERED" | "BOTH";

export interface LandingProduce {
  id:               string;
  produceName:      string;
  variety:          string | null;
  categoryName:     string;
  /** District-level region only — never exact coordinates */
  region:           string;
  /** Cooperative or farm name — never a personal farmer name */
  sellerDisplayName: string;
  sellerVerified:   boolean;
  imageFile:        string;      // filename in /public/images/assets/products/
  gradientFrom:     string;      // Tailwind from-* for placeholder
  gradientTo:       string;      // Tailwind to-*
  emoji:            string;      // Fallback emoji when image absent
  availableQtyKg:   number;
  unitPriceKes:     number;
  harvestDate:      string;      // ISO date
  fulfillment:      FulfillmentOption;
  isOrganic:        boolean;
  minOrderKg:       number;
}

export const LANDING_PRODUCE: LandingProduce[] = [
  {
    id:               "lp-1",
    produceName:      "Cabbage",
    variety:          "Gloria F1",
    categoryName:     "Vegetables",
    region:           "Nyabihu District",
    sellerDisplayName:"Nyabihu Farmers Cooperative",
    sellerVerified:   true,
    imageFile:        "cabbage.jpg",
    gradientFrom:     "from-emerald-400",
    gradientTo:       "to-green-600",
    emoji:            "🥬",
    availableQtyKg:   5000,
    unitPriceKes:     25,
    harvestDate:      "2026-09-02",
    fulfillment:      "BOTH",
    isOrganic:        false,
    minOrderKg:       50,
  },
  {
    id:               "lp-2",
    produceName:      "Green Bananas",
    variety:          null,
    categoryName:     "Fruits",
    region:           "Eastern Province",
    sellerDisplayName:"Eastern Province Agri-Coop",
    sellerVerified:   true,
    imageFile:        "green-bananas.jpg",
    gradientFrom:     "from-lime-400",
    gradientTo:       "to-green-500",
    emoji:            "🍌",
    availableQtyKg:   2000,
    unitPriceKes:     35,
    harvestDate:      "2026-09-01",
    fulfillment:      "DELIVERED",
    isOrganic:        false,
    minOrderKg:       100,
  },
  {
    id:               "lp-3",
    produceName:      "Peppers",
    variety:          "California Wonder",
    categoryName:     "Vegetables",
    region:           "Musanze District",
    sellerDisplayName:"Musanze Vegetable Growers",
    sellerVerified:   true,
    imageFile:        "peppers.jpg",
    gradientFrom:     "from-red-400",
    gradientTo:       "to-orange-500",
    emoji:            "🌶️",
    availableQtyKg:   800,
    unitPriceKes:     120,
    harvestDate:      "2026-09-04",
    fulfillment:      "BOTH",
    isOrganic:        true,
    minOrderKg:       20,
  },
  {
    id:               "lp-4",
    produceName:      "Tomatoes",
    variety:          "Beef Steak",
    categoryName:     "Vegetables",
    region:           "Kirehe District",
    sellerDisplayName:"Kirehe Cooperative Society",
    sellerVerified:   true,
    imageFile:        "tomatoes.jpg",
    gradientFrom:     "from-rose-400",
    gradientTo:       "to-red-600",
    emoji:            "🍅",
    availableQtyKg:   1500,
    unitPriceKes:     45,
    harvestDate:      "2026-09-03",
    fulfillment:      "BOTH",
    isOrganic:        false,
    minOrderKg:       50,
  },
  {
    id:               "lp-5",
    produceName:      "Irish Potatoes",
    variety:          "Kinigi",
    categoryName:     "Tubers",
    region:           "Musanze District",
    sellerDisplayName:"Musanze Highland Farmers",
    sellerVerified:   true,
    imageFile:        "irish-potatoes.jpg",
    gradientFrom:     "from-amber-400",
    gradientTo:       "to-yellow-600",
    emoji:            "🥔",
    availableQtyKg:   10000,
    unitPriceKes:     38,
    harvestDate:      "2026-08-28",
    fulfillment:      "BOTH",
    isOrganic:        false,
    minOrderKg:       100,
  },
  {
    id:               "lp-6",
    produceName:      "African Eggplant",
    variety:          null,
    categoryName:     "Vegetables",
    region:           "Bugesera District",
    sellerDisplayName:"Bugesera Women Farmers Coop",
    sellerVerified:   true,
    imageFile:        "eggplant.jpg",
    gradientFrom:     "from-purple-400",
    gradientTo:       "to-violet-600",
    emoji:            "🍆",
    availableQtyKg:   300,
    unitPriceKes:     90,
    harvestDate:      "2026-09-05",
    fulfillment:      "SELF_PICKUP",
    isOrganic:        true,
    minOrderKg:       10,
  },
];

/** Format quantity: kg → tons when ≥1000 */
export function formatQty(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toLocaleString()} kg`;
}
