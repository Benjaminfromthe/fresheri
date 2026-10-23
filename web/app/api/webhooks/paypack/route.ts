// ─────────────────────────────────────────────────────────────
// POST /api/webhooks/paypack
//
// Receives payment events from Paypack.
// On successful CASHIN: updates order paymentStatus = PAID
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { verifyPaypackWebhook } from "@/lib/services/paypackService";

const BACKEND_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://fresheri-v6kz.vercel.app";

interface PaypackEvent {
  ref:    string;
  status: "successful" | "failed" | "pending";
  kind:   "CASHIN" | "CASHOUT";
  data?: {
    ref:    string;
    amount: number;
    client: string;
  };
}

export async function POST(req: NextRequest) {
  // Verify webhook authenticity
  const secret = req.headers.get("x-paypack-secret") ?? req.headers.get("authorization");
  if (!verifyPaypackWebhook(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: PaypackEvent;
  try { event = (await req.json()) as PaypackEvent; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Only process successful cashins
  if (event.kind !== "CASHIN" || event.status !== "successful") {
    return NextResponse.json({ received: true });
  }

  // The ref is the Paypack transaction ref.
  // We need to find the order that has this ref.
  // We stored the ref in the payment record via PATCH /orders/payment.
  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET ?? "fresheri-internal-2024";

  try {
    const patchRes = await fetch(`${BACKEND_URL}/orders/payment-by-ref`, {
      method: "PATCH",
      headers: {
        "Content-Type":      "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({
        paypackRef:    event.ref,
        paymentStatus: "PAID",
        paidAmount:    event.data?.amount ?? 0,
        currency:      "RWF",
      }),
    });

    if (!patchRes.ok) {
      console.error(`[Paypack Webhook] PATCH failed: ${await patchRes.text()}`);
    } else {
      console.log(`[Paypack Webhook] Order marked PAID for ref ${event.ref}`);
    }
  } catch (err) {
    console.error("[Paypack Webhook] Error:", err);
  }

  return NextResponse.json({ received: true });
}
