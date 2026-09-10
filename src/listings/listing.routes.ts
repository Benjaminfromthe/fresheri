import { Router } from "express";
import {
  listPublicListings,
  getListingById,
  getMyListings,
} from "./listing.controller";
import {
  resolveCallerMiddleware,
  requireRoles,
  SELLER_ROLES,
} from "../middleware/rbac";

const router = Router();

/**
 * GET  /listings          — public browse (no auth required)
 * GET  /listings/mine     — seller's own listings (auth required)
 * GET  /listings/:id      — public single listing (no auth required)
 */

// Public routes — no auth
router.get("/",    listPublicListings);

// Seller-only route — must come BEFORE /:id to avoid param capture
router.get(
  "/mine",
  resolveCallerMiddleware,
  requireRoles(...SELLER_ROLES),
  getMyListings
);

// Public single listing
router.get("/:id", getListingById);

export default router;
