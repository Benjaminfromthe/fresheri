// ─────────────────────────────────────────────────────────────
// Centralized Domain Error Codes & Messages
// All error strings used in controllers and services live here.
// ─────────────────────────────────────────────────────────────

export const ErrorCode = {
  // 400 Validation
  VALIDATION_ERROR:         "VALIDATION_ERROR",
  INVALID_DELIVERY_OPTION:  "INVALID_DELIVERY_OPTION",

  // 401 Auth
  UNAUTHENTICATED:          "UNAUTHENTICATED",

  // 403 Authorization
  FORBIDDEN:                "FORBIDDEN",
  CONTACT_NOT_AVAILABLE:    "CONTACT_NOT_AVAILABLE",
  ACCOUNT_SUSPENDED:        "ACCOUNT_SUSPENDED",

  // 404 Not Found
  NOT_FOUND:                "NOT_FOUND",
  LISTING_NOT_FOUND:        "LISTING_NOT_FOUND",
  ORDER_NOT_FOUND:          "ORDER_NOT_FOUND",
  BUYER_NOT_FOUND:          "BUYER_NOT_FOUND",
  USER_NOT_FOUND:           "USER_NOT_FOUND",
  CATEGORY_NOT_FOUND:       "CATEGORY_NOT_FOUND",

  // 409 Conflict
  INSUFFICIENT_INVENTORY:   "INSUFFICIENT_INVENTORY",

  // 500 Internal
  INTERNAL_ERROR:           "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ── Human-readable default messages ─────────────────────────

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]:
    "One or more input fields are invalid.",
  [ErrorCode.INVALID_DELIVERY_OPTION]:
    "The selected delivery option is not supported for this listing.",
  [ErrorCode.UNAUTHENTICATED]:
    "Authentication is required to perform this action.",
  [ErrorCode.FORBIDDEN]:
    "You do not have permission to perform this action.",
  [ErrorCode.CONTACT_NOT_AVAILABLE]:
    "Pickup contact is only available for confirmed SELF_PICKUP orders.",
  [ErrorCode.ACCOUNT_SUSPENDED]:
    "This account has been suspended.",
  [ErrorCode.NOT_FOUND]:
    "The requested resource was not found.",
  [ErrorCode.LISTING_NOT_FOUND]:
    "Listing not found or is not available for purchase.",
  [ErrorCode.ORDER_NOT_FOUND]:
    "Order not found.",
  [ErrorCode.BUYER_NOT_FOUND]:
    "Buyer not found.",
  [ErrorCode.USER_NOT_FOUND]:
    "User not found.",
  [ErrorCode.CATEGORY_NOT_FOUND]:
    "Category not found.",
  [ErrorCode.INSUFFICIENT_INVENTORY]:
    "Requested quantity exceeds available stock.",
  [ErrorCode.INTERNAL_ERROR]:
    "An unexpected error occurred. Please try again later.",
};

// ── Typed domain error base class ────────────────────────────

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string
  ) {
    super(message ?? ErrorMessage[code]);
    this.name = code;
  }
}

// ── Concrete domain errors ────────────────────────────────────

export class InsufficientInventoryError extends DomainError {
  constructor(
    public readonly available: number,
    public readonly requested: number
  ) {
    super(
      ErrorCode.INSUFFICIENT_INVENTORY,
      `Insufficient inventory: ${available}kg available, ${requested}kg requested.`
    );
  }
}

export class ListingNotFoundError extends DomainError {
  constructor(listingId: string) {
    super(ErrorCode.LISTING_NOT_FOUND, `Listing ${listingId} not found.`);
  }
}

export class OrderNotFoundError extends DomainError {
  constructor(orderId: string) {
    super(ErrorCode.ORDER_NOT_FOUND, `Order ${orderId} not found.`);
  }
}

export class BuyerNotFoundError extends DomainError {
  constructor(buyerId: string) {
    super(ErrorCode.BUYER_NOT_FOUND, `Buyer ${buyerId} not found.`);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(ErrorCode.USER_NOT_FOUND, `User not found: ${identifier}`);
  }
}

export class InvalidDeliveryOptionError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.INVALID_DELIVERY_OPTION, message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message?: string) {
    super(ErrorCode.FORBIDDEN, message);
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message?: string) {
    super(ErrorCode.UNAUTHENTICATED, message);
  }
}
