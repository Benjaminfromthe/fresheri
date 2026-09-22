// ─────────────────────────────────────────────────────────────
// Auth Service — Registration, Sign-In, Google OAuth
//
// Architecture compliance:
//   ✅ Receives PrismaClient as injected dependency
//   ✅ All Prisma queries use explicit `select` blocks
//   ✅ Domain errors from src/constants/errors.ts
//   ✅ Passwords hashed with bcrypt (cost factor 12)
//   ✅ JWT issued on success — never return passwordHash to client
// ─────────────────────────────────────────────────────────────

import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { DomainError, ErrorCode } from "../constants/errors";

// ── Config ───────────────────────────────────────────────────

const JWT_SECRET      = process.env.JWT_SECRET ?? "fresheri-dev-secret-change-in-prod";
const JWT_EXPIRES_IN  = "7d";
const BCRYPT_ROUNDS   = 12;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";

// ── Types ────────────────────────────────────────────────────

export interface SignUpInput {
  firstName:         string;
  lastName:          string;
  phone:             string;
  password:          string;
  role:              UserRole;
  // Farmer / Cooperative
  farmName?:             string;
  cooperativeRegNumber?: string;
  farmLocation?:         string;
  // Commercial Buyer
  businessName?:         string;
  businessRegNumber?:    string;
  businessAddress?:      string;
  // Logistics
  vehicleType?:          string;
  vehicleRegNumber?:     string;
  operatingRegion?:      string;
}

export interface SignInInput {
  phone:    string;
  password: string;
}

export interface AuthResult {
  token:     string;
  userId:    string;
  firstName: string;
  lastName:  string;
  role:      UserRole;
}

// ── Token helper ─────────────────────────────────────────────

function signToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ── Custom auth errors ────────────────────────────────────────

export class PhoneAlreadyExistsError extends DomainError {
  constructor() {
    super(ErrorCode.VALIDATION_ERROR, "An account with this phone number already exists.");
    this.name = "PhoneAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super(ErrorCode.UNAUTHENTICATED, "Invalid phone number or password.");
    this.name = "InvalidCredentialsError";
  }
}

export class GoogleAuthError extends DomainError {
  constructor(msg?: string) {
    super(ErrorCode.UNAUTHENTICATED, msg ?? "Google sign-in failed. Please try again.");
    this.name = "GoogleAuthError";
  }
}

// ─────────────────────────────────────────────────────────────
// signUp — creates user + role profile in a single transaction
// ─────────────────────────────────────────────────────────────

