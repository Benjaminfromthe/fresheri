// ─────────────────────────────────────────────────────────────
// Paypack Rwanda Payment Service
//
// Paypack processes MTN MoMo + Airtel Money in Rwanda.
// Docs: https://docs.paypack.rw
// SDK:  https://github.com/quarksgroup/paypack-js
//
// Flow:
//   1. POST /events/cashin  → triggers MoMo push to customer phone
//   2. Customer approves on their phone (no OTP screen needed)
//   3. Paypack sends webhook to /api/webhooks/paypack
//   4. We verify + update order paymentStatus = PAID
//
// Keys (server-side only — never sent to browser):
//   PAYPACK_CLIENT_ID
//   PAYPACK_CLIENT_SECRET
// ─────────────────────────────────────────────────────────────

export const PAYPACK_BASE = "https://payments.paypack.rw/api";

// ── Types ────────────────────────────────────────────────────

export interface PaypackCashinPayload {
  amount:  number;   // RWF — must be integer
  number:  string;   // e.g. "0794915285" or "250794915285"
  environment?: "development" | "production";
}

export interface PaypackCashinResponse {
  ref:         string;   // transaction reference — store this
  status:      string;   // "pending" initially
  kind:        string;   // "CASHIN"
  amount:      number;
  client:      string;   // phone number
  created_at:  string;
  updated_at:  string;
}

export interface PaypackWebhookEvent {
  ref:    string;
  status: "successful" | "failed" | "pending";
  kind:   "CASHIN" | "CASHOUT";
  data: {
    ref:    string;
    amount: number;
    client: string;   // phone number
  };
}

export interface PaypackTransactionStatus {
  ref:        string;
  status:     "successful" | "failed" | "pending";
  amount:     number;
  client:     string;
}

// ── Auth token cache (server process lifetime) ────────────────

let cachedToken: string | null = null;
let tokenExpiry: number        = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const clientId     = process.env.PAYPACK_CLIENT_ID ?? "";
  const clientSecret = process.env.PAYPACK_CLIENT_SECRET ?? "";

  if (!clientId || !clientSecret) {
    throw new Error("PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET must be set.");
  }

  const res = await fetch(`${PAYPACK_BASE}/auth/agents/authorize`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    cache:   "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paypack auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access: string; refresh: string };
  cachedToken = data.access;
  // Paypack tokens last 24h — refresh 1h before expiry
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

// ── Normalise phone to 07xxxxxxxx format ─────────────────────

export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // 250794915285 → 0794915285
  if (digits.startsWith("250") && digits.length === 12) return `0${digits.slice(3)}`;
  // +250794915285 → already handled above
  if (digits.length === 9) return `0${digits}`;  // 794915285 → 0794915285
  return digits; // already 0794915285
}

// ─────────────────────────────────────────────────────────────
// initiateCashin — triggers MoMo push to customer's phone
// The customer approves on their phone — no redirect/OTP screen
// ─────────────────────────────────────────────────────────────

export async function initiateCashin(
  phone:  string,
  amount: number,
): Promise<PaypackCashinResponse> {
  const token = await getAccessToken();

  const payload: PaypackCashinPayload = {
    amount:      Math.round(amount),   // must be integer RWF
    number:      normalisePhone(phone),
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
  };

  const res = await fetch(`${PAYPACK_BASE}/events/cashin`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body:  JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paypack cashin failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<PaypackCashinResponse>;
}

// ─────────────────────────────────────────────────────────────
// getTransactionStatus — poll to check if payment was approved
// ─────────────────────────────────────────────────────────────

export async function getTransactionStatus(
  ref: string
): Promise<PaypackTransactionStatus> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPACK_BASE}/events/${ref}`, {
    method:  "GET",
    headers: { "Authorization": `Bearer ${token}` },
    cache:   "no-store",
  });

  if (!res.ok) {
    throw new Error(`Paypack status check failed (${res.status})`);
  }

  const data = (await res.json()) as { data: PaypackTransactionStatus };
  return data.data;
}

// ─────────────────────────────────────────────────────────────
// verifyWebhookSecret — Paypack signs webhooks with HMAC-SHA256
// ─────────────────────────────────────────────────────────────

export function verifyPaypackWebhook(
  receivedSecret: string | null
): boolean {
  const expected = process.env.PAYPACK_WEBHOOK_SECRET;
  if (!expected) return true;  // skip check in dev when not set
  return receivedSecret === expected;
}
