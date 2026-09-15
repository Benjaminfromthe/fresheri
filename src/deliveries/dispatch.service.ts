// ─────────────────────────────────────────────────────────────
// Delivery Dispatch Service — Business Logic Layer
//
// Architecture compliance:
//   ✅ Receives PrismaClient as injected dependency
//   ✅ All Prisma queries use explicit `select` blocks
//   ✅ Domain errors from src/constants/errors.ts
//   ✅ No singleton prisma import
// ─────────────────────────────────────────────────────────────

import { PrismaClient, DeliveryStatus, OrderStatus } from "@prisma/client";
import { OrderNotFoundError } from "../constants/errors";

// ── Output types ─────────────────────────────────────────────

/** Returned to buyer ONLY for SELF_PICKUP confirmed orders */
export interface PickupContactDisclosure {
  orderId:        string;
  orderNumber:    string;
  produceName:    string;
  quantityKg:     number;
  pickupLocation: string;
  farmerContact:  string;   // disclosed post-order, SELF_PICKUP only
  farmerName:     string;   // cooperative/farm name — never personal surname
  note:           string;
}

/** Internal-only dispatch task — never sent to buyer */
export interface DeliveryDispatchTask {
  deliveryId:        string;
  orderId:           string;
  orderNumber:       string;
  produceName:       string;
  quantityKg:        number;
  pickupAddress:     string;
  deliveryAddress:   string;
  farmerPhone:       string;
  status:            DeliveryStatus;
  scheduledPickupAt: Date | null;
}

// ─────────────────────────────────────────────────────────────
// createDeliveryDispatch
// Creates Delivery record for logistics partner.
// Returns internal dispatch task — NOT returned to buyer.
// ─────────────────────────────────────────────────────────────

export async function createDeliveryDispatch(
  orderId: string,
  db: PrismaClient
): Promise<DeliveryDispatchTask> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id:              true,
      orderNumber:     true,
      deliveryAddress: true,
      orderItems: {
        select: {
          produceName:     true,
          quantityOrdered: true,
          farmLocation:    true,
          listing: {
            select: {
              seller: {
                select: {
                  phone: true,
                  farmerProfile:  { select: { farmLocation: true, farmName: true } },
                  cooperativeProfile: { select: { cooperativeName: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) throw new OrderNotFoundError(orderId);
  if (!order.deliveryAddress) {
    throw new OrderNotFoundError(`Order ${orderId} has no delivery address.`);
  }

  const item          = order.orderItems[0];
  const seller        = item.listing.seller;
  const pickupAddress = seller.farmerProfile?.farmLocation ?? item.farmLocation;

  const delivery = await db.delivery.create({
    data: {
      orderId:         order.id,
      status:          DeliveryStatus.NOT_ASSIGNED,
      pickupAddress,
      deliveryAddress: order.deliveryAddress,
      scheduledPickupAt: null,
    },
    select: { id: true, status: true, scheduledPickupAt: true },
  });

  return {
    deliveryId:        delivery.id,
    orderId:           order.id,
    orderNumber:       order.orderNumber,
    produceName:       item.produceName,
    quantityKg:        Number(item.quantityOrdered),
    pickupAddress,
    deliveryAddress:   order.deliveryAddress,
    farmerPhone:       seller.phone,
    status:            delivery.status,
    scheduledPickupAt: delivery.scheduledPickupAt,
  };
}

// ─────────────────────────────────────────────────────────────
// getPickupContactForBuyer
// Three-gate check before any PII is disclosed:
//   1. Order belongs to this buyer
//   2. Fulfillment is SELF_PICKUP
//   3. Status is CONFIRMED or later
// ─────────────────────────────────────────────────────────────

export async function getPickupContactForBuyer(
  orderId: string,
  buyerId: string,
  db: PrismaClient
): Promise<PickupContactDisclosure | null> {
  const order = await db.order.findFirst({
    where: {
      id:             orderId,
      buyerId,
      deliveryOption: "SELF_PICKUP",
      status: {
        in: [
          OrderStatus.CONFIRMED,
          OrderStatus.PROCESSING,
          OrderStatus.DISPATCHED,
          OrderStatus.DELIVERED,
        ],
      },
    },
    select: {
      id:          true,
      orderNumber: true,
      orderItems: {
        select: {
          produceName:     true,
          quantityOrdered: true,
          farmLocation:    true,
          listing: {
            select: {
              seller: {
                select: {
                  phone: true,
                  farmerProfile:      { select: { farmLocation: true, farmName: true } },
                  cooperativeProfile: { select: { cooperativeName: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order || order.orderItems.length === 0) return null;

  const item   = order.orderItems[0];
  const seller = item.listing.seller;

  const pickupLocation =
    seller.farmerProfile?.farmLocation ?? item.farmLocation;

  const farmerName =
    seller.cooperativeProfile?.cooperativeName ??
    seller.farmerProfile?.farmName ??
    "Your Seller";

  return {
    orderId:        order.id,
    orderNumber:    order.orderNumber,
    produceName:    item.produceName,
    quantityKg:     Number(item.quantityOrdered),
    pickupLocation,
    farmerContact:  seller.phone,
    farmerName,
    note:
      "This contact is shared exclusively for pickup coordination. " +
      "Please do not share it publicly.",
  };
}
