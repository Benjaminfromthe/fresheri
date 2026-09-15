import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createUssdController } from "./ussd.controller";

export function createUssdRouter(db: PrismaClient): Router {
  const router = Router();
  const ctrl   = createUssdController(db);

  /**
   * POST /ussd
   * Africa's Talking USSD callback endpoint.
   * Content-Type: application/x-www-form-urlencoded
   */
  router.post("/", ctrl.handleUSSD);

  return router;
}
