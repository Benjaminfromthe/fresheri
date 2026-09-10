// ─────────────────────────────────────────────────────────────
// Delivery Dispatch Service
//
// When a buyer selects DELIVERED fulfillment:
//   • Farmer contact details are NEVER returned to the buyer.
//   • A Delivery record is created linking the order to a
//     logistics partner (or left unassigned for manual dispatch).
//   • The dispatch task contains the farmer's pickup location
//     visible only to the logistics partner / internal agent.
//
// When a buyer selects SELF_PICKUP and the order is CONFIRMED:
//   • The farmer's pickup location + direct contact phone are
//     returned exclusively to that specific buyer for that order.
//   • This contact is fetched via a dedicated function that
//     enforces order ownership before disclosing anything.
// ─────────────────────────────────────────────────────────────

import { DeliveryStatus } from "@prisma/client";
import prisma from "../lib/prisma";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Returned to the buyer ONLY for SELF_PICKUP confirmed orders */
export interface PickupContactDisclosure {
  orderId:       string;
  orderNumber:   string;
  produceName:   string;
  quantityKg:    number;
  pickupLocation: string;       // exact farm address
  farmerContact:  string;       // farmer phone — disclosed post-order only
  farmerName:     string;       // cooperative/farm name only (no surname)
  note:           string;
}

/** Internal-only dispatch task — never sent to the buyer */
export interface DeliveryDispatchTask {
  deliveryId:         string;
  orderId:            string;
  orderNumber:        string;
  produceName:        string;
  quantityKg:         number;
  pickupAddress:      string;   // full farm address for logistics driver
  deliveryAddress:    string;   // buyer's delivery address
  farmerPhone:        string;   // for driver coordination only
  status:             DeliveryStatus;
  scheduledPickupAt:  Date | null;
}

// ─────────────────────────────────────────────────────────────
// createDeliveryDispatch
// Called after a DELIVERED order is confirmed.
// Creates a Delivery record for the logistics partner.
// Returns the internal dispatch task (NOT sent to buyer).
// ─────────────────────────────────────────────────────────────

export async function createDeliveryDispatch(
  orderId: string
): Promise<DeliveryDispatchTask> {
  // Fetch the order + items + seller details
  // Explicit select — only pull what dispatch needs
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id:              true,
      orderNumber:     true,
      deliveryAddress: true,
      orderItems: {
        select: {
          produceName:    true,
          quantityOrdered: true,
          farmLocation:   true,
          listing: {
            select: {
              seller: {
                select: {
                  phone: true,            // needed for driver coordination
                  farmerProfile: {
                    select: {
                      farmLocation: true,
                      farmName:     true,
                    },
                  },
                  cooperativeProfile: {
                    select: { cooperativeName: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) throw new Error(`Order ${orderId} not found.`);
  if (!order.deliveryAddress) {
    throw new Error(`Order ${orderId} has no delivery address.`);
  }

  const item         = order.orderItems[0];
  const seller       = item.listing.seller;
  const farmerPhone  = seller.phone;
  const pickupAddress =
    seller.farmerProfile?.farmLocation ??
    item.farmLocation;

  // Create the Delivery record — unassigned until a logistics partner picks it up
  const delivery = await prisma.delivery.create({
    data: {
      orderId:         order.id,
      status:          DeliveryStatus.NOT_ASSIGNED,
      pickupAddress,
      deliveryAddress: order.deliveryAddress,
      scheduledPickupAt: null,
    },
    select: {
      id:               true,
      status:           true,
      scheduledPickupAt: true,
    },
  });

  return {
    deliveryId:        delivery.id,
    orderId:           order.id,
    orderNumber:       order.orderNumber,
    produceName:       item.produceName,
    quantityKg:        Number(item.quantityOrdered),
    pickupAddress,
    deliveryAddress:   order.deliveryAddress,
    farmerPhone,
    status:            delivery.status,
    scheduledPickupAt: delivery.scheduledPickupAt,
  };
}

// ─────────────────────────────────────────────────────────────
// getPickupContactForBuyer
// Discloses farmer pickup details to a buyer ONLY when:
//   1. The order belongs to that buyer (ownership check)
//   2. The order's fulfillment option is SELF_PICKUP
//   3. The order status is CONFIRMED or later
//
// Any violation returns null — caller sends 403.
// ─────────────────────────────────────────────────────────────

export async function getPickupContactForBuyer(
  orderId: string,
  buyerId: string
): Promise<PickupContactDisclosure | null> {
  const order = await prisma.order.findFirst({
    where: {
      id:             orderId,
      buyerId,                             // ownership
      deliveryOption: "SELF_PICKUP",       // fulfillment type
      status:         {
        in: ["CONFIRMED", "PROCESSING", "DISPATCHED", "DELIVERED"],
      },
    },
    select: {
      id:          true,
      orderNumber: true,
      status:      true,
      orderItems: {
        select: {
          produceName:     true,
          quantityOrdered: true,
          farmLocation:    true,
          listing: {
            select: {
              seller: {
                // Explicit select — phone disclosed ONLY here, post-order
                select: {
                  phone: true,
                  farmerProfile: {
                    select: {
                      farmLocation: true,
                      farmName:     true,
                    },
                  },
                  cooperativeProfile: {
                    select: { cooperativeName: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Order not found, wrong buyer, wrong fulfillment type, or wrong status
  if (!order || order.orderItems.length === 0) return null;

  const item   = order.orderItems[0];
  const seller = item.listing.seller;

  const pickupLocation =
    seller.farmerProfile?.farmLocation ??
    item.farmLocation;

  // Display name — never a personal surname
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
    farmerContact:  seller.phone,   // ← only disclosed here, post-order, self-pickup only
    farmerName,
    note:
      "This contact is shared exclusively for pickup coordination. " +
      "Please do not share it publicly.",
  };
}
