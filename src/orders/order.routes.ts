import { Router } from "express";
import {
  createOrder,
  listOrders,
  getOrder,
  getPickupContact,
} from "./order.controller";
import {
  resolveCallerMiddleware,
  requireRoles,
  BUYER_ROLES,
} from "../middleware/rbac";

const router = Router();

/**
 * POST  /orders                    — place a new order (buyer only)
 * GET   /orders                    — list buyer orders
 * GET   /orders/:id                — get a single order
 * GET   /orders/:id/pickup-contact — disclose farmer contact for SELF_PICKUP
 *                                    (auth required, buyer only, CONFIRMED orders)
 */

// Pickup contact — must come BEFORE /:id to avoid param capture
router.get(
  "/:id/pickup-contact",
  resolveCallerMiddleware,
  requireRoles(...BUYER_ROLES),
  getPickupContact
);

router.post("/", createOrder);
router.get("/",  listOrders);
router.get("/:id", getOrder);

export default router;
