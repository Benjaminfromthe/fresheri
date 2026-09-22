import { Router }      from "express";
import { PrismaClient } from "@prisma/client";
import { createAuthController } from "./auth.controller";

export function createAuthRouter(db: PrismaClient): Router {
  const router = Router();
  const ctrl   = createAuthController(db);

  /**
   * POST /auth/signup  — create account → returns JWT
   * POST /auth/signin  — phone + password → returns JWT
   * POST /auth/google  — Google ID token  → returns JWT
   * GET  /auth/me      — Bearer token     → returns user profile
   */
  router.post("/signup", ctrl.signup);
  router.post("/signin", ctrl.signin);
  router.post("/google", ctrl.google);
  router.get("/me",      ctrl.me);

  return router;
}
