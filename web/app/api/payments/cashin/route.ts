// ─────────────────────────────────────────────────────────────
// POST /api/payments/cashin
//
// Called by PaymentStep after the user types their phone.
// Triggers a Paypack cashin (MoMo push) to the buyer's phone.
// Returns { ref } for the client to poll /api/payments/status.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { initiateCashin, normalisePhone } from "@/lib/services/paypackService";

interface CashinRequest {
  orderId:    string;
  phone:      string;
  amount:     number;
  buyerToken: string;
}

export async function POST(req: NextRequest) {
  let body: CashinRequest;
  try { body = (await req.json()) as CashinRequest; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { phone, amount } = body;

  if (!phone || !amount) {
    return NextResponse.json({ error: "phone and amount are required" }, { status: 400 });
  }

  const normalisedPhone = normalisePhone(phone);

  // Validate Rwanda phone: must be 10 digits starting with 07 or 073 (Airtel)
  if (!/^0[7][0-9]{8}$/.test(normalisedPhone)) {
    return NextResponse.json(
      { error: `Invalid Rwanda phone number: ${normalisedPhone}. Use format 07XXXXXXXX` },
      { status: 400 }
    );
  }

  try {
    const cashin = await initiateCashin(normalisedPhone, amount);
    return NextResponse.json({ ref: cashin.ref, phone: normalisedPhone, amount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Payment initiation failed";
    console.error("[Cashin] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
