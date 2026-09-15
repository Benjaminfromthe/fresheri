// ─────────────────────────────────────────────────────────────
// Centralized Runtime Configuration Constants
// All magic numbers and environment-driven defaults live here.
// ─────────────────────────────────────────────────────────────

/** USSD session expiry in minutes (default: 5) */
export const USSD_SESSION_TTL_MINUTES: number =
  Number(process.env.USSD_SESSION_TTL_MINUTES ?? 5);

/** Maximum SMS body length — 3 segments × 153 chars */
export const SMS_MAX_BODY_LENGTH = 459;

/** Base delivery fee in local currency (KES/RWF) */
export const BASE_DELIVERY_FEE = 500;

/** Default pagination page size */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed page size */
export const MAX_PAGE_SIZE = 100;

/** Minimum order quantity (kg) fallback */
export const MIN_ORDER_QTY_KG = 1;

/** Default "uncategorised" category slug for USSD-published listings */
export const DEFAULT_CATEGORY_SLUG = "uncategorised";

/** Default "uncategorised" category name */
export const DEFAULT_CATEGORY_NAME = "Uncategorised";

/** Placeholder text for farm location when published via USSD */
export const USSD_DEFAULT_FARM_LOCATION = "To be updated";
