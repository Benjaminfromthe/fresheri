import "express-async-errors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import ussdRouter from "./ussd/ussd.routes";
import orderRouter from "./orders/order.routes";
import prisma from "./lib/prisma";

// ─────────────────────────────────────────────────────────────
// App bootstrap
// ─────────────────────────────────────────────────────────────

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// ── Security headers
app.use(helmet());

// ── Request logging (short format in production, dev-coloured in development)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Body parsers
// Africa's Talking sends USSD callbacks as URL-encoded form data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

/** Health check – used by load balancers / uptime monitors */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/** USSD gateway callback */
app.use("/ussd", ussdRouter);

/** Orders API */
app.use("/orders", orderRouter);

// ─────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ─────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message, err.stack);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────

async function main() {
  // Verify DB connectivity before accepting traffic
  await prisma.$connect();
  console.log("[DB] Connected to PostgreSQL");

  const server = app.listen(PORT, () => {
    console.log(
      `[Server] Fresheri backend running on http://localhost:${PORT}`
    );
    console.log(`[USSD]   Callback endpoint  → POST http://localhost:${PORT}/ussd`);
    console.log(`[Orders] Place order        → POST http://localhost:${PORT}/orders`);
    console.log(`[Orders] List buyer orders  → GET  http://localhost:${PORT}/orders?buyerId=`);
    console.log(`[Orders] Get single order   → GET  http://localhost:${PORT}/orders/:id?buyerId=`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} received – shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("[DB] Disconnected");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[Fatal] Failed to start server:", err);
  process.exit(1);
});

export default app;
