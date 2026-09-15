// ─────────────────────────────────────────────────────────────
// Order Controller — HTTP Layer Only
//
// Architecture compliance:
//   ✅ No business logic — delegates to order.service
//   ✅ No direct DB calls — db injected via app bootstrap
//   ✅ Error codes from src/constants/errors.ts
//   ✅ Single handleServiceError for all domain errors
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { PrismaClient, DeliveryOption, PaymentMethod } from "@prisma/client";
import { placeOrder, getOrderById, getBuyerOrders } from "./order.service";
import { getPickupContactForBuyer } from "../deliveries/dispatch.service";
import { handleServiceError } from "../lib/handle-error";
import { ErrorCode } from "../constants/errors";
import { SmsService } from "../lib/sms";

// ─────────────────────────────────────────────────────────────
// Controller factory — receives injected dependencies
// ─────────────────────────────────────────────────────────────

export function createOrderController(db: PrismaClient, sms: SmsService) {

  // ── POST /orders ────────────────────────────────────────────
  async function createOrder(req: Request, res: Response): Promise<void> {
    const {
      buyerId, listingId, quantityKg,
      deliveryOption, deliveryAddress, deliveryNotes,
      paymentMethod, deliveryFee,
    } = req.body as {
      buyerId?: string; listingId?: string; quantityKg?: number;
      deliveryOption?: string; deliveryAddress?: string;
      deliveryNotes?: string; paymentMethod?: string; deliveryFee?: number;
    };

    const errors: string[] = [];
    if (!buyerId?.trim())   errors.push("buyerId is required.");
    if (!listingId?.trim()) errors.push("listingId is required.");

    if (quantityKg === undefined || quantityKg === null) {
      errors.push("quantityKg is required.");
    } else if (typeof quantityKg !== "number" || quantityKg <= 0 || !isFinite(quantityKg)) {
      errors.push("quantityKg must be a positive number.");
    }

    const validDeliveryOptions = Object.values(DeliveryOption) as string[];
    if (!deliveryOption) {
      errors.push("deliveryOption is required.");
    } else if (!validDeliveryOptions.includes(deliveryOption)) {
      errors.push(`deliveryOption must be one of: ${validDeliveryOptions.join(", ")}.`);
    }

    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      errors.push(`paymentMethod must be one of: ${Object.values(PaymentMethod).join(", ")}.`);
    }

    if (deliveryFee !== undefined && (typeof deliveryFee !== "number" || deliveryFee < 0)) {
      errors.push("deliveryFee must be a non-negative number.");
    }

    if (errors.length > 0) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, messages: errors });
      return;
    }

    try {
      const result = await placeOrder(
        {
          buyerId: buyerId!,
          listingId: listingId!,
          quantityKg: quantityKg!,
          deliveryOption: deliveryOption as DeliveryOption,
          deliveryAddress,
          deliveryNotes,
          paymentMethod: paymentMethod as PaymentMethod | undefined,
          deliveryFeeOverride: deliveryFee,
        },
        db,
        sms
      );
      res.status(201).json({ message: "Order placed successfully.", data: result });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  // ── GET /orders ─────────────────────────────────────────────
  async function listOrders(req: Request, res: Response): Promise<void> {
    const { buyerId, page, pageSize } = req.query as Record<string, string | undefined>;

    if (!buyerId?.trim()) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, message: "buyerId query param is required." });
      return;
    }

    try {
      const result = await getBuyerOrders(
        buyerId,
        db,
        page     ? Math.max(1, parseInt(page, 10))     : 1,
        pageSize ? Math.min(100, parseInt(pageSize, 10)) : 20,
      );
      res.status(200).json({ data: result.orders, pagination: result.pagination });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  // ── GET /orders/:id ─────────────────────────────────────────
  async function getOrder(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { buyerId } = req.query as { buyerId?: string };

    if (!buyerId?.trim()) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, message: "buyerId query param is required." });
      return;
    }

    try {
      const order = await getOrderById(id, buyerId, db);
      if (!order) {
        res.status(404).json({ error: ErrorCode.ORDER_NOT_FOUND, message: `Order ${id} not found.` });
        return;
      }
      res.status(200).json({ data: order });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  // ── GET /orders/:id/pickup-contact ──────────────────────────
  async function getPickupContact(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const buyerId = req.caller?.userId;

    if (!buyerId) {
      res.status(401).json({ error: ErrorCode.UNAUTHENTICATED, message: "Authentication required." });
      return;
    }

    try {
      const disclosure = await getPickupContactForBuyer(id, buyerId, db);
      if (!disclosure) {
        res.status(403).json({
          error:   ErrorCode.CONTACT_NOT_AVAILABLE,
          message: "Pickup contact is only available for your confirmed SELF_PICKUP orders.",
        });
        return;
      }
      res.status(200).json({ data: disclosure });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  return { createOrder, listOrders, getOrder, getPickupContact };
}
