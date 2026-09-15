// ─────────────────────────────────────────────────────────────
// Listing Service — Privacy-Safe Produce Listing Queries
//
// PRIVACY RULES (enforced here, not in the controller):
//   • Public / buyer payloads NEVER include:
//       - seller phone, email, nationalIdNumber
//       - seller firstName / lastName
//       - exact street address (farmLocation is district-level only)
//   • All Prisma queries use explicit `select` — no accidental
//     field leakage if the schema grows new sensitive columns.
//   • Seller identity is represented only by cooperative/farm name
//     and a verified flag.
// ─────────────────────────────────────────────────────────────

import { DeliveryOption, ListingStatus, Prisma, PrismaClient } from "@prisma/client";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/config";

// ─────────────────────────────────────────────────────────────
// Public-safe listing shape — NO farmer PII
// ─────────────────────────────────────────────────────────────

export interface PublicListing {
  id: string;
  produceName: string;
  variety: string | null;
  categoryName: string;
  /** Cooperative or farm name only — never the farmer's full name */
  sellerDisplayName: string;
  sellerVerified: boolean;
  /** District/region only — e.g. "Rwamagana District" */
  region: string;
  harvestDate: Date;
  expiryDate: Date | null;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
  minimumOrderQty: number;
  unitPrice: number;
  currency: string;
  deliveryOptions: DeliveryOption[];
  deliveryRadiusKm: number | null;
  isOrganic: boolean;
  status: ListingStatus;
  imageUrls: string[];
}

// ─────────────────────────────────────────────────────────────
// Explicit Prisma select — NEVER changes without code review
// Any column NOT listed here is unreachable from this service.
// ─────────────────────────────────────────────────────────────

const PUBLIC_LISTING_SELECT = {
  id:                true,
  produceName:       true,
  variety:           true,
  farmLocation:      true,   // district-level, scrubbed before return
  harvestDate:       true,
  expiryDate:        true,
  totalQuantity:     true,
  availableQuantity: true,
  unit:              true,
  minimumOrderQty:   true,
  unitPrice:         true,
  currency:          true,
  deliveryOptions:   true,
  deliveryRadiusKm:  true,
  isOrganic:         true,
  status:            true,
  imageUrls:         true,
  category: {
    select: { name: true },
  },
  // Seller: only display name + verified flag — NO phone/email/id
  seller: {
    select: {
      isVerified:        true,
      farmerProfile: {
        select: { farmName: true },          // farm name only
      },
      cooperativeProfile: {
        select: { cooperativeName: true },   // coop name only
      },
      // Deliberately excluded: firstName, lastName, phone, email,
      // passwordHash, nationalIdNumber, profileImageUrl
    },
  },
} satisfies Prisma.ProduceListingSelect;

// ─────────────────────────────────────────────────────────────
// Helper — extract district from farmLocation string
// "Rwamagana, Eastern Province" → "Rwamagana District"
// Strips everything after the first comma and appends " District"
// so exact street addresses are never surfaced publicly.
// ─────────────────────────────────────────────────────────────

function toRegion(farmLocation: string): string {
  const base = farmLocation.split(",")[0].trim();
  return base.endsWith("District") ? base : `${base} District`;
}

// ─────────────────────────────────────────────────────────────
// Helper — derive a display name from seller profiles
// Priority: cooperativeName > farmName > "Verified Seller"
// ─────────────────────────────────────────────────────────────

function sellerDisplayName(
  seller: {
    isVerified: boolean;
    farmerProfile: { farmName: string | null } | null;
    cooperativeProfile: { cooperativeName: string } | null;
  }
): string {
  if (seller.cooperativeProfile?.cooperativeName) {
    return seller.cooperativeProfile.cooperativeName;
  }
  if (seller.farmerProfile?.farmName) {
    return seller.farmerProfile.farmName;
  }
  return "Independent Farmer";
}

// ─────────────────────────────────────────────────────────────
// Map raw Prisma row → PublicListing
// ─────────────────────────────────────────────────────────────

type RawListing = Prisma.ProduceListingGetPayload<{
  select: typeof PUBLIC_LISTING_SELECT;
}>;

