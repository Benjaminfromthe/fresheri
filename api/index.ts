// ─────────────────────────────────────────────────────────────
// Vercel Serverless Entry Point
// Wraps the Express app for Vercel's Node.js runtime.
// Vercel imports this file and calls the default export as a
// standard Node.js http.IncomingMessage / http.ServerResponse
// handler — no app.listen() needed.
// ─────────────────────────────────────────────────────────────

import "express-async-errors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import ussdRouter  from "../src/ussd/ussd.routes";
import orderRouter from "../src/orders/order.routes";

// ── Create the Express app (no prisma.$connect — Prisma connects
//    lazily on first query, which is correct for serverless)
const app = express();

// ── Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── CORS — allow the Vercel frontend to call this API
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// ── Routes
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/ussd",   ussdRouter);
app.use("/orders", orderRouter);

// ── 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ── Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// Vercel expects a default export of the Express app
export default app;
