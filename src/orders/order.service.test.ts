// ─────────────────────────────────────────────────────────────
// order.service.test.ts — Unit tests for order business logic
//
// Coverage targets per architecture rules:
//   ✅ Happy path — successful order placement
//   ✅ Validation — invalid delivery option, missing address
//   ✅ Domain errors — insufficient inventory, listing not found, buyer not found
//   ✅ Privacy — pickupContact null for DELIVERED, populated for SELF_PICKUP
//   ✅ Atomicity — transaction called exactly once
// ─────────────────────────────────────────────────────────────

import { placeOrder, PlaceOrderInput } from "./order.service";
import {
  InsufficientInventoryError,
  ListingNotFoundError,
  BuyerNotFoundError,
  InvalidDeliveryOptionError,
} from "../constants/errors";
import { DeliveryOption, ListingStatus, OrderStatus, PaymentStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────

// Mock the dispatch service so no real DB calls happen
jest.mock("../deliveries/dispatch.service", () => ({
  createDeliveryDispatch:    jest.fn().mockResolvedValue({}),
  getPickupContactForBuyer:  jest.fn().mockResolvedValue({
    orderId:        "order-1",
    orderNumber:    "ORDER-001",
    produceName:    "Tomatoes",
    quantityKg:     500,
    pickupLocation: "Kirinyaga Farm Road 4",
    farmerContact:  "+254712345678",
    farmerName:     "Kirinyaga Farmers Cooperative",
    note:           "Do not share.",
  }),
}));

/**
 * Build a minimal PrismaClient mock.
 * Extend per-test to simulate specific DB responses.
 */
function buildMockDb(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: "buyer-1", phone: "+254700000001", firstName: "Test",
      }),
    },
    produceListing: {
      update: jest.fn().mockResolvedValue({ id: "listing-1" }),
    },
    order: {
      create: jest.fn().mockResolvedValue({
        id: "order-1", orderNumber: "ORDER-001",
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.UNPAID,
        subtotalAmount: 22500, deliveryFee: 0, totalAmount: 22500,
        currency: "KES", deliveryOption: DeliveryOption.SELF_PICKUP,
      }),
    },
    orderItem: {
      create: jest.fn().mockResolvedValue({ id: "item-1" }),
    },
    $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      // Provide mock tx with SELECT FOR UPDATE result
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{
          id:                 "listing-1",
          seller_id:          "seller-1",
          produce_name:       "Tomatoes",
          variety:            "Sukari F1",
          available_quantity: "2000.000",
          unit_price:         "45.00",
          unit:               "KG",
          farm_location:      "Kirinyaga Farm",
          status:             "ACTIVE",
          currency:           "KES",
          delivery_options:   [DeliveryOption.SELF_PICKUP, DeliveryOption.DELIVERED],
        }]),
        produceListing: { update: jest.fn().mockResolvedValue({ id: "listing-1" }) },
        order:         { create: jest.fn().mockResolvedValue({ id: "order-1", orderNumber: "ORDER-001" }) },
        orderItem:     { create: jest.fn().mockResolvedValue({ id: "item-1" }) },
      };
      return fn(tx);
    }),
    ...overrides,
  } as unknown as Parameters<typeof placeOrder>[1];
}

/** Minimal SMS mock — non-throwing, records calls */
const mockSms = {
  send:           jest.fn().mockResolvedValue(null),
  notifyBuyer:    jest.fn().mockResolvedValue(undefined),
  notifyFarmer:   jest.fn().mockResolvedValue(undefined),
};

const BASE_INPUT: PlaceOrderInput = {
  buyerId:        "buyer-1",
  listingId:      "listing-1",
  quantityKg:     500,
  deliveryOption: DeliveryOption.SELF_PICKUP,
};

// ─────────────────────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────────────────────

