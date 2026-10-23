// ─────────────────────────────────────────────────────────────
// GET /api/payments/status?ref=…
// Polls Paypack for the current status of a cashin transaction.
// The CheckoutModal polls this every 3 seconds after initiating.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus } from "@/lib/services/paypackService";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "ref is required" }, { status: 400 });

  try {
    const status = await getTransactionStatus(ref);
    return NextResponse.json({ status: status.status, ref, amount: status.amount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
