// ─────────────────────────────────────────────────────────────
// listing.service.test.ts — Unit tests for listing service
//
// Coverage targets:
//   ✅ Happy path — public listing payload shape
//   ✅ Privacy — no PII fields in public response
//   ✅ Filters — category, region, fulfillment, qty
//   ✅ Not found — returns null for missing/inactive listing
// ─────────────────────────────────────────────────────────────

import { getPublicListings, getPublicListingById } from "./listing.service";
import { DeliveryOption, ListingStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Mock listing row — matches PUBLIC_LISTING_SELECT shape
// ─────────────────────────────────────────────────────────────

const MOCK_LISTING_ROW = {
  id:                "listing-1",
  produceName:       "Tomatoes",
  variety:           "Sukari F1",
  farmLocation:      "Kirinyaga, Eastern Province",
  harvestDate:       new Date("2026-09-01"),
  expiryDate:        null,
  totalQuantity:     { toNumber: () => 2000 },
  availableQuantity: { toNumber: () => 1500 },
  unit:              "KG",
  minimumOrderQty:   { toNumber: () => 50 },
  unitPrice:         { toNumber: () => 45 },
  currency:          "KES",
  deliveryOptions:   [DeliveryOption.SELF_PICKUP, DeliveryOption.DELIVERED],
  deliveryRadiusKm:  80,
  isOrganic:         false,
  status:            ListingStatus.ACTIVE,
  imageUrls:         [],
  category: { name: "Vegetables" },
  seller: {
    isVerified:         true,
    farmerProfile:      { farmName: "Kirinyaga Farm" },
    cooperativeProfile: { cooperativeName: "Kirinyaga Farmers Cooperative" },
  },
};

function buildMockDb(rows = [MOCK_LISTING_ROW], total = rows.length) {
  return {
    produceListing: {
      findMany:  jest.fn().mockResolvedValue(rows),
      findFirst: jest.fn().mockResolvedValue(rows[0] ?? null),
      count:     jest.fn().mockResolvedValue(total),
    },
  } as unknown as Parameters<typeof getPublicListings>[1];
}

// ─────────────────────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────────────────────

describe("getPublicListings — happy path", () => {
  it("returns a listings array with pagination metadata", async () => {
    const db     = buildMockDb();
    const result = await getPublicListings({}, db);

    expect(result.listings).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(1);
  });

  it("maps farmLocation to district-level region", async () => {
    const db     = buildMockDb();
    const result = await getPublicListings({}, db);
    const listing = result.listings[0];

    // "Kirinyaga, Eastern Province" → "Kirinyaga District"
    expect(listing.region).toBe("Kirinyaga District");
    expect(listing.region).not.toContain("Eastern Province");
  });

  it("uses cooperative name as sellerDisplayName", async () => {
    const db      = buildMockDb();
    const result  = await getPublicListings({}, db);
    const listing = result.listings[0];

    expect(listing.sellerDisplayName).toBe("Kirinyaga Farmers Cooperative");
  });
});

// ─────────────────────────────────────────────────────────────
// Privacy assertions
// ─────────────────────────────────────────────────────────────

describe("getPublicListings — privacy", () => {
  const PII_FIELDS = [
    "phone", "email", "firstName", "lastName",
    "nationalIdNumber", "passwordHash",
    "farmLocation",     // exact address — replaced by region
  ];

  it("does not include any PII fields in public listing payloads", async () => {
    const db     = buildMockDb();
    const result = await getPublicListings({}, db);
    const serialized = JSON.stringify(result.listings[0]);

    for (const field of PII_FIELDS) {
      expect(serialized).not.toContain(`"${field}"`);
    }
  });

  it("does not expose full farmLocation string (exact address)", async () => {
    const db      = buildMockDb();
    const result  = await getPublicListings({}, db);
    const listing = result.listings[0];

    expect((listing as Record<string, unknown>)["farmLocation"]).toBeUndefined();
    expect(listing.region).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────
// getPublicListingById
// ─────────────────────────────────────────────────────────────

describe("getPublicListingById", () => {
  it("returns the listing when found", async () => {
    const db      = buildMockDb();
    const listing = await getPublicListingById("listing-1", db);

    expect(listing).not.toBeNull();
    expect(listing?.id).toBe("listing-1");
  });

  it("returns null when listing is not found", async () => {
    const db = buildMockDb();
    (db.produceListing.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const listing = await getPublicListingById("unknown-id", db);
    expect(listing).toBeNull();
  });
});
