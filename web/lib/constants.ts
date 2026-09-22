// ─────────────────────────────────────────────────────────────
// Frontend Shared Constants
// Single source of truth for all config values used in the UI.
// ─────────────────────────────────────────────────────────────

/** Backend API base URL — set via NEXT_PUBLIC_API_URL env var */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://fresheri-v6kz.vercel.app";

// Log warning in development if env var is missing
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn("[Fresheri] NEXT_PUBLIC_API_URL is not set — using fallback:", API_BASE_URL);
}

/** Flat base delivery fee shown in UI (KES/RWF) */
export const BASE_DELIVERY_FEE = 500;

/** Default pagination page size */
export const DEFAULT_PAGE_SIZE = 20;

/** Placeholder buyer ID until auth is wired */
export const PLACEHOLDER_BUYER_ID = "00000000-0000-0000-0000-000000000001";

/** Privacy badge default message */
export const PRIVACY_BADGE_MESSAGE =
  "Farmer identity and exact pickup address revealed upon confirming pickup choice.";

/** SELF_PICKUP pre-order lock message */
export const PICKUP_LOCK_MESSAGE =
  "Exact pickup location and contact details will be unlocked upon order confirmation.";
