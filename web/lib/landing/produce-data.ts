// ─────────────────────────────────────────────────────────────
// Landing page hardcoded produce data
//
// PRIVACY RULES ENFORCED:
//   ✅ sellerDisplayName = anonymous trust badge (never real name)
//   ✅ All regions are Rwanda districts
//   ✅ Currency: RWF (Rwandan Francs)
//   ✅ Exact farm location disclosed ONLY post-order
// ─────────────────────────────────────────────────────────────

export type FulfillmentOption = "SELF_PICKUP" | "DELIVERED" | "BOTH";

export interface LandingProduce {
  id:                string;
  produceName:       string;
  variety:           string | null;
  categoryName:      string;
  region:            string;         // District-level only
  sellerDisplayName: string;         // Anonymous trust badge
  sellerVerified:    boolean;
  imageFile:         string;
  gradientFrom:      string;
  gradientTo:        string;
  emoji:             string;
  availableQtyKg:    number;
  unitPriceRwf:      number;         // Renamed: RWF not KES
  harvestDate:       string;
  fulfillment:       FulfillmentOption;
  isOrganic:         boolean;
  minOrderKg:        number;
}

// Anonymous trust badge labels
const VERIFIED_COOP   = "Verified Cooperative Member";
const ORGANIC_COOP    = "Verified Organic Cooperative";

export const LANDING_PRODUCE: LandingProduce[] = [
  {
    id: "lp-1", produceName: "Cabbage", variety: "Gloria F1",
    categoryName: "Vegetables", region: "Nyabihu District",
    sellerDisplayName: VERIFIED_COOP, sellerVerified: true,
    imageFile: "cabbage.jpg", gradientFrom: "from-emerald-400", gradientTo: "to-green-600",
    emoji: "🥬", availableQtyKg: 5000, unitPriceRwf: 250, harvestDate: "2026-09-02",
    fulfillment: "BOTH", isOrganic: false, minOrderKg: 50,
  },
  {
    id: "lp-2", produceName: "Green Bananas", variety: null,
    categoryName: "Fruits", region: "Kayonza District",
    sellerDisplayName: VERIFIED_COOP, sellerVerified: true,
    imageFile: "green-bananas.jpg", gradientFrom: "from-lime-400", gradientTo: "to-green-500",
    emoji: "🍌", availableQtyKg: 2000, unitPriceRwf: 350, harvestDate: "2026-09-01",
    fulfillment: "DELIVERED", isOrganic: false, minOrderKg: 100,
  },
  {
    id: "lp-3", produceName: "Peppers", variety: "California Wonder",
    categoryName: "Vegetables", region: "Rubavu District",
    sellerDisplayName: ORGANIC_COOP, sellerVerified: true,
    imageFile: "peppers.jpg", gradientFrom: "from-red-400", gradientTo: "to-orange-500",
    emoji: "🌶️", availableQtyKg: 800, unitPriceRwf: 1200, harvestDate: "2026-09-04",
    fulfillment: "BOTH", isOrganic: true, minOrderKg: 20,
  },
  {
    id: "lp-4", produceName: "Tomatoes", variety: "Sukari F1",
    categoryName: "Vegetables", region: "Rwamagana District",
    sellerDisplayName: VERIFIED_COOP, sellerVerified: true,
    imageFile: "tomatoes.jpg", gradientFrom: "from-rose-400", gradientTo: "to-red-600",
    emoji: "🍅", availableQtyKg: 1500, unitPriceRwf: 450, harvestDate: "2026-09-03",
    fulfillment: "BOTH", isOrganic: false, minOrderKg: 50,
  },
  {
    id: "lp-5", produceName: "Irish Potatoes", variety: "Kinigi",
    categoryName: "Tubers", region: "Musanze District",
    sellerDisplayName: VERIFIED_COOP, sellerVerified: true,
    imageFile: "irish-potatoes.jpg", gradientFrom: "from-amber-400", gradientTo: "to-yellow-600",
    emoji: "🥔", availableQtyKg: 10000, unitPriceRwf: 380, harvestDate: "2026-08-28",
    fulfillment: "BOTH", isOrganic: false, minOrderKg: 100,
  },
  {
    id: "lp-6", produceName: "African Eggplant", variety: null,
    categoryName: "Vegetables", region: "Bugesera District",
    sellerDisplayName: ORGANIC_COOP, sellerVerified: true,
    imageFile: "eggplant.jpg", gradientFrom: "from-purple-400", gradientTo: "to-violet-600",
    emoji: "🍆", availableQtyKg: 300, unitPriceRwf: 900, harvestDate: "2026-09-05",
    fulfillment: "SELF_PICKUP", isOrganic: true, minOrderKg: 10,
  },
];

/** Format quantity: kg → tons when ≥1000 */
export function formatQty(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toLocaleString()} kg`;
}

/** Format RWF price with thousands separator */
export function formatRwf(amount: number): string {
  return `RWF ${amount.toLocaleString()}`;
}
