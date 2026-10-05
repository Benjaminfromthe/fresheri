// ─────────────────────────────────────────────────────────────
// Farmer Order Service — Fulfillment Actions
//
// Architecture compliance:
//   ✅ PrismaClient + SmsService injected — no singletons
//   ✅ Explicit select on every query — no PII leakage
//   ✅ All status transitions validated before update
//   ✅ SMS fires post-commit, non-blocking
// ─────────────────────────────────────────────────────────────

import { PrismaClient, OrderStatus } from "@prisma/client";
import { SmsService } from "../lib/sms";
import { ForbiddenError, OrderNotFoundError } from "../constants/errors";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/config";

// ── Allowed status transitions for farmer actions ─────────────
const FARMER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.CONFIRMED]:      OrderStatus.PROCESSING,        // Accept
  [OrderStatus.PROCESSING]:     OrderStatus.READY_FOR_PICKUP,  // Mark packed & ready
  [OrderStatus.DISPATCHED]:     OrderStatus.DELIVERED,          // Mark delivered (DELIVERED flow)
  [OrderStatus.READY_FOR_PICKUP]: OrderStatus.DELIVERED,        // Complete at gate
};

// ── Explicit select — buyer PII excluded ─────────────────────
const FARMER_ORDER_SELECT = {
  id:              true,
  orderNumber:     true,
  status:          true,
  pickupCode:      true,
  deliveryOption:  true,
  deliveryAddress: true,
  subtotalAmount:  true,
  deliveryFee:     true,
  totalAmount:     true,
  currency:        true,
  placedAt:        true,
  confirmedAt:     true,
  updatedAt:       true,
  // Buyer info — only name, no phone until SELF_PICKUP CONFIRMED
  buyer: {
    select: {
      firstName: true,
      lastName:  true,
      // phone deliberately excluded from list view
    },
  },
  orderItems: {
    select: {
      id:               true,
      produceName:      true,
      variety:          true,
      unit:             true,
      quantityOrdered:  true,
      unitPriceAtOrder: true,
      lineTotal:        true,
      isFulfilled:      true,
      listingId:        true,
    },
  },
} as const;

// ── Types ──────────────────────────────────────────────────────

