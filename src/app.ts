// ─────────────────────────────────────────────────────────────
// Fresheri Backend — Local Dev Entry Point
// For production (Vercel), see api/index.ts.
// ─────────────────────────────────────────────────────────────

import "express-async-errors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet  from "helmet";
import morgan  from "morgan";

import prisma                from "./lib/prisma";
import { defaultSmsService } from "./lib/sms";
import { createUssdRouter }   from "./ussd/ussd.routes";
import { createOrderRouter }  from "./orders/order.routes";
import { createListingRouter } from "./listings/listing.routes";
import { ErrorCode }           from "./constants/errors";

const app  = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/ussd",     createUssdRouter(prisma));
app.use("/orders",   createOrderRouter(prisma, defaultSmsService));
app.use("/listings", createListingRouter(prisma));

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: ErrorCode.NOT_FOUND, message: "Not found." });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message, err.stack);
  res.status(500).json({
    error: ErrorCode.INTERNAL_ERROR,
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred." : err.message,
  });
});

async function main() {
  await prisma.$connect();
  console.log("[DB] Connected to PostgreSQL");

  const server = app.listen(PORT, () => {
    console.log(`[Server] Fresheri backend → http://localhost:${PORT}`);
    console.log(`[USSD]   POST http://localhost:${PORT}/ussd`);
    console.log(`[Orders] POST http://localhost:${PORT}/orders`);
    console.log(`[Listings] GET http://localhost:${PORT}/listings`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} received`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});

export default app;
