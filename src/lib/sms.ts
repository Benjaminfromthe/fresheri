// ─────────────────────────────────────────────────────────────
// Africa's Talking SMS client wrapper
// Typed, singleton, lazy-initialised for serverless safety
// ─────────────────────────────────────────────────────────────

export interface SMSResult {
  messageId: string;
  status: string;
  number: string;
  cost: string;
}

export interface SMSResponse {
  SMSMessageData: {
    Message: string;
    Recipients: SMSResult[];
  };
}

// Lazy singleton — initialised on first use so env vars are
// guaranteed to be present (safe for both local and Vercel)
let _smsClient: ReturnType<ReturnType<typeof require>["SMS"]> | null = null;

function getSmsClient() {
  if (_smsClient) return _smsClient;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AfricasTalking = require("africastalking");
  const at = AfricasTalking({
    apiKey:   process.env.AT_API_KEY   ?? "",
    username: process.env.AT_USERNAME  ?? "sandbox",
  });
  _smsClient = at.SMS;
  return _smsClient;
}

/**
 * Send an SMS to one or more phone numbers.
 *
 * @param to     - Array of E.164 numbers, e.g. ["+254712345678"]
 * @param message - Plain-text message body (160 chars per SMS segment)
 * @returns      Resolved AT response or null if the send fails (non-throwing)
 */
export async function sendSMS(
  to: string[],
  message: string
): Promise<SMSResponse | null> {
  const body = message.slice(0, 459);

  try {
    const smsClient = getSmsClient();
    const response: SMSResponse = await smsClient.send({
      to,
      message: body,
      enqueue: true,
    });

    const recipients = response.SMSMessageData?.Recipients ?? [];
    const failed = recipients.filter((r) => r.status !== "Success");

    if (failed.length > 0) {
      console.warn(
        "[SMS] Some recipients failed:",
        failed.map((r) => `${r.number} → ${r.status}`)
      );
    }

    return response;
  } catch (err) {
    // SMS failure must NEVER roll back an order — log and continue
    console.error("[SMS] Send error:", err);
    return null;
  }
}

/**
 * Notify a buyer that their order was placed successfully.
 */
export async function notifyBuyer(
  phone: string,
  orderNumber: string,
  produceName: string,
  quantityKg: number,
  totalAmount: number,
  currency: string
): Promise<void> {
  const message =
    `Fresheri: Order ${orderNumber} confirmed!\n` +
    `${quantityKg}kg of ${produceName} @ ${currency} ${totalAmount.toFixed(2)}.\n` +
    `We will update you on delivery. Thank you.`;

  await sendSMS([phone], message);
}

/**
 * Notify a farmer that a buyer has purchased from their listing.
 */
export async function notifyFarmer(
  phone: string,
  orderNumber: string,
  produceName: string,
  quantityKg: number,
  totalAmount: number,
  currency: string,
  isSoldOut: boolean
): Promise<void> {
  const soldOutNote = isSoldOut
    ? "\nYour listing is now SOLD OUT."
    : "";

  const message =
    `Fresheri: New order ${orderNumber}!\n` +
    `A buyer purchased ${quantityKg}kg of ${produceName}.\n` +
    `You will receive ${currency} ${totalAmount.toFixed(2)}.` +
    soldOutNote;

  await sendSMS([phone], message);
}
