import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createListingController } from "./listing.controller";
import { resolveCallerMiddleware, requireRoles } from "../middleware/rbac";
import { SELLER_ROLES } from "../constants/roles";

export function createListingRouter(db: PrismaClient): Router {
  const router = Router();
  const ctrl   = createListingController(db);

  /**
   * GET /listings          — public browse (no auth)
   * GET /listings/mine     — seller's own listings (auth required)
   * GET /listings/:id      — public single listing (no auth)
   */
  router.get("/",     ctrl.listPublicListings);
  router.get("/mine", resolveCallerMiddleware(db), requireRoles(...SELLER_ROLES), ctrl.getMyListings);
  router.get("/:id",  ctrl.getListingById);

  return router;
}
