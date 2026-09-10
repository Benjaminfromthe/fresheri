// ─────────────────────────────────────────────────────────────
// RBAC Middleware & Role-Guard Helpers
// ─────────────────────────────────────────────────────────────
//
// Architecture note:
// Until full JWT auth is wired, identity is passed as the
// `x-buyer-id` / `x-user-role` request headers (set by the
// frontend after login).  Every guard validates these and
// attaches a typed `req.caller` object so downstream handlers
// never touch raw headers.
//
// When JWT middleware is added later, replace the header reads
// with `req.user` from the decoded token — the guards below
// stay identical.
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";

// ── Extend Express Request with typed caller context ────────

export interface CallerContext {
  userId: string;
  role: UserRole;
  phone?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      caller?: CallerContext;
    }
  }
}

// ── Buyer roles ──────────────────────────────────────────────

export const BUYER_ROLES: UserRole[] = [
  UserRole.COMMERCIAL_BUYER,
  UserRole.HOUSEHOLD_BUYER,
];

export const SELLER_ROLES: UserRole[] = [
  UserRole.FARMER,
  UserRole.COOPERATIVE,
];

// ─────────────────────────────────────────────────────────────
// resolveCallerMiddleware
// Reads x-user-id + x-user-role headers, validates them against
// the DB, and attaches req.caller.  Must run before any guard.
// ─────────────────────────────────────────────────────────────

export async function resolveCallerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.headers["x-user-id"] as string | undefined;
  const role   = req.headers["x-user-role"] as string | undefined;

  if (!userId || !role) {
    res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "Missing x-user-id or x-user-role header.",
    });
    return;
  }

  // Validate role is a known enum value
  if (!Object.values(UserRole).includes(role as UserRole)) {
    res.status(401).json({
      error: "UNAUTHENTICATED",
      message: `Unknown role: ${role}`,
    });
    return;
  }

  // Lightweight DB check — only fetch id + role + phone (no PII beyond phone)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, phone: true, status: true },
  });

  if (!user) {
    res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "User not found.",
    });
    return;
  }

  if (user.status === "SUSPENDED") {
    res.status(403).json({
      error: "FORBIDDEN",
      message: "Account is suspended.",
    });
    return;
  }

  // Trust the DB role, not the header role (header is convenience only)
  req.caller = { userId: user.id, role: user.role, phone: user.phone };
  next();
}

// ─────────────────────────────────────────────────────────────
// requireRoles — factory that returns a middleware accepting
// only the listed roles.
//
// Usage:
//   router.post("/orders/create",
//     requireRoles(BUYER_ROLES),
//     createOrderHandler
//   );
// ─────────────────────────────────────────────────────────────

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.caller) {
      res.status(401).json({ error: "UNAUTHENTICATED", message: "No caller context." });
      return;
    }

    if (!allowed.includes(req.caller.role)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Role '${req.caller.role}' is not permitted to perform this action.`,
        allowed,
      });
      return;
    }

    next();
  };
}

// ─────────────────────────────────────────────────────────────
// requireOwnership — verifies req.caller.userId matches
// the resourceOwnerId derived by ownerFn.
//
// Usage:
//   router.get("/orders/:id",
//     requireOwnership(async (req) => {
//       const o = await getOrderById(req.params.id);
//       return o?.buyerId ?? null;
//     })
//   );
// ─────────────────────────────────────────────────────────────

export function requireOwnership(
  ownerFn: (req: Request) => Promise<string | null>
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.caller) {
      res.status(401).json({ error: "UNAUTHENTICATED", message: "No caller context." });
      return;
    }

    // ADMINs bypass ownership checks
    if (req.caller.role === UserRole.ADMIN) {
      next();
      return;
    }

    const ownerId = await ownerFn(req);
    if (!ownerId) {
      res.status(404).json({ error: "NOT_FOUND", message: "Resource not found." });
      return;
    }

    if (ownerId !== req.caller.userId) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "You do not have access to this resource.",
      });
      return;
    }

    next();
  };
}
