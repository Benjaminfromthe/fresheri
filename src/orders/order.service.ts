// ─────────────────────────────────────────────────────────────
// Order Processing Service
// Atomic inventory reservation + order creation via Prisma
// ─────────────────────────────────────────────────────────────

import { Decimal } from "@prisma/client/runtime/library";
import {
  DeliveryOption,
  ListingStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import prisma from "../lib/prisma";
import { notifyBuyer, notifyFarmer } from "../lib/sms";

// ─────────────────────────────────────────────────────────────
// Input / Output types
// ─────────────────────────────────────────────────────────────

export interface PlaceOrderInput {
  buyerId: string;
  listingId: string;
  /** Requested quantity in kg */
  quantityKg: number;
  deliveryOption: DeliveryOption;
  /** Required when deliveryOption = DELIVERED */
  deliveryAddress?: string;
  deliveryNotes?: string;
  paymentMethod?: PaymentMethod;
  /**
   * Flat delivery fee in the listing's currency.
   * Passed in by the caller (e.g. calculated by a logistics quote service).
   * Defaults to 0 for SELF_PICKUP.
   */
  deliveryFeeOverride?: number;
}

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  listingStatus: ListingStatus;
  availableQuantityAfter: number;
}

// ─────────────────────────────────────────────────────────────
// Custom errors — callers can instanceof-check these
// ─────────────────────────────────────────────────────────────

export class InsufficientInventoryError extends Error {
  constructor(
    public readonly available: number,
    public readonly requested: number
  ) {
    super(
      `Insufficient inventory: ${available}kg available, ${requested}kg requested.`
    );
    this.name = "InsufficientInventoryError";
  }
}

export class ListingNotFoundError extends Error {
  constructor(listingId: string) {
    super(`Listing ${listingId} not found or is not available for purchase.`);
    this.name = "ListingNotFoundError";
  }
}

export class BuyerNotFoundError extends Error {
  constructor(buyerId: string) {
    super(`Buyer ${buyerId} not found.`);
    this.name = "BuyerNotFoundError";
  }
}

export class InvalidDeliveryOptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDeliveryOptionError";
  }
}

// ─────────────────────────────────────────────────────────────
// Helper — convert Prisma Decimal to JS number safely
// ─────────────────────────────────────────────────────────────

function toNumber(d: Decimal): number {
  return d.toNumber();
}

// ─────────────────────────────────────────────────────────────
// Core service function
// ─────────────────────────────────────────────────────────────

/**
 * Places a buyer order against a pooled farmer inventory listing.
 *
 * Guarantees (all-or-nothing via Prisma $transaction):
 *   1. Re-reads listing inside the transaction with a FOR UPDATE row lock
 *      to prevent double-selling under concurrent requests.
 *   2. Validates requested quantity <= available_quantity.
 *   3. Decrements available_quantity atomically.
 *   4. Sets listing status to SOLD_OUT when available_quantity reaches 0,
 *      or PARTIALLY_SOLD when some stock remains.
 *   5. Creates Order + OrderItem records with price snapshot.
 *
 * SMS notifications fire AFTER the transaction commits so a
 * notification failure can never roll back a completed order.
 */
