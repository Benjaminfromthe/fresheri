// ─────────────────────────────────────────────────────────────
// RBAC Middleware & Role-Guard Helpers
//
// Architecture compliance:
//   ✅ Receives PrismaClient as injected dependency
//   ✅ Error codes from src/constants/errors.ts
//   ✅ Role arrays from src/constants/roles.ts
//   ✅ No singleton prisma import
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { ErrorCode } from "../constants/errors";

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

// ─────────────────────────────────────────────────────────────
// resolveCallerMiddleware — factory that injects db
// Validates x-user-id + x-user-role headers against the DB,
// attaches req.caller.
// ─────────────────────────────────────────────────────────────

export function resolveCallerMiddleware(db: PrismaClient) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const userId = req.headers["x-user-id"] as string | undefined;
    const role   = req.headers["x-user-role"] as string | undefined;

    if (!userId || !role) {
      res.status(401).json({
        error:   ErrorCode.UNAUTHENTICATED,
        message: "Missing x-user-id or x-user-role header.",
      });
      return;
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(401).json({
        error:   ErrorCode.UNAUTHENTICATED,
        message: `Unknown role: ${role}`,
      });
      return;
    }

    const user = await db.user.findUnique({
      where:  { id: userId },
      select: { id: true, role: true, phone: true, status: true },
    });

    if (!user) {
      res.status(401).json({
        error:   ErrorCode.UNAUTHENTICATED,
        message: "User not found.",
      });
      return;
    }

    if (user.status === UserStatus.SUSPENDED) {
      res.status(403).json({
        error:   ErrorCode.ACCOUNT_SUSPENDED,
        message: "This account has been suspended.",
      });
      return;
    }

    // Trust the DB role — never the header value
    req.caller = { userId: user.id, role: user.role, phone: user.phone };
    next();
  };
}

// ─────────────────────────────────────────────────────────────
// requireRoles — factory returning role-guard middleware
// ─────────────────────────────────────────────────────────────

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.caller) {
      res.status(401).json({ error: ErrorCode.UNAUTHENTICATED, message: "No caller context." });
      return;
    }
    if (!allowed.includes(req.caller.role)) {
      res.status(403).json({
        error:   ErrorCode.FORBIDDEN,
        message: `Role '${req.caller.role}' is not permitted to perform this action.`,
        allowed,
      });
      return;
    }
    next();
  };
}

// ─────────────────────────────────────────────────────────────
// requireOwnership — verifies caller owns the resource
// ADMIN role bypasses this check.
// ─────────────────────────────────────────────────────────────

export function requireOwnership(
  ownerFn: (req: Request) => Promise<string | null>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.caller) {
      res.status(401).json({ error: ErrorCode.UNAUTHENTICATED, message: "No caller context." });
      return;
    }
    if (req.caller.role === UserRole.ADMIN) { next(); return; }

    const ownerId = await ownerFn(req);
    if (!ownerId) {
      res.status(404).json({ error: ErrorCode.NOT_FOUND, message: "Resource not found." });
      return;
    }
    if (ownerId !== req.caller.userId) {
      res.status(403).json({ error: ErrorCode.FORBIDDEN, message: "You do not have access to this resource." });
      return;
    }
    next();
  };
}
