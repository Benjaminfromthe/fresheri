// ─────────────────────────────────────────────────────────────
// Mock produce listings — replace with real API fetch later.
// Fields match the backend privacy-safe PublicListing shape.
//
// PRIVACY RULES ENFORCED:
//   ✅ sellerDisplayName shows anonymous trust badge ONLY
//      (never a real cooperative/farmer name on public cards)
//   ✅ Exact pickup location disclosed post-order ONLY
//   ✅ All locations are Rwandan districts
//   ✅ Currency: RWF (Rwandan Francs)
// ─────────────────────────────────────────────────────────────

import { ProduceListing } from "@/types/marketplace";

// Anonymous trust badge labels used instead of real names
// Real names are disclosed post-order on SELF_PICKUP receipts only
const VERIFIED_COOP    = "Verified Cooperative Member";
const VERIFIED_FARMER  = "Verified Commercial Farmer";
const ORGANIC_COOP     = "Verified Organic Cooperative";

export const MOCK_LISTINGS: ProduceListing[] = [
  {
    id: "1",
    produceName:       "Tomatoes",
    variety:           "Sukari F1",
    categoryName:      "Vegetables",
    sellerDisplayName: VERIFIED_COOP,
    sellerVerified:    true,
    region:            "Rwamagana District",
    harvestDate:       "2026-09-01",
    expiryDate:        null,
    totalQuantity:     2000,
    availableQuantity: 1500,
    unit:              "KG",
    minimumOrderQty:   50,
    unitPrice:         450,
    currency:          "RWF",
    deliveryOptions:   ["SELF_PICKUP", "DELIVERED"],
    deliveryRadiusKm:  80,
    imageUrls:         ["/images/assets/products/tomatoes.jpg"],
    isOrganic:         false,
    status:            "PARTIALLY_SOLD",
  },
  {
    id: "2",
    produceName:       "Irish Potatoes",
    variety:           "Kinigi",
    categoryName:      "Tubers",
    sellerDisplayName: VERIFIED_COOP,
    sellerVerified:    true,
    region:            "Musanze District",
    harvestDate:       "2026-08-28",
    expiryDate:        null,
    totalQuantity:     10000,
    availableQuantity: 10000,
    unit:              "KG",
    minimumOrderQty:   100,
    unitPrice:         380,
    currency:          "RWF",
    deliveryOptions:   ["SELF_PICKUP", "DELIVERED"],
    deliveryRadiusKm:  60,
    imageUrls:         ["/images/assets/products/irish-potatoes.jpg"],
    isOrganic:         false,
    status:            "ACTIVE",
  },
  {
    id: "3",
    produceName:       "Cabbage",
    variety:           "Gloria F1",
    categoryName:      "Vegetables",
    sellerDisplayName: VERIFIED_COOP,
    sellerVerified:    true,
    region:            "Nyabihu District",
    harvestDate:       "2026-09-02",
    expiryDate:        null,
    totalQuantity:     5000,
    availableQuantity: 5000,
    unit:              "KG",
    minimumOrderQty:   50,
    unitPrice:         250,
    currency:          "RWF",
    deliveryOptions:   ["SELF_PICKUP", "DELIVERED"],
    deliveryRadiusKm:  70,
    imageUrls:         ["/images/assets/products/cabbage.jpg"],
    isOrganic:         false,
    status:            "ACTIVE",
  },
  {
    id: "4",
    produceName:       "Peppers",
    variety:           "California Wonder",
    categoryName:      "Vegetables",
    sellerDisplayName: ORGANIC_COOP,
    sellerVerified:    true,
    region:            "Rubavu District",
    harvestDate:       "2026-09-04",
    expiryDate:        null,
    totalQuantity:     800,
    availableQuantity: 800,
    unit:              "KG",
    minimumOrderQty:   20,
    unitPrice:         1200,
    currency:          "RWF",
    deliveryOptions:   ["SELF_PICKUP", "DELIVERED"],
    deliveryRadiusKm:  null,
    imageUrls:         ["/images/assets/products/peppers.jpg"],
    isOrganic:         true,
    status:            "ACTIVE",
  },
  {
    id: "5",
    produceName:       "Green Bananas",
    variety:           null,
    categoryName:      "Fruits",
    sellerDisplayName: VERIFIED_COOP,
    sellerVerified:    true,
    region:            "Kayonza District",
    harvestDate:       "2026-09-01",
    expiryDate:        null,
    totalQuantity:     2000,
    availableQuantity: 2000,
    unit:              "KG",
    minimumOrderQty:   100,
    unitPrice:         350,
    currency:          "RWF",
    deliveryOptions:   ["DELIVERED"],
    deliveryRadiusKm:  150,
    imageUrls:         ["/images/assets/products/green-bananas.jpg"],
    isOrganic:         false,
    status:            "ACTIVE",
  },
  {
    id: "6",
    produceName:       "African Eggplant",
    variety:           null,
    categoryName:      "Vegetables",
    sellerDisplayName: ORGANIC_COOP,
    sellerVerified:    true,
    region:            "Bugesera District",
    harvestDate:       "2026-09-05",
    expiryDate:        null,
    totalQuantity:     300,
    availableQuantity: 300,
    unit:              "KG",
    minimumOrderQty:   10,
    unitPrice:         900,
    currency:          "RWF",
    deliveryOptions:   ["SELF_PICKUP"],
    deliveryRadiusKm:  null,
    imageUrls:         ["/images/assets/products/eggplant.jpg"],
    isOrganic:         true,
    status:            "ACTIVE",
  },
];

export const CROP_CATEGORIES = [
  ...new Set(MOCK_LISTINGS.map((l) => l.categoryName)),
].sort();

// Keep LOCATIONS for legacy text search — not used by new province/district filter
export const LOCATIONS = [
  ...new Set(MOCK_LISTINGS.map((l) => l.region.replace(" District", "").replace(" Province", ""))),
].sort();
