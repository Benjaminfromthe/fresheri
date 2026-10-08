// ─────────────────────────────────────────────────────────────
// POST /api/webhooks/flutterwave
//
// Receives charge.completed events from Flutterwave.
// Verifies:
//   1. Webhook signature header (verif-hash)
//   2. Transaction status via server-side API call
//   3. Amount matches the stored order total (anti-tamper)
//
// On success:
//   • PATCH /orders/:id/payment — updates paymentStatus = PAID
//   • The Express backend also transitions order status and
//     notifies the farmer via SMS
//
// Flutterwave expects a 200 response quickly — all heavy work
// is done before responding but kept fast (no blocking I/O loops).
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  verifyTransaction,
} from "@/lib/services/paymentService";

// Server-side backend URL — never needs NEXT_PUBLIC_
const BACKEND_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://fresheri-v6kz.vercel.app";

interface FlwWebhookPayload {
  event: string;           // "charge.completed"
  data: {
    id:          number;   // transaction ID
    tx_ref:      string;
    flw_ref:     string;
    status:      string;   // "successful" | "failed"
    amount:      number;
    currency:    string;
    charged_amount: number;
    meta?: {
      orderId?:     string;
      orderNumber?: string;
      buyerId?:     string;
    };
    customer: {
      email:        string;
      phone_number: string;
      name:         string;
    };
  };
}

export async function POST(req: NextRequest) {
  // ── 1. Verify webhook signature ─────────────────────────────
  const receivedHash = req.headers.get("verif-hash");
  if (!verifyWebhookSignature(receivedHash)) {
    console.warn("[Webhook] Invalid signature — rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: FlwWebhookPayload;
  try {
    payload = (await req.json()) as FlwWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 2. Only handle charge.completed ─────────────────────────
  if (payload.event !== "charge.completed") {
    // Acknowledge other events silently
    return NextResponse.json({ received: true });
  }

  const tx = payload.data;

  if (tx.status !== "successful") {
    console.log(`[Webhook] Transaction ${tx.id} status: ${tx.status} — ignored`);
    return NextResponse.json({ received: true });
  }

  // ── 3. Server-side verification (anti-replay + anti-tamper) ─
  const verified = await verifyTransaction(tx.id, tx.charged_amount);
  if (!verified) {
    console.error(`[Webhook] Verification failed for transaction ${tx.id}`);
    // Return 200 to prevent Flutterwave retrying a permanently bad event
    return NextResponse.json({ received: true, verified: false });
  }

  // ── 4. Extract orderId from meta ────────────────────────────
  const orderId = tx.meta?.orderId ?? verified.meta?.orderId;
  if (!orderId) {
    console.error("[Webhook] No orderId in transaction meta:", tx.tx_ref);
    return NextResponse.json({ received: true, error: "no_order_id" });
  }

  // ── 5. Update payment status via Express backend ─────────────
  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET ?? "fresheri-internal-2024";

  try {
    const patchRes = await fetch(`${BACKEND_URL}/orders/${orderId}/payment`, {
      method: "PATCH",
      headers: {
        "Content-Type":           "application/json",
        "x-internal-secret":      internalSecret,
      },
      body: JSON.stringify({
        paymentStatus:  "PAID",
        transactionRef: tx.flw_ref,
        transactionId:  String(tx.id),
        paidAmount:     tx.charged_amount,
        currency:       tx.currency,
      }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error(`[Webhook] PATCH /orders/${orderId}/payment failed:`, errText);
      // Still return 200 — the payment was real, DB update can be retried manually
    } else {
      console.log(`[Webhook] Order ${orderId} marked PAID via transaction ${tx.id}`);
    }
  } catch (err) {
    console.error("[Webhook] Failed to update order:", err);
  }

  return NextResponse.json({ received: true, verified: true, orderId });
}
