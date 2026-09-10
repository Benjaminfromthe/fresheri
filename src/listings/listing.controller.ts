// ─────────────────────────────────────────────────────────────
// Listings Controller
// Public endpoints return only privacy-safe payloads.
// Seller endpoint requires ownership or ADMIN role.
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { DeliveryOption } from "@prisma/client";
import {
  getPublicListings,
  getPublicListingById,
  getSellerListings,
} from "./listing.service";

// ─────────────────────────────────────────────────────────────
// GET /listings — browse public listings (no auth required)
// ─────────────────────────────────────────────────────────────

/**
 * Query params:
 *   category        — filter by crop category name
 *   minAvailableQty — minimum kg available
 *   region          — district/region name (partial match)
 *   fulfillment     — "SELF_PICKUP" | "DELIVERED"
 *   search          — free-text search on produce name / variety / location
 *   page            — page number (default 1)
 *   pageSize        — results per page (default 20, max 100)
 */
export async function listPublicListings(
  req: Request,
  res: Response
): Promise<void> {
  const {
    category,
    minAvailableQty,
    region,
    fulfillment,
    search,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  // Validate fulfillment if provided
  if (
    fulfillment &&
    !Object.values(DeliveryOption).includes(fulfillment as DeliveryOption)
  ) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: `fulfillment must be one of: ${Object.values(DeliveryOption).join(", ")}.`,
    });
    return;
  }

  const result = await getPublicListings({
    category,
    minAvailableQty: minAvailableQty ? Number(minAvailableQty) : undefined,
    region,
    fulfillment: fulfillment as DeliveryOption | undefined,
    search,
    page:     page     ? Math.max(1, parseInt(page, 10))     : 1,
    pageSize: pageSize ? Math.min(100, parseInt(pageSize, 10)) : 20,
  });

  res.status(200).json(result);
}

// ─────────────────────────────────────────────────────────────
// GET /listings/:id — single listing detail (no auth required)
// ─────────────────────────────────────────────────────────────

export async function getListingById(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const listing = await getPublicListingById(id);
  if (!listing) {
    res.status(404).json({
      error: "LISTING_NOT_FOUND",
      message: `Listing ${id} not found or is not currently available.`,
    });
    return;
  }

  res.status(200).json({ data: listing });
}

// ─────────────────────────────────────────────────────────────
// GET /listings/seller/:sellerId — seller's own listings
// Protected: requires resolveCallerMiddleware + requireRoles
// (enforced in the router, not here)
// ─────────────────────────────────────────────────────────────

export async function getMyListings(
  req: Request,
  res: Response
): Promise<void> {
  // req.caller is guaranteed by resolveCallerMiddleware
  const sellerId = req.caller!.userId;

  const listings = await getSellerListings(sellerId);
  res.status(200).json({ data: listings });
}
