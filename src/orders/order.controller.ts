// ─────────────────────────────────────────────────────────────
// Order Controller
// Validates incoming HTTP requests and delegates to order.service
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { DeliveryOption, PaymentMethod } from "@prisma/client";
import {
  placeOrder,
  getOrderById,
  getBuyerOrders,
  InsufficientInventoryError,
  ListingNotFoundError,
  BuyerNotFoundError,
  InvalidDeliveryOptionError,
} from "./order.service";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Map domain errors to the correct HTTP status + message */
function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof InsufficientInventoryError) {
    res.status(409).json({
      error: "INSUFFICIENT_INVENTORY",
      message: err.message,
      available: err.available,
      requested: err.requested,
    });
    return;
  }
  if (err instanceof ListingNotFoundError) {
    res.status(404).json({ error: "LISTING_NOT_FOUND", message: err.message });
    return;
  }
  if (err instanceof BuyerNotFoundError) {
    res.status(404).json({ error: "BUYER_NOT_FOUND", message: err.message });
    return;
  }
  if (err instanceof InvalidDeliveryOptionError) {
    res.status(400).json({
      error: "INVALID_DELIVERY_OPTION",
      message: err.message,
    });
    return;
  }

  // Unexpected error — log and return generic 500
  console.error("[OrderController] Unhandled error:", err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "An unexpected error occurred." });
}

// ─────────────────────────────────────────────────────────────
// POST /orders  — place a new order
// ─────────────────────────────────────────────────────────────

/**
 * Expected JSON body:
 * {
 *   "buyerId":         "uuid",
 *   "listingId":       "uuid",
 *   "quantityKg":      500,
 *   "deliveryOption":  "SELF_PICKUP" | "DELIVERED",
 *   "deliveryAddress": "123 Main St, Kigali",   // required if DELIVERED
 *   "deliveryNotes":   "Call before arrival",    // optional
 *   "paymentMethod":   "MOBILE_MONEY",           // optional
 *   "deliveryFee":     500                        // optional, KES/RWF
 * }
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  const {
    buyerId,
    listingId,
    quantityKg,
    deliveryOption,
    deliveryAddress,
    deliveryNotes,
    paymentMethod,
    deliveryFee,
  } = req.body as {
    buyerId?: string;
    listingId?: string;
    quantityKg?: number;
    deliveryOption?: string;
    deliveryAddress?: string;
    deliveryNotes?: string;
    paymentMethod?: string;
    deliveryFee?: number;
  };

  // ── Input validation
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

  if (
    paymentMethod &&
    !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)
  ) {
    errors.push(
      `paymentMethod must be one of: ${Object.values(PaymentMethod).join(", ")}.`
    );
  }

  if (deliveryFee !== undefined && (typeof deliveryFee !== "number" || deliveryFee < 0)) {
    errors.push("deliveryFee must be a non-negative number.");
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "VALIDATION_ERROR", messages: errors });
    return;
  }

  try {
    const result = await placeOrder({
      buyerId: buyerId!,
      listingId: listingId!,
      quantityKg: quantityKg!,
      deliveryOption: deliveryOption as DeliveryOption,
      deliveryAddress,
      deliveryNotes,
      paymentMethod: paymentMethod as PaymentMethod | undefined,
      deliveryFeeOverride: deliveryFee,
    });

    res.status(201).json({
      message: "Order placed successfully.",
      data: result,
    });
  } catch (err) {
    handleServiceError(err, res);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /orders  — list all orders for a buyer
// ─────────────────────────────────────────────────────────────

/**
 * Query params:
 *   buyerId  — required
 *   page     — optional, default 1
 *   pageSize — optional, default 20 (max 100)
 */
export async function listOrders(req: Request, res: Response): Promise<void> {
  const { buyerId, page, pageSize } = req.query as {
    buyerId?: string;
    page?: string;
    pageSize?: string;
  };

  if (!buyerId?.trim()) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "buyerId query param is required." });
    return;
  }

  const parsedPage     = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize ?? "20", 10) || 20));

  try {
    const result = await getBuyerOrders(buyerId, parsedPage, parsedPageSize);
    res.status(200).json({ data: result.orders, pagination: result.pagination });
  } catch (err) {
    handleServiceError(err, res);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /orders/:id  — get a single order by ID
// ─────────────────────────────────────────────────────────────

/**
 * Route param : orderId
 * Query param : buyerId (ownership check — no auth middleware yet)
 */
export async function getOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { buyerId } = req.query as { buyerId?: string };

  if (!buyerId?.trim()) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "buyerId query param is required." });
    return;
  }

  try {
    const order = await getOrderById(id, buyerId);
    if (!order) {
      res.status(404).json({ error: "ORDER_NOT_FOUND", message: `Order ${id} not found.` });
      return;
    }
    res.status(200).json({ data: order });
  } catch (err) {
    handleServiceError(err, res);
  }
}
