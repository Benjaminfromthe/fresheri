import { Router } from "express";
import { createOrder, listOrders, getOrder } from "./order.controller";

const router = Router();

/**
 * POST   /orders        — place a new order
 * GET    /orders        — list buyer orders  (?buyerId=&page=&pageSize=)
 * GET    /orders/:id    — get a single order (?buyerId=)
 */
router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);

export default router;
