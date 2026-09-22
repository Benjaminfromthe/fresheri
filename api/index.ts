// ─────────────────────────────────────────────────────────────
// Vercel Serverless Entry Point — Dependency Injection Root
//
// This is the ONLY file that imports singletons (prisma, sms).
// All routers receive their dependencies as constructor params.
// ─────────────────────────────────────────────────────────────

import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import prisma               from "../src/lib/prisma";
import { defaultSmsService } from "../src/lib/sms";
import { createUssdRouter }   from "../src/ussd/ussd.routes";
import { createOrderRouter }  from "../src/orders/order.routes";
import { createListingRouter } from "../src/listings/listing.routes";
import { createAuthRouter }   from "../src/auth/auth.routes";
import { ErrorCode }           from "../src/constants/errors";

// ── Bootstrap app ────────────────────────────────────────────

const app = express();

app.use(helmet());
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── CORS ─────────────────────────────────────────────────────

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin",
    process.env.FRONTEND_URL ?? "*");
  res.setHeader("Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers",
    "Content-Type,Authorization,x-user-id,x-user-role");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

// ── Health ───────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes — inject singletons once here ─────────────────────

app.use("/ussd",     createUssdRouter(prisma));
app.use("/orders",   createOrderRouter(prisma, defaultSmsService));
app.use("/listings", createListingRouter(prisma));
app.use("/auth",     createAuthRouter(prisma));

// ── 404 ──────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: ErrorCode.NOT_FOUND, message: "Not found." });
});

// ── Global error handler ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({
    error: ErrorCode.INTERNAL_ERROR,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message,
  });
});

export default app;
