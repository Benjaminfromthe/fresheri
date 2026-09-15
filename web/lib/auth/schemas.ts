// ─────────────────────────────────────────────────────────────
// Auth Zod Schemas
// All validation rules live here — controllers and forms import
// from this file only, never inline Zod definitions.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Shared field rules ────────────────────────────────────────

const phone = z
  .string()
  .min(1, "errRequired")
  .regex(/^\+?[1-9]\d{7,14}$/, "errPhoneInvalid");

const password = z
  .string()
  .min(8, "errPasswordMin");

const firstName = z.string().min(2, "errFirstNameMin");
const lastName  = z.string().min(2, "errLastNameMin");

// ── Sign-in schema ────────────────────────────────────────────

export const signInSchema = z.object({
  phone:      phone,
  password:   password,
  rememberMe: z.boolean().optional(),
});

export type SignInValues = z.infer<typeof signInSchema>;

// ── Role enum (mirrors Prisma UserRole) ───────────────────────

export const AuthRole = {
  FARMER:           "FARMER",
  COOPERATIVE:      "COOPERATIVE",
  COMMERCIAL_BUYER: "COMMERCIAL_BUYER",
  HOUSEHOLD_BUYER:  "HOUSEHOLD_BUYER",
  LOGISTICS_PARTNER:"LOGISTICS_PARTNER",
} as const;

export type AuthRole = (typeof AuthRole)[keyof typeof AuthRole];

// ── Base sign-up fields (shared by every role) ────────────────

const baseSignUpFields = {
  firstName,
  lastName,
  phone,
  password,
  confirmPassword: z.string().min(1, "errRequired"),
  role: z.enum([
    "FARMER",
    "COOPERATIVE",
    "COMMERCIAL_BUYER",
    "HOUSEHOLD_BUYER",
    "LOGISTICS_PARTNER",
  ]),
};

// ── Role-specific extra fields ────────────────────────────────

const farmerExtra = {
  farmName:             z.string().min(2, "errRequired"),
  cooperativeRegNumber: z.string().optional(),
  farmLocation:         z.string().min(2, "errRequired"),
  farmSizeHa:           z.string().optional(),
};

const commercialExtra = {
  businessName:      z.string().min(2, "errBusinessNameMin"),
  businessRegNumber: z.string().optional(),
  businessAddress:   z.string().min(4, "errRequired"),
};

const householdExtra = {
  deliveryAddress: z.string().optional(),
};

const logisticsExtra = {
  vehicleType:      z.string().min(2, "errRequired"),
  vehicleRegNumber: z.string().optional(),
  operatingRegion:  z.string().min(2, "errRequired"),
};

// ── Per-role schemas with password-match refinement ───────────

function withPasswordMatch<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((data, ctx) => {
    const d = data as { password?: string; confirmPassword?: string };
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        message: "errPasswordMismatch",
        path:    ["confirmPassword"],
      });
    }
  });
}

export const farmerSignUpSchema = withPasswordMatch({
  ...baseSignUpFields,
  ...farmerExtra,
});

export const commercialSignUpSchema = withPasswordMatch({
  ...baseSignUpFields,
  ...commercialExtra,
});

export const householdSignUpSchema = withPasswordMatch({
  ...baseSignUpFields,
  ...householdExtra,
});

export const logisticsSignUpSchema = withPasswordMatch({
  ...baseSignUpFields,
  ...logisticsExtra,
});

export type FarmerSignUpValues    = z.infer<typeof farmerSignUpSchema>;
export type CommercialSignUpValues= z.infer<typeof commercialSignUpSchema>;
export type HouseholdSignUpValues = z.infer<typeof householdSignUpSchema>;
export type LogisticsSignUpValues = z.infer<typeof logisticsSignUpSchema>;

// ── Union type covering all sign-up payloads ──────────────────

export type SignUpValues =
  | FarmerSignUpValues
  | CommercialSignUpValues
  | HouseholdSignUpValues
  | LogisticsSignUpValues;

// ── Helper: pick the right schema for a given role ────────────

export function getSignUpSchema(role: AuthRole) {
  switch (role) {
    case AuthRole.FARMER:
    case AuthRole.COOPERATIVE:
      return farmerSignUpSchema;
    case AuthRole.COMMERCIAL_BUYER:
      return commercialSignUpSchema;
    case AuthRole.HOUSEHOLD_BUYER:
      return householdSignUpSchema;
    case AuthRole.LOGISTICS_PARTNER:
      return logisticsSignUpSchema;
  }
}

// ── Password strength scorer (0-4) ───────────────────────────

export function scorePassword(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (pwd.length === 0) return 0;
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}
