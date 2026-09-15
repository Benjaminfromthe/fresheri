// ─────────────────────────────────────────────────────────────
// Order Service — Business Logic Layer
//
// Architecture compliance:
//   ✅ Receives PrismaClient + SmsService as injected dependencies
//   ✅ All Prisma queries use explicit `select` blocks
//   ✅ Domain errors from src/constants/errors.ts
//   ✅ Config values from src/constants/config.ts
//   ✅ Atomic $transaction with SELECT FOR UPDATE row lock
//   ✅ SMS fires post-commit via Promise.allSettled
// ─────────────────────────────────────────────────────────────

import { PrismaClient, DeliveryOption, ListingStatus, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import {
  BuyerNotFoundError,
  InsufficientInventoryError,
  InvalidDeliveryOptionError,
  ListingNotFoundError,
  OrderNotFoundError,
} from "../constants/errors";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/config";
import { SmsService } from "../lib/sms";
import { createDeliveryDispatch, getPickupContactForBuyer } from "../deliveries/dispatch.service";

// ── Input / Output types ─────────────────────────────────────

export interface PlaceOrderInput {
  buyerId: string;
  listingId: string;
  quantityKg: number;
  deliveryOption: DeliveryOption;
  deliveryAddress?: string;
  deliveryNotes?: string;
  paymentMethod?: PaymentMethod;
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
  fulfillment: DeliveryOption;
  pickupContact: {
    pickupLocation: string;
    farmerContact: string;
    farmerName: string;
    note: string;
  } | null;
}

// ── Explicit select for buyer-facing order rows ───────────────

const ORDER_ITEM_SELECT = {
  id:               true,
  produceName:      true,
  variety:          true,
  unit:             true,
  quantityOrdered:  true,
  unitPriceAtOrder: true,
  lineTotal:        true,
  quantityDelivered:true,
  isFulfilled:      true,
  farmLocation:     true,
  sellerNotes:      true,
  createdAt:        true,
  updatedAt:        true,
} as const;

const ORDER_SELECT = {
  id:              true,
  orderNumber:     true,
  buyerId:         true,
  status:          true,
  paymentStatus:   true,
  paymentMethod:   true,
  subtotalAmount:  true,
  deliveryFee:     true,
  discountAmount:  true,
  totalAmount:     true,
  currency:        true,
  deliveryOption:  true,
  deliveryAddress: true,
  deliveryNotes:   true,
  placedAt:        true,
  confirmedAt:     true,
  deliveredAt:     true,
  cancelledAt:     true,
  updatedAt:       true,
} as const;

// ─────────────────────────────────────────────────────────────
// placeOrder
// ─────────────────────────────────────────────────────────────

export async function placeOrder(
  input: PlaceOrderInput,
  db: PrismaClient,
  sms: SmsService
): Promise<PlaceOrderResult> {
  const { buyerId, listingId, quantityKg, deliveryOption,
    deliveryAddress, deliveryNotes, paymentMethod, deliveryFeeOverride } = input;

  if (deliveryOption === DeliveryOption.DELIVERED && !deliveryAddress?.trim()) {
    throw new InvalidDeliveryOptionError(
      "deliveryAddress is required when deliveryOption is DELIVERED."
    );
  }

  // Pre-flight buyer check (outside transaction — read-only)
  const buyer = await db.user.findUnique({
    where: { id: buyerId },
    select: { id: true, phone: true, firstName: true },
  });
  if (!buyer) throw new BuyerNotFoundError(buyerId);

  // ── ATOMIC TRANSACTION ───────────────────────────────────
  const result = await db.$transaction(async (tx) => {
    // SELECT FOR UPDATE — row lock to prevent double-selling
    const listings = await tx.$queryRaw<Array<{
      id: string;
      seller_id: string;
      produce_name: string;
      variety: string | null;
      available_quantity: string;
      unit_price: string;
      unit: string;
      farm_location: string;
      status: string;
      currency: string;
      delivery_options: DeliveryOption[];
    }>>`
      SELECT id, seller_id, produce_name, variety,
             available_quantity, unit_price, unit,
             farm_location, status, currency, delivery_options
      FROM "ProduceListing"
      WHERE id = ${listingId}
        AND status IN ('ACTIVE', 'PARTIALLY_SOLD')
      FOR UPDATE
    `;

    if (listings.length === 0) throw new ListingNotFoundError(listingId);

    const listing      = listings[0];
    const availableQty = parseFloat(listing.available_quantity);
    const unitPrice    = parseFloat(listing.unit_price);
    const currency     = listing.currency;

    if (quantityKg > availableQty) {
      throw new InsufficientInventoryError(availableQty, quantityKg);
    }

    if (!listing.delivery_options.includes(deliveryOption)) {
      throw new InvalidDeliveryOptionError(
        `Listing does not support ${deliveryOption}. Available: ${listing.delivery_options.join(", ")}.`
      );
    }

    const subtotalAmount = parseFloat((quantityKg * unitPrice).toFixed(2));
    const deliveryFee    = parseFloat(
      (deliveryOption === DeliveryOption.DELIVERED ? (deliveryFeeOverride ?? 0) : 0).toFixed(2)
    );
    const totalAmount    = parseFloat((subtotalAmount + deliveryFee).toFixed(2));
    const newAvailableQty = parseFloat((availableQty - quantityKg).toFixed(3));
    const newListingStatus = newAvailableQty <= 0
      ? ListingStatus.SOLD_OUT
      : ListingStatus.PARTIALLY_SOLD;

    await tx.produceListing.update({
      where: { id: listingId },
      data:  { availableQuantity: newAvailableQty, status: newListingStatus },
      select: { id: true }, // minimal select — we only need confirmation
    });

    const order = await tx.order.create({
      data: {
        buyerId,
        status:         OrderStatus.CONFIRMED,
        paymentStatus:  PaymentStatus.UNPAID,
        paymentMethod:  paymentMethod ?? null,
        subtotalAmount,
        deliveryFee,
        discountAmount: 0,
        totalAmount,
        currency,
        deliveryOption,
        deliveryAddress:  deliveryAddress ?? null,
        deliveryNotes:    deliveryNotes ?? null,
        confirmedAt:      new Date(),
      },
      select: { id: true, orderNumber: true },
    });

    await tx.orderItem.create({
      data: {
        orderId:           order.id,
        listingId,
        produceName:       listing.produce_name,
        variety:           listing.variety ?? null,
        unit:              listing.unit as "KG" | "TON",
        quantityOrdered:   quantityKg,
        unitPriceAtOrder:  unitPrice,
        lineTotal:         subtotalAmount,
        quantityDelivered: 0,
        isFulfilled:       false,
        farmLocation:      listing.farm_location,
      },
      select: { id: true },
    });

    return { order, listing, newAvailableQty, newListingStatus,
             subtotalAmount, deliveryFee, totalAmount, currency };
  });

  // ── POST-TRANSACTION: dispatch + contact disclosure ───────

  let pickupContact: PlaceOrderResult["pickupContact"] = null;

  if (deliveryOption === DeliveryOption.DELIVERED) {
    createDeliveryDispatch(result.order.id, db).catch((err) =>
      console.error("[Dispatch] Failed to create delivery task:", err)
    );
  }

  if (deliveryOption === DeliveryOption.SELF_PICKUP) {
    const disclosure = await getPickupContactForBuyer(result.order.id, buyerId, db);
    if (disclosure) {
      pickupContact = {
        pickupLocation: disclosure.pickupLocation,
        farmerContact:  disclosure.farmerContact,
        farmerName:     disclosure.farmerName,
        note:           disclosure.note,
      };
    }
  }

  // ── SMS notifications (post-commit, non-blocking) ─────────

  const seller = await db.user.findUnique({
    where:  { id: result.listing.seller_id },
    select: { phone: true },
  });

  await Promise.allSettled([
    sms.notifyBuyer({
      phone:       buyer.phone,
      orderNumber: result.order.orderNumber,
      produceName: result.listing.produce_name,
      quantityKg,
      totalAmount: result.totalAmount,
      currency:    result.currency,
    }),
    seller ? sms.notifyFarmer({
      phone:       seller.phone,
      orderNumber: result.order.orderNumber,
      produceName: result.listing.produce_name,
      quantityKg,
      totalAmount: result.subtotalAmount,
      currency:    result.currency,
      isSoldOut:   result.newListingStatus === ListingStatus.SOLD_OUT,
    }) : Promise.resolve(),
  ]);

  return {
    orderId:                result.order.id,
    orderNumber:            result.order.orderNumber,
    subtotalAmount:         result.subtotalAmount,
    deliveryFee:            result.deliveryFee,
    totalAmount:            result.totalAmount,
    currency:               result.currency,
    listingStatus:          result.newListingStatus,
    availableQuantityAfter: result.newAvailableQty,
    fulfillment:            deliveryOption,
    pickupContact,
  };
}

// ─────────────────────────────────────────────────────────────
// getOrderById
// ─────────────────────────────────────────────────────────────

export async function getOrderById(
  orderId: string,
  buyerId: string,
  db: PrismaClient
) {
  return db.order.findFirst({
    where: { id: orderId, buyerId },
    select: {
      ...ORDER_SELECT,
      orderItems: { select: ORDER_ITEM_SELECT },
      payments: {
        select: {
          id: true, amount: true, currency: true,
          method: true, status: true, paidAt: true,
        },
      },
      delivery: {
        select: {
          id: true, status: true, scheduledPickupAt: true,
          estimatedDeliveryAt: true, deliveredAt: true,
          // Deliberately excluded: pickupAddress, farmerPhone (logistics-only)
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// getBuyerOrders — paginated list
// ─────────────────────────────────────────────────────────────

export async function getBuyerOrders(
  buyerId: string,
  db: PrismaClient,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const take = Math.min(pageSize, MAX_PAGE_SIZE);
  const skip = (Math.max(1, page) - 1) * take;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where:   { buyerId },
      select: {
        ...ORDER_SELECT,
        orderItems: { select: ORDER_ITEM_SELECT },
      },
      orderBy: { placedAt: "desc" },
      skip,
      take,
    }),
    db.order.count({ where: { buyerId } }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    },
  };
}