export async function signUp(
  input: SignUpInput,
  db: PrismaClient
): Promise<AuthResult> {
  // Check phone uniqueness
  const existing = await db.user.findUnique({
    where:  { phone: input.phone },
    select: { id: true },
  });
  if (existing) throw new PhoneAlreadyExistsError();

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // Map form role to DB enum (COOPERATIVE maps to COOPERATIVE)
  const dbRole: UserRole =
    input.role === "COOPERATIVE" ? UserRole.COOPERATIVE :
    input.role === "COMMERCIAL_BUYER" ? UserRole.COMMERCIAL_BUYER :
    input.role === "HOUSEHOLD_BUYER"  ? UserRole.HOUSEHOLD_BUYER  :
    input.role === "LOGISTICS_PARTNER"? UserRole.LOGISTICS_PARTNER:
    UserRole.FARMER;

  const user = await db.$transaction(async (tx) => {
    // 1. Create base user
    const newUser = await tx.user.create({
      data: {
        firstName:    input.firstName,
        lastName:     input.lastName,
        phone:        input.phone,
        passwordHash,
        role:         dbRole,
        status:       UserStatus.ACTIVE,
        isVerified:   false,
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    // 2. Create role-specific profile
    if (dbRole === UserRole.FARMER || dbRole === UserRole.COOPERATIVE) {
      await tx.farmerProfile.create({
        data: {
          userId:               newUser.id,
          farmName:             input.farmName ?? null,
          farmLocation:         input.farmLocation ?? "To be updated",
          cooperativeId:        null,
        },
        select: { id: true },
      });
    }

    if (dbRole === UserRole.COMMERCIAL_BUYER || dbRole === UserRole.HOUSEHOLD_BUYER) {
      await tx.buyerProfile.create({
        data: {
          userId:            newUser.id,
          businessName:      input.businessName ?? null,
          businessRegNumber: input.businessRegNumber ?? null,
          deliveryAddress:   input.businessAddress ?? null,
        },
        select: { id: true },
      });
    }

    if (dbRole === UserRole.LOGISTICS_PARTNER) {
      await tx.logisticsProfile.create({
        data: {
          userId:           newUser.id,
          vehicleType:      input.vehicleType ?? null,
          vehicleRegNumber: input.vehicleRegNumber ?? null,
          operatingRegions: input.operatingRegion ? [input.operatingRegion] : [],
        },
        select: { id: true },
      });
    }

    return newUser;
  });

  return {
    token:     signToken(user.id, user.role),
    userId:    user.id,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
  };
}

// ─────────────────────────────────────────────────────────────
// signIn — phone + password authentication
// ─────────────────────────────────────────────────────────────

export async function signIn(
  input: SignInInput,
  db: PrismaClient
): Promise<AuthResult> {
  const user = await db.user.findUnique({
    where:  { phone: input.phone },
    select: {
      id: true, firstName: true, lastName: true,
      role: true, status: true, passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) throw new InvalidCredentialsError();

  if (user.status === UserStatus.SUSPENDED) {
    throw new DomainError(ErrorCode.ACCOUNT_SUSPENDED);
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) throw new InvalidCredentialsError();

  // Update lastLoginAt non-blocking
  db.user.update({
    where:  { id: user.id },
    data:   { lastLoginAt: new Date() },
    select: { id: true },
  }).catch(() => undefined);

  return {
    token:     signToken(user.id, user.role),
    userId:    user.id,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
  };
}

// ─────────────────────────────────────────────────────────────
// googleAuth — verify Google ID token, upsert user
// ─────────────────────────────────────────────────────────────

export async function googleAuth(
  idToken: string,
  db: PrismaClient
): Promise<AuthResult> {
  if (!GOOGLE_CLIENT_ID) {
    throw new GoogleAuthError("Google Sign-In is not configured on this server.");
  }

  // Use access_token to fetch user info from Google's userinfo endpoint
  let googleUser: { email?: string; given_name?: string; family_name?: string; picture?: string };
  try {
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!infoRes.ok) throw new Error("Failed to fetch Google user info");
    googleUser = await infoRes.json() as typeof googleUser;
  } catch {
    throw new GoogleAuthError();
  }

  if (!googleUser?.email) throw new GoogleAuthError("Google account has no email address.");

  const email     = googleUser.email;
  const firstName = googleUser.given_name  ?? email.split("@")[0];
  const lastName  = googleUser.family_name ?? "";
  const picture   = googleUser.picture     ?? null;

  // Upsert by email — if user doesn't exist, create as HOUSEHOLD_BUYER
  let user = await db.user.findUnique({
    where:  { email },
    select: { id: true, firstName: true, lastName: true, role: true, status: true },
  });

  if (!user) {
    // Auto-register via Google — need a placeholder phone (email-derived)
    const placeholderPhone = `google:${email}`;

    user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          phone:           placeholderPhone,
          firstName,
          lastName,
          role:            UserRole.HOUSEHOLD_BUYER,
          status:          UserStatus.ACTIVE,
          isVerified:      true, // Google-verified email
          profileImageUrl: picture,
        },
        select: { id: true, firstName: true, lastName: true, role: true, status: true },
      });

      await tx.buyerProfile.create({
        data: { userId: newUser.id },
        select: { id: true },
      });

      return newUser;
    });
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new DomainError(ErrorCode.ACCOUNT_SUSPENDED);
  }

  return {
    token:     signToken(user.id, user.role),
    userId:    user.id,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
  };
}