describe("placeOrder — happy path", () => {
  it("returns a PlaceOrderResult with correct totals for SELF_PICKUP", async () => {
    const db = buildMockDb({
      user: { findUnique: jest.fn().mockResolvedValue({ id: "seller-1", phone: "+254700000002" }) },
    });
    // First findUnique call = buyer, second = seller
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" })
      .mockResolvedValueOnce({ id: "seller-1", phone: "+254700000002" });

    const result = await placeOrder(BASE_INPUT, db, mockSms);

    expect(result.orderId).toBeDefined();
    expect(result.orderNumber).toBe("ORDER-001");
    expect(result.subtotalAmount).toBe(500 * 45);
    expect(result.deliveryFee).toBe(0);
    expect(result.fulfillment).toBe(DeliveryOption.SELF_PICKUP);
  });

  it("sets pickupContact for SELF_PICKUP confirmed orders", async () => {
    const db = buildMockDb();
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" })
      .mockResolvedValueOnce({ phone: "+254700000002" });

    const result = await placeOrder(BASE_INPUT, db, mockSms);

    expect(result.pickupContact).not.toBeNull();
    expect(result.pickupContact?.farmerContact).toBe("+254712345678");
  });

  it("sets pickupContact to null for DELIVERED orders", async () => {
    const db = buildMockDb();
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" })
      .mockResolvedValueOnce({ phone: "+254700000002" });

    const result = await placeOrder(
      { ...BASE_INPUT, deliveryOption: DeliveryOption.DELIVERED, deliveryAddress: "Kigali, KG 7 Ave" },
      db,
      mockSms
    );

    // Privacy rule: DELIVERED orders must never return pickup contact to buyer
    expect(result.pickupContact).toBeNull();
    expect(result.fulfillment).toBe(DeliveryOption.DELIVERED);
  });

  it("calls $transaction exactly once", async () => {
    const db = buildMockDb();
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" })
      .mockResolvedValueOnce({ phone: "+254700000002" });

    await placeOrder(BASE_INPUT, db, mockSms);

    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("fires SMS notifications post-commit", async () => {
    const sms = { ...mockSms, notifyBuyer: jest.fn().mockResolvedValue(undefined), notifyFarmer: jest.fn().mockResolvedValue(undefined) };
    const db  = buildMockDb();
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" })
      .mockResolvedValueOnce({ phone: "+254700000002" });

    await placeOrder(BASE_INPUT, db, sms);

    expect(sms.notifyBuyer).toHaveBeenCalledTimes(1);
    expect(sms.notifyFarmer).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Validation errors
// ─────────────────────────────────────────────────────────────

describe("placeOrder — validation", () => {
  it("throws InvalidDeliveryOptionError when DELIVERED has no address", async () => {
    const db = buildMockDb();
    await expect(
      placeOrder(
        { ...BASE_INPUT, deliveryOption: DeliveryOption.DELIVERED, deliveryAddress: "" },
        db,
        mockSms
      )
    ).rejects.toThrow(InvalidDeliveryOptionError);
  });

  it("throws InvalidDeliveryOptionError when listing does not support chosen option", async () => {
    const db = buildMockDb();
    // Buyer found but listing only supports SELF_PICKUP
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" });
    (db.$transaction as jest.Mock).mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{
          id: "listing-1", seller_id: "s1", produce_name: "Maize",
          variety: null, available_quantity: "5000.000", unit_price: "28.00",
          unit: "KG", farm_location: "Nakuru", status: "ACTIVE",
          currency: "KES", delivery_options: [DeliveryOption.SELF_PICKUP],
        }]),
        produceListing: { update: jest.fn() },
        order:          { create: jest.fn() },
        orderItem:      { create: jest.fn() },
      };
      return fn(tx);
    });

    await expect(
      placeOrder(
        { ...BASE_INPUT, deliveryOption: DeliveryOption.DELIVERED, deliveryAddress: "Nairobi" },
        db,
        mockSms
      )
    ).rejects.toThrow(InvalidDeliveryOptionError);
  });
});

// ─────────────────────────────────────────────────────────────
// Domain errors
// ─────────────────────────────────────────────────────────────

describe("placeOrder — domain errors", () => {
  it("throws BuyerNotFoundError when buyer does not exist", async () => {
    const db = buildMockDb();
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(placeOrder(BASE_INPUT, db, mockSms)).rejects.toThrow(BuyerNotFoundError);
  });

  it("throws ListingNotFoundError when listing is not active", async () => {
    const db = buildMockDb();
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" });
    (db.$transaction as jest.Mock).mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([]), // empty = not found / not active
        produceListing: { update: jest.fn() },
        order:          { create: jest.fn() },
        orderItem:      { create: jest.fn() },
      };
      return fn(tx);
    });

    await expect(placeOrder(BASE_INPUT, db, mockSms)).rejects.toThrow(ListingNotFoundError);
  });

  it("throws InsufficientInventoryError when requested qty > available", async () => {
    const db = buildMockDb();
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" });
    (db.$transaction as jest.Mock).mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{
          id: "listing-1", seller_id: "s1", produce_name: "Rice",
          variety: null, available_quantity: "100.000", unit_price: "120.00",
          unit: "KG", farm_location: "Mwea", status: "PARTIALLY_SOLD",
          currency: "KES", delivery_options: [DeliveryOption.SELF_PICKUP],
        }]),
        produceListing: { update: jest.fn() },
        order:          { create: jest.fn() },
        orderItem:      { create: jest.fn() },
      };
      return fn(tx);
    });

    await expect(
      placeOrder({ ...BASE_INPUT, quantityKg: 500 }, db, mockSms) // 500 > 100 available
    ).rejects.toThrow(InsufficientInventoryError);
  });
});

// ─────────────────────────────────────────────────────────────
// Privacy assertions
// ─────────────────────────────────────────────────────────────

describe("placeOrder — privacy guarantees", () => {
  it("never includes farmer phone in DELIVERED result payload", async () => {
    const db = buildMockDb();
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "buyer-1", phone: "+254700000001", firstName: "Test" })
      .mockResolvedValueOnce({ phone: "+254700000002" });

    const result = await placeOrder(
      { ...BASE_INPUT, deliveryOption: DeliveryOption.DELIVERED, deliveryAddress: "Hotel X" },
      db,
      mockSms
    );

    // Serialize result and assert no phone number leaks
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("+254700000002"); // seller phone
    expect(result.pickupContact).toBeNull();
  });
});
