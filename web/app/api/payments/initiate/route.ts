// ─────────────────────────────────────────────────────────────
// POST /api/payments/initiate
//
// Flow:
//   1. Receive cart items + fulfillment choice from CheckoutModal
//   2. Call the Express backend to place the order (creates DB record)
//   3. Generate a Flutterwave txRef tied to the orderId
//   4. Return { txRef, orderId, orderNumber, amount, currency }
//      so the browser can open the FLW popup without another round-trip
//
// The order is created with paymentStatus = UNPAID.
// On successful payment, the webhook route flips it to PAID.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { generateTxRef } from "@/lib/services/paymentService";
import { BASE_DELIVERY_FEE } from "@/lib/constants";

// Server-side: prefer non-public env var, fall back to NEXT_PUBLIC_ then hardcoded
const BACKEND_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://fresheri-v6kz.vercel.app";

interface CartLineItem {
  listingId:    string;
  quantityKg:   number;
  unitPrice:    number;
  fulfillment:  "SELF_PICKUP" | "DELIVERED";
}

interface InitiatePaymentRequest {
  buyerId:         string;
  buyerToken:      string;          // JWT — forwarded to Express for auth
  cart:            CartLineItem[];
  deliveryOption:  "SELF_PICKUP" | "DELIVERED";
  deliveryAddress?: string;
  currency:        string;          // "RWF"
}

interface ExpressOrderResult {
  orderId:        string;
  orderNumber:    string;
  totalAmount:    number;
  currency:       string;
  pickupCode?:    string | null;
  pickupContact?: unknown;
}

export async function POST(req: NextRequest) {
  let body: InitiatePaymentRequest;
  try {
    body = (await req.json()) as InitiatePaymentRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { buyerId, buyerToken, cart, deliveryOption, deliveryAddress, currency } = body;

  if (!buyerId || !cart?.length || !deliveryOption) {
    return NextResponse.json(
      { error: "buyerId, cart, and deliveryOption are required" },
      { status: 400 }
    );
  }

  // ── 1. Place all orders against the Express backend ─────────
  // We place them sequentially so a stock failure on item #2
  // doesn't leave item #1 in a paid-but-not-ordered limbo.
  const orderResults: ExpressOrderResult[] = [];

  for (const item of cart) {
    const payload = {
      buyerId,
      listingId:       item.listingId,
      quantityKg:      item.quantityKg,
      deliveryOption,
      deliveryAddress: deliveryAddress ?? undefined,
      deliveryFee:     deliveryOption === "DELIVERED" ? BASE_DELIVERY_FEE : 0,
    };

    const res = await fetch(`${BACKEND_URL}/orders`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${buyerToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let message = `Order placement failed (HTTP ${res.status})`;
      try {
        const errBody = (await res.json()) as { message?: string };
        message = errBody.message ?? message;
      } catch { /* non-JSON */ }
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const json = (await res.json()) as { data: ExpressOrderResult };
    orderResults.push(json.data);
  }

  // ── 2. Aggregate total across all order lines ────────────────
  const grandTotal = orderResults.reduce((sum, o) => sum + o.totalAmount, 0);

  // Use the first order's ID as the primary reference.
  // For multi-item carts all orders are created; the txRef carries orderId[0].
  const primaryOrder   = orderResults[0];
  const allOrderIds    = orderResults.map((o) => o.orderId);
  const txRef          = generateTxRef(primaryOrder.orderId);

  return NextResponse.json({
    txRef,
    orderId:      primaryOrder.orderId,
    allOrderIds,
    orderNumber:  primaryOrder.orderNumber,
    amount:       grandTotal,
    currency:     currency ?? "RWF",
    pickupCode:   primaryOrder.pickupCode ?? null,
    pickupContact: primaryOrder.pickupContact ?? null,
    // Return the public key from the server so the client doesn't need the
    // NEXT_PUBLIC_ env var to be set on every deployment
    publicKey:    process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY ??
                  process.env.FLW_PUBLIC_KEY ??
                  "",
    // Return all results so CheckoutModal can display them on success
    orderResults,
  });
}
