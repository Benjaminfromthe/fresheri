// ─────────────────────────────────────────────────────────────
// Payment Service — Flutterwave Standard / Inline integration
//
// Architecture:
//   • buildFlwPayload()     — builds the client-side inline config
//   • verifyTransaction()   — server-side secret-key verification
//   • generateTxRef()       — collision-resistant transaction ref
//
// Keys:
//   NEXT_PUBLIC_FLW_PUBLIC_KEY  — safe to ship to the browser
//   FLW_SECRET_KEY              — NEVER sent to the browser;
//                                 used only in API routes / webhook
//   FLW_WEBHOOK_SECRET          — used to verify webhook signatures
// ─────────────────────────────────────────────────────────────

export const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// ── Types ────────────────────────────────────────────────────

export interface FlwCustomer {
  email:        string;
  phone_number: string;
  name:         string;
}

export interface FlwMeta {
  orderId:    string;
  orderNumber: string;
  buyerId:    string;
}

/** Config object passed to FlutterWave.checkout() in the browser */
export interface FlwInlineConfig {
  public_key:   string;
  tx_ref:       string;
  amount:       number;
  currency:     string;           // "RWF"
  payment_options: string;        // "mobilemoney,ussd,card"
  customer:     FlwCustomer;
  meta:         FlwMeta;
  customizations: {
    title:       string;
    description: string;
    logo:        string;
  };
  redirect_url?: string;
  callback?:    (response: FlwCallbackResponse) => void;
  onclose?:     () => void;
}

export interface FlwCallbackResponse {
  status:          "successful" | "failed" | "cancelled";
  transaction_id?: number;
  tx_ref:          string;
  flw_ref?:        string;
  amount?:         number;
  currency?:       string;
}

/** Shape of Flutterwave's GET /transactions/:id/verify response */
export interface FlwVerifyResponse {
  status:  "success" | "error";
  message: string;
  data: {
    id:          number;
    tx_ref:      string;
    flw_ref:     string;
    status:      "successful" | "failed" | "cancelled";
    amount:      number;
    currency:    string;
    charged_amount: number;
    customer: {
      email:        string;
      phone_number: string;
      name:         string;
    };
    meta?: FlwMeta;
  } | null;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Generates a collision-resistant transaction reference.
 * Format: FRH-{orderId-prefix}-{timestamp}-{random4}
 */
export function generateTxRef(orderId: string): string {
  const prefix  = orderId.slice(-8).replace(/-/g, "");
  const ts      = Date.now().toString(36).toUpperCase();
  const rand    = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FRH-${prefix}-${ts}-${rand}`;
}

/**
 * Builds the FlutterWave.checkout() config for the browser.
 * Called client-side — uses NEXT_PUBLIC_FLW_PUBLIC_KEY.
 */
export function buildFlwPayload(params: {
  txRef:       string;
  amount:      number;
  currency:    string;
  orderId:     string;
  orderNumber: string;
  buyerId:     string;
  customerEmail:  string;
  customerPhone:  string;
  customerName:   string;
}): FlwInlineConfig {
  return {
    public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY ?? "",
    tx_ref:     params.txRef,
    amount:     params.amount,
    currency:   params.currency,
    payment_options: "mobilemoney,ussd,card",
    customer: {
      email:        params.customerEmail,
      phone_number: params.customerPhone,
      name:         params.customerName,
    },
    meta: {
      orderId:     params.orderId,
      orderNumber: params.orderNumber,
      buyerId:     params.buyerId,
    },
    customizations: {
      title:       "Fresheri — Produce Marketplace",
      description: `Order #${params.orderNumber}`,
      logo:        "https://fresheri.vercel.app/images/logo.png",
    },
  };
}

/**
 * Server-side transaction verification.
 * Must NEVER be called from client components — uses FLW_SECRET_KEY.
 *
 * Returns null if:
 *   - Network error
 *   - Transaction not found
 *   - Status is not "successful"
 *   - Amount doesn't match (anti-tamper)
 */
export async function verifyTransaction(
  transactionId: string | number,
  expectedAmountRwf: number
): Promise<FlwVerifyResponse["data"] | null> {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) {
    console.error("[Payment] FLW_SECRET_KEY not configured");
    return null;
  }

  try {
    const res = await fetch(
      `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
      {
        method:  "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        // Never cache payment verification
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(`[Payment] Verify failed: HTTP ${res.status}`);
      return null;
    }

    const body = (await res.json()) as FlwVerifyResponse;

    if (body.status !== "success" || !body.data) {
      console.error("[Payment] Verify API error:", body.message);
      return null;
    }

    const tx = body.data;

    // Anti-tamper: ensure amount ≥ expected (allow minor rounding tolerance)
    if (tx.status !== "successful") {
      console.warn(`[Payment] Transaction ${transactionId} status: ${tx.status}`);
      return null;
    }

    if (tx.charged_amount < expectedAmountRwf - 1) {
      console.error(
        `[Payment] Amount mismatch: charged ${tx.charged_amount}, expected ${expectedAmountRwf}`
      );
      return null;
    }

    return tx;
  } catch (err) {
    console.error("[Payment] Verify exception:", err);
    return null;
  }
}

/**
 * Validates a Flutterwave webhook signature.
 * FLW sends the secret hash in the `verif-hash` header.
 */
export function verifyWebhookSignature(
  receivedHash: string | null
): boolean {
  const expected = process.env.FLW_WEBHOOK_SECRET;
  if (!expected) {
    console.warn("[Payment] FLW_WEBHOOK_SECRET not set — skipping signature check");
    return true; // Allow in dev when secret not configured
  }
  return receivedHash === expected;
}