function toPublicListing(raw: RawListing): PublicListing {
  return {
    id:                raw.id,
    produceName:       raw.produceName,
    variety:           raw.variety,
    categoryName:      raw.category.name,
    sellerDisplayName: sellerDisplayName(raw.seller),
    sellerVerified:    raw.seller.isVerified,
    region:            toRegion(raw.farmLocation),   // ← PII scrub
    harvestDate:       raw.harvestDate,
    expiryDate:        raw.expiryDate,
    totalQuantity:     Number(raw.totalQuantity),
    availableQuantity: Number(raw.availableQuantity),
    unit:              raw.unit,
    minimumOrderQty:   Number(raw.minimumOrderQty),
    unitPrice:         Number(raw.unitPrice),
    currency:          raw.currency,
    deliveryOptions:   raw.deliveryOptions,
    deliveryRadiusKm:  raw.deliveryRadiusKm,
    isOrganic:         raw.isOrganic,
    status:            raw.status,
    imageUrls:         raw.imageUrls,
  };
}

// ─────────────────────────────────────────────────────────────
// Query filters
// ─────────────────────────────────────────────────────────────

export interface ListingFilters {
  category?:       string;
  minAvailableQty?: number;
  region?:         string;
  fulfillment?:    DeliveryOption;
  search?:         string;
  page?:           number;
  pageSize?:       number;
}

// ─────────────────────────────────────────────────────────────
// getPublicListings — buyer-facing browse endpoint
// Returns only privacy-safe fields; never leaks farmer PII.
// ─────────────────────────────────────────────────────────────

export async function getPublicListings(
  filters: ListingFilters = {},
  db: PrismaClient
) {
  const {
    category,
    minAvailableQty,
    region,
    fulfillment,
    search,
    page     = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  const take = Math.min(pageSize, MAX_PAGE_SIZE);
  const skip = (Math.max(1, page) - 1) * take;

  // Build where clause — only ACTIVE and PARTIALLY_SOLD listings are public
  const where: Prisma.ProduceListingWhereInput = {
    status: { in: [ListingStatus.ACTIVE, ListingStatus.PARTIALLY_SOLD] },
  };

  if (category) {
    where.category = { name: { equals: category, mode: "insensitive" } };
  }

  if (minAvailableQty && minAvailableQty > 0) {
    where.availableQuantity = { gte: minAvailableQty };
  }

  if (region) {
    // Match anywhere in farmLocation (district-level, case-insensitive)
    where.farmLocation = { contains: region, mode: "insensitive" };
  }

  if (fulfillment) {
    where.deliveryOptions = { has: fulfillment };
  }

  if (search?.trim()) {
    where.OR = [
      { produceName:  { contains: search, mode: "insensitive" } },
      { variety:      { contains: search, mode: "insensitive" } },
      { farmLocation: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.produceListing.findMany({
      where,
      select: PUBLIC_LISTING_SELECT,
      orderBy: { harvestDate: "desc" },
      skip,
      take,
    }),
    db.produceListing.count({ where }),
  ]);

  return {
    listings: rows.map(toPublicListing),
    pagination: {
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// getPublicListingById — single listing detail
// ─────────────────────────────────────────────────────────────

export async function getPublicListingById(
  id: string,
  db: PrismaClient
): Promise<PublicListing | null> {
  const raw = await db.produceListing.findFirst({
    where: {
      id,
      status: { in: [ListingStatus.ACTIVE, ListingStatus.PARTIALLY_SOLD] },
    },
    select: PUBLIC_LISTING_SELECT,
  });

  return raw ? toPublicListing(raw) : null;
}

// ─────────────────────────────────────────────────────────────
// getSellerListings — seller sees their OWN listings (full detail)
// Only accessible to the listing owner or ADMIN.
// Still uses explicit select — no extra PII beyond what the
// seller already owns.
// ─────────────────────────────────────────────────────────────

export async function getSellerListings(sellerId: string, db: PrismaClient) {
  return db.produceListing.findMany({
    where: { sellerId },
    select: {
      id:                true,
      produceName:       true,
      variety:           true,
      totalQuantity:     true,
      availableQuantity: true,
      unit:              true,
      unitPrice:         true,
      currency:          true,
      status:            true,
      harvestDate:       true,
      expiryDate:        true,
      farmLocation:      true,   // full location for the owner
      deliveryOptions:   true,
      imageUrls:         true,
      isOrganic:         true,
      createdAt:         true,
      updatedAt:         true,
      category:  { select: { name: true } },
      orderItems: {
        select: {
          quantityOrdered:   true,
          quantityDelivered: true,
          lineTotal:         true,
          isFulfilled:       true,
          createdAt:         true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