export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const {
    buyerId,
    listingId,
    quantityKg,
    deliveryOption,
    deliveryAddress,
    deliveryNotes,
    paymentMethod,
    deliveryFeeOverride,
  } = input;

  // ── Pre-flight: validate delivery address requirement
  if (deliveryOption === DeliveryOption.DELIVERED && !deliveryAddress?.trim()) {
    throw new InvalidDeliveryOptionError(
      "deliveryAddress is required when deliveryOption is DELIVERED."
    );
  }

  // ── Pre-flight: fetch buyer (outside transaction — read-only check)
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { id: true, phone: true, firstName: true, lastName: true },
  });
  if (!buyer) throw new BuyerNotFoundError(buyerId);

  // ─────────────────────────────────────────────────────────
  // ATOMIC TRANSACTION
  // All inventory and order mutations happen in one transaction.
  // Prisma uses READ COMMITTED by default; we use a raw SELECT
  // FOR UPDATE to lock the listing row for the duration.
  // ─────────────────────────────────────────────────────────
  const result = await prisma.$transaction(async (tx) => {

    // 1. Lock & re-read the listing row to prevent race conditions
    //    under concurrent order placement for the same listing.
    const listings = await tx.$queryRaw<
      Array<{
        id: string;
        seller_id: string;
        produce_name: string;
        variety: string | null;
        available_quantity: string; // Prisma returns Decimal as string in raw queries
        total_quantity: string;
        unit_price: string;
        unit: string;
        farm_location: string;
        status: string;
        currency: string;
        delivery_options: DeliveryOption[];
      }>
    >`
      SELECT
        id,
        seller_id,
        produce_name,
        variety,
        available_quantity,
        total_quantity,
        unit_price,
        unit,
        farm_location,
        status,
        currency,
        delivery_options
      FROM "ProduceListing"
      WHERE id = ${listingId}
        AND status IN ('ACTIVE', 'PARTIALLY_SOLD')
      FOR UPDATE
    `;

    if (listings.length === 0) {
      throw new ListingNotFoundError(listingId);
    }

    const listing = listings[0];
    const availableQty = parseFloat(listing.available_quantity);
    const unitPrice = parseFloat(listing.unit_price);
    const currency = listing.currency;

    // 2. Quantity check
    if (quantityKg > availableQty) {
      throw new InsufficientInventoryError(availableQty, quantityKg);
    }

    // 3. Validate that listing supports the requested delivery option
    if (!listing.delivery_options.includes(deliveryOption)) {
      throw new InvalidDeliveryOptionError(
        `Listing does not support delivery option: ${deliveryOption}. ` +
        `Available: ${listing.delivery_options.join(", ")}.`
      );
    }

    // 4. Calculate financials
    const subtotalAmount = parseFloat((quantityKg * unitPrice).toFixed(2));
    const deliveryFee = parseFloat(
      (
        deliveryOption === DeliveryOption.DELIVERED
          ? (deliveryFeeOverride ?? 0)
          : 0
      ).toFixed(2)
    );
    const totalAmount = parseFloat((subtotalAmount + deliveryFee).toFixed(2));

    // 5. Compute new available quantity and next listing status
    const newAvailableQty = parseFloat(
      (availableQty - quantityKg).toFixed(3)
    );
    const newListingStatus: ListingStatus =
      newAvailableQty <= 0
        ? ListingStatus.SOLD_OUT
        : ListingStatus.PARTIALLY_SOLD;

    // 6. Decrement available_quantity + update listing status
    await tx.produceListing.update({
      where: { id: listingId },
      data: {
        availableQuantity: newAvailableQty,
        status: newListingStatus,
      },
    });

    // 7. Create the Order record
    const order = await tx.order.create({
      data: {
        buyerId,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: paymentMethod ?? null,
        subtotalAmount,
        deliveryFee,
        discountAmount: 0,
        totalAmount,
        currency,
        deliveryOption,
        deliveryAddress: deliveryAddress ?? null,
        deliveryNotes: deliveryNotes ?? null,
        confirmedAt: new Date(),
      },
    });

    // 8. Create the OrderItem — snapshot listing details at purchase time
    await tx.orderItem.create({
      data: {
        orderId: order.id,
        listingId,
        produceName: listing.produce_name,
        variety: listing.variety ?? null,
        unit: listing.unit as "KG" | "TON",
        quantityOrdered: quantityKg,
        unitPriceAtOrder: unitPrice,
        lineTotal: subtotalAmount,
        quantityDelivered: 0,
        isFulfilled: false,
        farmLocation: listing.farm_location,
      },
    });

    return {
      order,
      listing,
      newAvailableQty,
      newListingStatus,
      subtotalAmount,
      deliveryFee,
      totalAmount,
      currency,
    };
  }); // ── END $transaction

  // ─────────────────────────────────────────────────────────
  // POST-TRANSACTION: SMS Notifications
  // These run AFTER commit — a send failure does not affect
  // the order that has already been persisted.
  // ─────────────────────────────────────────────────────────

  // Fetch seller phone number for notification
  const seller = await prisma.user.findUnique({
    where: { id: result.listing.seller_id },
    select: { phone: true },
  });

  // Fire both notifications concurrently — don't await failures
  await Promise.allSettled([
    notifyBuyer(
      buyer.phone,
      result.order.orderNumber,
      result.listing.produce_name,
      quantityKg,
      result.totalAmount,
      result.currency
    ),
    seller
      ? notifyFarmer(
          seller.phone,
          result.order.orderNumber,
          result.listing.produce_name,
          quantityKg,
          result.subtotalAmount, // farmer receives subtotal (excl. delivery fee)
          result.currency,
          result.newListingStatus === ListingStatus.SOLD_OUT
        )
      : Promise.resolve(),
  ]);

  // ── Return summary to the controller
  return {
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    subtotalAmount: result.subtotalAmount,
    deliveryFee: result.deliveryFee,
    totalAmount: result.totalAmount,
    currency: result.currency,
    listingStatus: result.newListingStatus,
    availableQuantityAfter: result.newAvailableQty,
  };
}

// ─────────────────────────────────────────────────────────────
// Fetch a single order with all its items (for GET /orders/:id)
// ─────────────────────────────────────────────────────────────

export async function getOrderById(orderId: string, buyerId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId },
    include: {
      orderItems: true,
      payments: true,
      delivery: true,
    },
  });
  return order; // null if not found or doesn't belong to buyer
}

// ─────────────────────────────────────────────────────────────
// List all orders for a buyer (for GET /orders)
// ─────────────────────────────────────────────────────────────

export async function getBuyerOrders(
  buyerId: string,
  page = 1,
  pageSize = 20
) {
  const skip = (page - 1) * pageSize;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId },
      include: { orderItems: true },
      orderBy: { placedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where: { buyerId } }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
