// ─────────────────────────────────────────────────────────────
// POST /api/payments/initiate
//
// Flow:
//   1. Place the order(s) on the Express backend
//   2. Trigger a Paypack cashin (MoMo push) to the buyer's phone
//   3. Return { ref, orderId, amount } to the client for polling
//
// The customer receives a MoMo push notification — they just
// approve it on their phone. No redirect, no OTP screen.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { initiateCashin, normalisePhone } from "@/lib/services/paypackService";
import { BASE_DELIVERY_FEE } from "@/lib/constants";

const BACKEND_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://fresheri-v6kz.vercel.app";

interface CartLineItem {
  listingId:   string;
  quantityKg:  number;
  unitPrice:   number;
  fulfillment: "SELF_PICKUP" | "DELIVERED";
}

interface InitiateRequest {
  buyerId:          string;
  buyerToken:       string;
  buyerPhone:       string;   // real phone for MoMo push
  cart:             CartLineItem[];
  deliveryOption:   "SELF_PICKUP" | "DELIVERED";
  deliveryAddress?: string;
  currency:         string;
}

interface ExpressOrderResult {
  orderId:      string;
  orderNumber:  string;
  totalAmount:  number;
  currency:     string;
  pickupCode?:  string | null;
  pickupContact?: unknown;
}

export async function POST(req: NextRequest) {
  let body: InitiateRequest;
  try { body = (await req.json()) as InitiateRequest; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { buyerId, buyerToken, buyerPhone, cart, deliveryOption, deliveryAddress, currency } = body;

  if (!buyerId || !cart?.length || !deliveryOption || !buyerPhone) {
    return NextResponse.json(
      { error: "buyerId, buyerPhone, cart, and deliveryOption are required" },
      { status: 400 }
    );
  }

  // ── 1. Place all orders sequentially on Express backend ─────
  const orderResults: ExpressOrderResult[] = [];
  for (const item of cart) {
    const res = await fetch(`${BACKEND_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        buyerId,
        listingId:       item.listingId,
        quantityKg:      item.quantityKg,
        deliveryOption,
        deliveryAddress: deliveryAddress ?? undefined,
        deliveryFee:     deliveryOption === "DELIVERED" ? BASE_DELIVERY_FEE : 0,
      }),
    });

    if (!res.ok) {
      let message = `Order failed (HTTP ${res.status})`;
      try { message = ((await res.json()) as { message?: string }).message ?? message; } catch { /* */ }
      return NextResponse.json({ error: message }, { status: res.status });
    }
    const json = (await res.json()) as { data: ExpressOrderResult };
    orderResults.push(json.data);
  }

  const grandTotal    = orderResults.reduce((s, o) => s + o.totalAmount, 0);
  const primaryOrder  = orderResults[0];

  // ── 2. Trigger Paypack cashin (MoMo push to buyer's phone) ──
  try {
    const cashin = await initiateCashin(buyerPhone, grandTotal);

    // Store the paypack ref on the order so the webhook can match it
    // We pass it back to the client for polling
    return NextResponse.json({
      ref:          cashin.ref,          // Paypack transaction ref — used for polling
      orderId:      primaryOrder.orderId,
      allOrderIds:  orderResults.map((o) => o.orderId),
      orderNumber:  primaryOrder.orderNumber,
      amount:       grandTotal,
      currency:     currency ?? "RWF",
      phone:        normalisePhone(buyerPhone),
      pickupCode:   primaryOrder.pickupCode ?? null,
      orderResults,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Payment initiation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
