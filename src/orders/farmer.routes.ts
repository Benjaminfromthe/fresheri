import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { SmsService } from "../lib/sms";
import { createFarmerOrderController } from "./farmer.controller";

export function createFarmerOrderRouter(db: PrismaClient, sms: SmsService): Router {
  const router = Router();
  const ctrl   = createFarmerOrderController(db, sms);

  router.get("/",           ctrl.listFarmerOrders);
  router.get("/:id",        ctrl.getFarmerOrder);
  router.patch("/:id/status", ctrl.patchOrderStatus);

  return router;
}
