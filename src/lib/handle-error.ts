// ─────────────────────────────────────────────────────────────
// Shared HTTP Error Handler
// Single-responsibility mapper: domain error → HTTP response.
// Used by every controller — never duplicated inline.
// ─────────────────────────────────────────────────────────────

import { Response } from "express";
import {
  DomainError,
  InsufficientInventoryError,
  ErrorCode,
} from "../constants/errors";

export function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof InsufficientInventoryError) {
    res.status(409).json({
      error:     err.code,
      message:   err.message,
      available: err.available,
      requested: err.requested,
    });
    return;
  }

  if (err instanceof DomainError) {
    const status = domainErrorStatus(err.code);
    res.status(status).json({ error: err.code, message: err.message });
    return;
  }

  console.error("[Unhandled Error]", err);
  res.status(500).json({
    error:   ErrorCode.INTERNAL_ERROR,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : String(err),
  });
}

function domainErrorStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_DELIVERY_OPTION:
      return 400;
    case ErrorCode.UNAUTHENTICATED:
      return 401;
    case ErrorCode.FORBIDDEN:
    case ErrorCode.CONTACT_NOT_AVAILABLE:
    case ErrorCode.ACCOUNT_SUSPENDED:
      return 403;
    case ErrorCode.NOT_FOUND:
    case ErrorCode.LISTING_NOT_FOUND:
    case ErrorCode.ORDER_NOT_FOUND:
    case ErrorCode.BUYER_NOT_FOUND:
    case ErrorCode.USER_NOT_FOUND:
    case ErrorCode.CATEGORY_NOT_FOUND:
      return 404;
    case ErrorCode.INSUFFICIENT_INVENTORY:
      return 409;
    default:
      return 500;
  }
}
