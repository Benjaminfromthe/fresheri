// ─────────────────────────────────────────────────────────────
// Farmer Order Controller — HTTP Layer Only
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { SmsService } from "../lib/sms";
import {
  getOrdersForSeller,
  updateOrderStatus,
  getOrderByIdForSeller,
} from "./farmer.service";
import { handleServiceError } from "../lib/handle-error";
import { ErrorCode } from "../constants/errors";

export function createFarmerOrderController(db: PrismaClient, sms: SmsService) {

  // ── GET /farmer/orders?sellerId=…&page=… ────────────────────
  async function listFarmerOrders(req: Request, res: Response): Promise<void> {
    const { sellerId, page, pageSize } = req.query as Record<string, string | undefined>;

    if (!sellerId?.trim()) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, message: "sellerId is required." });
      return;
    }

    try {
      const result = await getOrdersForSeller(
        sellerId,
        db,
        page     ? Math.max(1, parseInt(page, 10))      : 1,
        pageSize ? Math.min(100, parseInt(pageSize, 10)) : 20
      );
      res.status(200).json({ data: result.orders, pagination: result.pagination });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  // ── GET /farmer/orders/:id?sellerId=… ───────────────────────
  async function getFarmerOrder(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { sellerId } = req.query as { sellerId?: string };

    if (!sellerId?.trim()) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, message: "sellerId is required." });
      return;
    }

    try {
      const order = await getOrderByIdForSeller(id, sellerId, db);
      if (!order) {
        res.status(404).json({ error: ErrorCode.ORDER_NOT_FOUND, message: `Order ${id} not found.` });
        return;
      }
      res.status(200).json({ data: order });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  // ── PATCH /farmer/orders/:id/status ─────────────────────────
  async function patchOrderStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { sellerId, action } = req.body as { sellerId?: string; action?: string };

    if (!sellerId?.trim()) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, message: "sellerId is required." });
      return;
    }
    if (!action || !["accept", "ready", "complete"].includes(action)) {
      res.status(400).json({
        error: ErrorCode.VALIDATION_ERROR,
        message: "action must be one of: accept, ready, complete.",
      });
      return;
    }

    try {
      const updated = await updateOrderStatus(
        id,
        sellerId,
        action as "accept" | "ready" | "complete",
        db,
        sms
      );
      res.status(200).json({ message: "Order status updated.", data: updated });
    } catch (err) {
      handleServiceError(err, res);
    }
  }

  return { listFarmerOrders, getFarmerOrder, patchOrderStatus };
}
