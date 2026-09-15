import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createOrderController } from "./order.controller";
import { resolveCallerMiddleware, requireRoles } from "../middleware/rbac";
import { BUYER_ROLES } from "../constants/roles";
import { SmsService } from "../lib/sms";

export function createOrderRouter(db: PrismaClient, sms: SmsService): Router {
  const router = Router();
  const ctrl = createOrderController(db, sms);

  /**
   * GET  /orders/:id/pickup-contact — buyer + auth required (before /:id)
   * POST /orders                    — place order
   * GET  /orders                    — list buyer orders
   * GET  /orders/:id                — single order
   */
  router.get(
    "/:id/pickup-contact",
    resolveCallerMiddleware(db),
    requireRoles(...BUYER_ROLES),
    ctrl.getPickupContact
  );

  router.post("/",    ctrl.createOrder);
  router.get("/",     ctrl.listOrders);
  router.get("/:id",  ctrl.getOrder);

  return router;
}