export interface FarmerOrdersResult {
  orders: FarmerOrder[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface FarmerOrder {
  id: string;
  orderNumber: string;
  status: string;
  pickupCode: string | null;
  deliveryOption: string;
  deliveryAddress: string | null;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  placedAt: Date;
  confirmedAt: Date | null;
  updatedAt: Date;
  buyer: { firstName: string; lastName: string };
  orderItems: {
    id: string;
    produceName: string;
    variety: string | null;
    unit: string;
    quantityOrdered: number;
    unitPriceAtOrder: number;
    lineTotal: number;
    isFulfilled: boolean;
    listingId: string;
  }[];
}

// ─────────────────────────────────────────────────────────────
// getOrdersForSeller — paginated list of all orders for a farmer's listings
// ─────────────────────────────────────────────────────────────

export async function getOrdersForSeller(
  sellerId: string,
  db: PrismaClient,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<FarmerOrdersResult> {
  const take = Math.min(pageSize, MAX_PAGE_SIZE);
  const skip = (Math.max(1, page) - 1) * take;

  // Find all listingIds owned by this seller
  const sellerListings = await db.produceListing.findMany({
    where:  { sellerId },
    select: { id: true },
  });
  const listingIds = sellerListings.map((l) => l.id);

  if (listingIds.length === 0) {
    return { orders: [], pagination: { total: 0, page, pageSize: take, totalPages: 0 } };
  }

  // Find orders that contain items from this seller's listings
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: {
        orderItems: { some: { listingId: { in: listingIds } } },
        // Exclude terminal states from active view but include all for history
      },
      select: FARMER_ORDER_SELECT,
      orderBy: { placedAt: "desc" },
      skip,
      take,
    }),
    db.order.count({
      where: { orderItems: { some: { listingId: { in: listingIds } } } },
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      ...o,
      subtotalAmount:  Number(o.subtotalAmount),
      deliveryFee:     Number(o.deliveryFee),
      totalAmount:     Number(o.totalAmount),
      orderItems: o.orderItems.map((i) => ({
        ...i,
        quantityOrdered:  Number(i.quantityOrdered),
        unitPriceAtOrder: Number(i.unitPriceAtOrder),
        lineTotal:        Number(i.lineTotal),
      })),
    })),
    pagination: {
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// updateOrderStatus — Accept / Mark Ready / Complete
// ─────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId:  string,
  sellerId: string,
  action:   "accept" | "ready" | "complete",
  db:       PrismaClient,
  sms:      SmsService
): Promise<FarmerOrder> {
  // 1. Fetch the order and verify it belongs to this seller
  const order = await db.order.findFirst({
    where: {
      id:         orderId,
      orderItems: { some: { listing: { sellerId } } },
    },
    select: {
      ...FARMER_ORDER_SELECT,
      buyer: { select: { firstName: true, lastName: true, phone: true } },
    },
  });
  if (!order) throw new OrderNotFoundError(orderId);

  // 2. Determine target status
  const currentStatus = order.status as OrderStatus;
  const actionMap: Record<typeof action, OrderStatus> = {
    accept:   OrderStatus.PROCESSING,
    ready:    OrderStatus.READY_FOR_PICKUP,
    complete: OrderStatus.DELIVERED,
  };
  const nextStatus = actionMap[action];

  const allowed = FARMER_TRANSITIONS[currentStatus];
  if (allowed !== nextStatus) {
    throw new ForbiddenError(
      `Cannot transition from ${currentStatus} to ${nextStatus} via '${action}'.`
    );
  }

  // 3. Update status
  const updatedData: Record<string, unknown> = {
    status:    nextStatus,
    updatedAt: new Date(),
  };
  if (nextStatus === OrderStatus.DELIVERED) updatedData.deliveredAt = new Date();

  const updated = await db.order.update({
    where:  { id: orderId },
    data:   updatedData,
    select: FARMER_ORDER_SELECT,
  });

  // 4. SMS buyer — non-blocking, post-commit
  const buyerPhone = (order.buyer as { phone?: string }).phone;
  if (buyerPhone) {
    const msgs: Record<typeof action, string> = {
      accept:
        `Fresheri: Good news! Order #${order.orderNumber} has been accepted by the cooperative. ` +
        `They are now preparing your ${order.orderItems[0]?.produceName ?? "produce"}.`,
      ready:
        order.deliveryOption === "SELF_PICKUP"
          ? `Fresheri: Order #${order.orderNumber} is READY for pickup! ` +
            `Your pickup code: ${order.pickupCode ?? "N/A"}. Present this at the farm gate.`
          : `Fresheri: Order #${order.orderNumber} is packed and ready. Your delivery is being dispatched.`,
      complete:
        `Fresheri: Order #${order.orderNumber} has been completed. Thank you for using Fresheri!`,
    };
    sms.send([buyerPhone], msgs[action]).catch((err) =>
      console.error("[SMS] Farmer action notify failed:", err)
    );
  }

  return {
    ...updated,
    subtotalAmount:  Number(updated.subtotalAmount),
    deliveryFee:     Number(updated.deliveryFee),
    totalAmount:     Number(updated.totalAmount),
    orderItems: updated.orderItems.map((i) => ({
      ...i,
      quantityOrdered:  Number(i.quantityOrdered),
      unitPriceAtOrder: Number(i.unitPriceAtOrder),
      lineTotal:        Number(i.lineTotal),
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// getOrderByIdForSeller — single order detail
// ─────────────────────────────────────────────────────────────

export async function getOrderByIdForSeller(
  orderId:  string,
  sellerId: string,
  db:       PrismaClient
): Promise<FarmerOrder | null> {
  const order = await db.order.findFirst({
    where: {
      id:         orderId,
      orderItems: { some: { listing: { sellerId } } },
    },
    select: FARMER_ORDER_SELECT,
  });
  if (!order) return null;

  return {
    ...order,
    subtotalAmount:  Number(order.subtotalAmount),
    deliveryFee:     Number(order.deliveryFee),
    totalAmount:     Number(order.totalAmount),
    orderItems: order.orderItems.map((i) => ({
      ...i,
      quantityOrdered:  Number(i.quantityOrdered),
      unitPriceAtOrder: Number(i.unitPriceAtOrder),
      lineTotal:        Number(i.lineTotal),
    })),
  };
}
