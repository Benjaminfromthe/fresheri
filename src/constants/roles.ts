// ─────────────────────────────────────────────────────────────
// Centralized Role Groupings
// Import from here instead of duplicating role arrays.
// ─────────────────────────────────────────────────────────────

import { UserRole } from "@prisma/client";

/** Roles that are permitted to browse listings and place orders */
export const BUYER_ROLES: UserRole[] = [
  UserRole.COMMERCIAL_BUYER,
  UserRole.HOUSEHOLD_BUYER,
];

/** Roles that are permitted to publish listings */
export const SELLER_ROLES: UserRole[] = [
  UserRole.FARMER,
  UserRole.COOPERATIVE,
];

/** Roles with full platform access */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.ADMIN,
];

/** Roles that can be assigned delivery tasks */
export const LOGISTICS_ROLES: UserRole[] = [
  UserRole.LOGISTICS_PARTNER,
];

/** All non-admin roles */
export const ALL_USER_ROLES: UserRole[] = [
  ...BUYER_ROLES,
  ...SELLER_ROLES,
  ...LOGISTICS_ROLES,
];
