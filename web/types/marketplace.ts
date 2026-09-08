// ─────────────────────────────────────────────────────────────
// Shared marketplace types (frontend)
// ─────────────────────────────────────────────────────────────

export type DeliveryOption = "SELF_PICKUP" | "DELIVERED";
export type ListingStatus  = "ACTIVE" | "PARTIALLY_SOLD" | "SOLD_OUT";
export type QuantityUnit   = "KG" | "TON";

export interface ProduceListing {
  id: string;
  produceName: string;
  variety: string | null;
  categoryName: string;
  /** Name of the selling cooperative / farmer */
  sellerName: string;
  sellerVerified: boolean;
  farmLocation: string;
  harvestDate: string;           // ISO date string
  totalQuantity: number;
  availableQuantity: number;
  unit: QuantityUnit;
  minimumOrderQty: number;
  unitPrice: number;             // price per KG or TON
  currency: string;
  deliveryOptions: DeliveryOption[];
  deliveryRadiusKm: number | null;
  imageUrls: string[];
  isOrganic: boolean;
  status: ListingStatus;
}

// ── Filter state ──────────────────────────────────────────────

export interface MarketplaceFilters {
  category: string;              // "" = all
  minAvailableQty: number;       // kg — 0 = no minimum
  location: string;              // "" = all
  fulfillment: DeliveryOption | "ALL";
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  category: "",
  minAvailableQty: 0,
  location: "",
  fulfillment: "ALL",
};

// ── Cart / checkout ───────────────────────────────────────────

export interface CartItem {
  listing: ProduceListing;
  quantityKg: number;
}

export interface CheckoutTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

// Delivery fee schedule (per km band) — replace with API call later
export const DELIVERY_FEE_PER_KM = 15;   // KES/RWF per km flat rate
export const BASE_DELIVERY_FEE   = 500;  // base fee when DELIVERED is selected
