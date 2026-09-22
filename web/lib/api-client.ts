// ─────────────────────────────────────────────────────────────
// API Client — Single gateway for all backend calls
//
// Architecture compliance:
//   ✅ All fetch calls live here — never in page components
//   ✅ API_BASE_URL from web/lib/constants.ts
//   ✅ Typed request/response shapes
//   ✅ Consistent error handling — throws ApiError on non-2xx
// ─────────────────────────────────────────────────────────────

import { API_BASE_URL } from "./constants";
import type {
  OrderResult,
  ProduceListing,
  DeliveryOption,
} from "@/types/marketplace";

// ── Typed API error ──────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Internal fetch wrapper ───────────────────────────────────

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res  = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let code    = "INTERNAL_ERROR";
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json() as { error?: string; message?: string };
      code    = body.error    ?? code;
      message = body.message  ?? message;
    } catch {
      // non-JSON error body — keep defaults
    }
    throw new ApiError(res.status, code, message);
  }

  return res.json() as Promise<T>;
}

// ── Orders ───────────────────────────────────────────────────

export interface PlaceOrderPayload {
  buyerId:         string;
  listingId:       string;
  quantityKg:      number;
  deliveryOption:  DeliveryOption;
  deliveryAddress?: string;
  deliveryNotes?:  string;
  deliveryFee?:    number;
}

/**
 * POST /orders
 * Places a single order line item against a listing.
 * Returns the full OrderResult including optional pickupContact.
 */
export async function placeOrder(
  payload: PlaceOrderPayload
): Promise<OrderResult> {
  const res = await apiFetch<{ data: OrderResult }>("/orders", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  return res.data;
}

/**
 * POST /orders — batch
 * Places one order per cart item concurrently.
 */
export async function placeOrderBatch(
  items: PlaceOrderPayload[]
): Promise<OrderResult[]> {
  return Promise.all(items.map(placeOrder));
}

// ── Listings ─────────────────────────────────────────────────

export interface ListingQueryParams {
  category?:       string;
  minAvailableQty?: number;
  region?:         string;
  fulfillment?:    DeliveryOption;
  search?:         string;
  page?:           number;
  pageSize?:       number;
}

export interface ListingsResponse {
  listings: ProduceListing[];
  pagination: {
    total:      number;
    page:       number;
    pageSize:   number;
    totalPages: number;
  };
}

/**
 * GET /listings
 * Fetches public privacy-safe listing catalogue with optional filters.
 */
export async function fetchListings(
  params: ListingQueryParams = {}
): Promise<ListingsResponse> {
  const qs = new URLSearchParams();
  if (params.category)                          qs.set("category",       params.category);
  if (params.minAvailableQty !== undefined)      qs.set("minAvailableQty", String(params.minAvailableQty));
  if (params.region)                            qs.set("region",         params.region);
  if (params.fulfillment)                       qs.set("fulfillment",    params.fulfillment);
  if (params.search)                            qs.set("search",         params.search);
  if (params.page !== undefined)                qs.set("page",           String(params.page));
  if (params.pageSize !== undefined)            qs.set("pageSize",       String(params.pageSize));

  const query = qs.toString();
  return apiFetch<ListingsResponse>(`/listings${query ? `?${query}` : ""}`);
}

/**
 * GET /listings/:id
 * Fetches a single public listing by ID.
 */
export async function fetchListingById(
  id: string
): Promise<ProduceListing> {
  const res = await apiFetch<{ data: ProduceListing }>(`/listings/${id}`);
  return res.data;
}

// ── Health ───────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return apiFetch("/health");
}

// ── Auth ─────────────────────────────────────────────────────

export interface AuthResult {
  token:     string;
  userId:    string;
  firstName: string;
  lastName:  string;
  role:      string;
}

export interface SignUpPayload {
  firstName:          string;
  lastName:           string;
  phone:              string;
  password:           string;
  role:               string;
  farmName?:          string;
  cooperativeRegNumber?: string;
  farmLocation?:      string;
  businessName?:      string;
  businessRegNumber?: string;
  businessAddress?:   string;
  vehicleType?:       string;
  vehicleRegNumber?:  string;
  operatingRegion?:   string;
}

export interface SignInPayload {
  phone:    string;
  password: string;
}

/** POST /auth/signup — creates account in Neon DB, returns JWT */
export async function authSignUp(payload: SignUpPayload): Promise<AuthResult> {
  const res = await apiFetch<{ data: AuthResult }>("/auth/signup", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  return res.data;
}

/** POST /auth/signin — phone+password, returns JWT */
export async function authSignIn(payload: SignInPayload): Promise<AuthResult> {
  const res = await apiFetch<{ data: AuthResult }>("/auth/signin", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  return res.data;
}

/** POST /auth/google — Google ID token, returns JWT */
export async function authGoogle(idToken: string): Promise<AuthResult> {
  const res = await apiFetch<{ data: AuthResult }>("/auth/google", {
    method: "POST",
    body:   JSON.stringify({ idToken }),
  });
  return res.data;
}

// ── Session helpers (localStorage) ───────────────────────────

const TOKEN_KEY = "fresheri_token";
const USER_KEY  = "fresheri_user";

export function saveSession(result: AuthResult): void {
  try {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify({
      userId: result.userId,
      firstName: result.firstName,
      lastName: result.lastName,
      role: result.role,
    }));
  } catch { /* SSR safe */ }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* SSR safe */ }
}

export function getStoredUser(): AuthResult | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user  = localStorage.getItem(USER_KEY);
    if (!token || !user) return null;
    return { token, ...JSON.parse(user) };
  } catch { return null; }
}
