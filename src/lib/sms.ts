// ─────────────────────────────────────────────────────────────
// SMS Service — Injectable Interface + Singleton Adapter
//
// Architecture:
//   SmsService interface defines the contract.
//   AtSmsService implements it using Africa's Talking.
//   createSmsService() is the factory injected into services.
//   The singleton `defaultSmsService` is used in api/index.ts
//   bootstrap only — never imported directly in business logic.
// ─────────────────────────────────────────────────────────────

import { SMS_MAX_BODY_LENGTH } from "../constants/config";

// ── Public interface (injectable contract) ───────────────────

export interface SmsService {
  send(to: string[], message: string): Promise<SmsResponse | null>;
  notifyBuyer(params: BuyerNotificationParams): Promise<void>;
  notifyFarmer(params: FarmerNotificationParams): Promise<void>;
}

export interface SmsResult {
  messageId: string;
  status: string;
  number: string;
  cost: string;
}

export interface SmsResponse {
  SMSMessageData: {
    Message: string;
    Recipients: SmsResult[];
  };
}

export interface BuyerNotificationParams {
  phone: string;
  orderNumber: string;
  produceName: string;
  quantityKg: number;
  totalAmount: number;
  currency: string;
}

export interface FarmerNotificationParams {
  phone: string;
  orderNumber: string;
  produceName: string;
  quantityKg: number;
  totalAmount: number;
  currency: string;
  isSoldOut: boolean;
}

// ── Africa's Talking implementation ──────────────────────────

class AtSmsService implements SmsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  private getClient() {
    if (this.client) return this.client;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AfricasTalking = require("africastalking");
    const at = AfricasTalking({
      apiKey:   process.env.AT_API_KEY  ?? "",
      username: process.env.AT_USERNAME ?? "sandbox",
    });
    this.client = at.SMS;
    return this.client;
  }

  async send(to: string[], message: string): Promise<SmsResponse | null> {
    const body = message.slice(0, SMS_MAX_BODY_LENGTH);
    try {
      const response: SmsResponse = await this.getClient().send({
        to,
        message: body,
        enqueue: true,
      });

      const failed = (response.SMSMessageData?.Recipients ?? []).filter(
        (r: SmsResult) => r.status !== "Success"
      );
      if (failed.length > 0) {
        console.warn("[SMS] Failed recipients:", failed.map((r: SmsResult) => `${r.number} → ${r.status}`));
      }

      return response;
    } catch (err) {
      // SMS failure must NEVER roll back an order
      console.error("[SMS] Send error:", err);
      return null;
    }
  }

  async notifyBuyer(p: BuyerNotificationParams): Promise<void> {
    const message =
      `Fresheri: Order ${p.orderNumber} confirmed!\n` +
      `${p.quantityKg}kg of ${p.produceName} @ ${p.currency} ${p.totalAmount.toFixed(2)}.\n` +
      `We will update you on delivery. Thank you.`;
    await this.send([p.phone], message);
  }

  async notifyFarmer(p: FarmerNotificationParams): Promise<void> {
    const soldOut = p.isSoldOut ? "\nYour listing is now SOLD OUT." : "";
    const message =
      `Fresheri: New order ${p.orderNumber}!\n` +
      `A buyer purchased ${p.quantityKg}kg of ${p.produceName}.\n` +
      `You will receive ${p.currency} ${p.totalAmount.toFixed(2)}.` +
      soldOut;
    await this.send([p.phone], message);
  }
}

// ── Factory — used in DI wiring (api/index.ts bootstrap) ─────

export function createSmsService(): SmsService {
  return new AtSmsService();
}

// ── Singleton adapter — ONLY imported in api/index.ts ────────

export const defaultSmsService: SmsService = createSmsService();
