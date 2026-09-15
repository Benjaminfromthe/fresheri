// ─────────────────────────────────────────────────────────────
// Listings Controller — HTTP Layer Only
//
// Architecture compliance:
//   ✅ No business logic — delegates to listing.service
//   ✅ No direct DB calls — db injected via factory
//   ✅ Error codes from src/constants/errors.ts
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { PrismaClient, DeliveryOption } from "@prisma/client";
import {
  getPublicListings,
  getPublicListingById,
  getSellerListings,
} from "./listing.service";
import { handleServiceError } from "../lib/handle-error";
import { ErrorCode } from "../constants/errors";

export function createListingController(db: PrismaClient) {

  // ── GET /listings ───────────────────────────────────────────
  async function listPublicListings(req: Request, res: Response): Promise<void> {
    const { category, minAvailableQty, region, fulfillment, search, page, pageSize } =
      req.query as Record<string, string | undefined>;

    if (fulfillment && !Object.values(DeliveryOption).includes(fulfillment as DeliveryOption)) {
      res.status(400).json({
        error:   ErrorCode.VALIDATION_ERROR,
        message: `fulfillment must be one of: ${Object.values(DeliveryOption).join(", ")}.`,
      });
      return;
    }

    try {
      const result = await getPublicListings(
        {
          category,
          minAvailableQty: minAvailableQty ? Number(minAvailableQty) : undefined,
          region,
          fulfillment: fulfillment as DeliveryOption | undefined,
          search,
          page:     page     ? Math.max(1, parseInt(page, 10))     : 1,
          pageSize: pageSize ? Math.min(100, parseInt(pageSize, 10)) : 20,
        },
        db
      );
      res.status(200).json(result);
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  // ── GET /listings/mine ──────────────────────────────────────
  async function getMyListings(req: Request, res: Response): Promise<void> {
    const sellerId = req.caller!.userId;
    try {
      const listings = await getSellerListings(sellerId, db);
      res.status(200).json({ data: listings });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  // ── GET /listings/:id ───────────────────────────────────────
  async function getListingById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const listing = await getPublicListingById(id, db);
      if (!listing) {
        res.status(404).json({
          error:   ErrorCode.LISTING_NOT_FOUND,
          message: `Listing ${id} not found or is not currently available.`,
        });
        return;
      }
      res.status(200).json({ data: listing });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  return { listPublicListings, getMyListings, getListingById };
}
