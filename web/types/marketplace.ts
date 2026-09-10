// ─────────────────────────────────────────────────────────────
// Shared marketplace types (frontend)
// Aligned with the backend privacy-safe API response shape.
// ─────────────────────────────────────────────────────────────

export type DeliveryOption = "SELF_PICKUP" | "DELIVERED";
export type ListingStatus  = "ACTIVE" | "PARTIALLY_SOLD" | "SOLD_OUT";
export type QuantityUnit   = "KG" | "TON";

export interface ProduceListing {
  id: string;
  produceName: string;
  variety: string | null;
  categoryName: string;
  /**
   * Cooperative or farm name — never a personal farmer name.
   * Matches backend `sellerDisplayName`.
   */
  sellerDisplayName: string;
  sellerVerified: boolean;
  /**
   * District-level area only — e.g. "Kayonza District".
   * Exact street address is NEVER surfaced publicly.
   * Matches backend `region`.
   */
  region: string;
  harvestDate: string;           // ISO date string
  expiryDate: string | null;
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

// ── Filter state ─────────────────────────────────────────────

export interface MarketplaceFilters {
  category: string;
  minAvailableQty: number;
  location: string;
  fulfillment: DeliveryOption | "ALL";
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  category: "",
  minAvailableQty: 0,
  location: "",
  fulfillment: "ALL",
};

// ── Cart ─────────────────────────────────────────────────────

export interface CartItem {
  listing: ProduceListing;
  quantityKg: number;
  /** Fulfillment choice made on the card before adding to cart */
  selectedFulfillment: DeliveryOption;
}

// ── Checkout totals ──────────────────────────────────────────

export interface CheckoutTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

export const BASE_DELIVERY_FEE = 500; // KES/RWF flat base fee

// ── Post-order result ────────────────────────────────────────

/**
 * Pickup contact disclosed to buyer ONLY for SELF_PICKUP
 * confirmed orders.  null for DELIVERED orders.
 */
export interface PickupContact {
  pickupLocation: string;
  farmerContact: string;
  farmerName: string;
  note: string;
}

export interface OrderResult {
  orderId: string;
  orderNumber: string;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  fulfillment: DeliveryOption;
  /** Present only for SELF_PICKUP — null for DELIVERED */
  pickupContact: PickupContact | null;
}
