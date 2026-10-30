// ─────────────────────────────────────────────────────────────
// Paypack Rwanda Payment Service
// Uses the official paypack-js SDK for correct endpoints.
//
// Supports: MTN MoMo + Airtel Money Rwanda
// SDK docs: https://github.com/quarksgroup/paypack-js
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PaypackJs = require("paypack-js").default;

// ── Singleton SDK instance ────────────────────────────────────
let _paypack: typeof PaypackJs | null = null;

function getPaypack() {
  if (_paypack) return _paypack;

  const clientId =
    process.env.PAYPACK_CLIENT_ID ??
    process.env.NEXT_PUBLIC_PAYPACK_CLIENT_ID ??
    "1a6109da-ceed-11f1-a039-00163ea80869";

  const clientSecret =
    process.env.PAYPACK_CLIENT_SECRET ??
    process.env.NEXT_PUBLIC_PAYPACK_CLIENT_SECRET ??
    "99a81077c601ee5180c7ebbd0d7bd2feda39a3ee5e6b4b0d3255bfef95601890afd80709";

  _paypack = new PaypackJs({ client_id: clientId, client_secret: clientSecret });
  return _paypack;
}

// ── Types ────────────────────────────────────────────────────

export interface PaypackCashinResponse {
  ref:        string;
  status:     string;
  kind:       string;
  amount:     number;
  client:     string;
  created_at: string;
  updated_at: string;
}

export interface PaypackTransactionStatus {
  ref:    string;
  status: "successful" | "failed" | "pending";
  amount: number;
  client: string;
}

// ── Normalise phone to Paypack accepted format ────────────────
// Regex expected: /^(\+?25)?(078|079|075|073|072)\d{7}$/
// So 0794915285 → valid ✅

export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // 250794915285 (12 digits) → 0794915285
  if (digits.startsWith("250") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  // 0794915285 (10 digits) — already correct
  if (digits.startsWith("0") && digits.length === 10) {
    return digits;
  }
  // 794915285 (9 digits, missing 0)
  if (digits.length === 9) {
    return `0${digits}`;
  }
  return digits;
}

// ─────────────────────────────────────────────────────────────
// initiateCashin — triggers MoMo push to customer's phone
// ─────────────────────────────────────────────────────────────

export async function initiateCashin(
  phone:  string,
  amount: number,
): Promise<PaypackCashinResponse> {
  const paypack = getPaypack();
  const number  = normalisePhone(phone);
  const env     = process.env.NODE_ENV === "production" ? "production" : "development";

  const res = await paypack.cashin({
    number,
    amount:      Math.round(amount),
    environment: env,
  });

  // SDK wraps response in .data
  return (res.data ?? res) as PaypackCashinResponse;
}

// ─────────────────────────────────────────────────────────────
// getTransactionStatus — poll for payment approval
// ─────────────────────────────────────────────────────────────

export async function getTransactionStatus(
  ref: string
): Promise<PaypackTransactionStatus> {
  const paypack = getPaypack();
  const res     = await paypack.transaction(ref);
  return (res.data ?? res) as PaypackTransactionStatus;
}

// ─────────────────────────────────────────────────────────────
// verifyPaypackWebhook
// ─────────────────────────────────────────────────────────────

export function verifyPaypackWebhook(receivedSecret: string | null): boolean {
  const expected = process.env.PAYPACK_WEBHOOK_SECRET;
  if (!expected) return true;
  return receivedSecret === expected;
}
