// ─────────────────────────────────────────────────────────────
// Auth Controller — HTTP Layer Only
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  signUp, signIn, googleAuth,
  PhoneAlreadyExistsError, InvalidCredentialsError, GoogleAuthError,
} from "./auth.service";
import { handleServiceError } from "../lib/handle-error";
import { ErrorCode }          from "../constants/errors";

export function createAuthController(db: PrismaClient) {

  // ── POST /auth/signup ────────────────────────────────────────
  async function signup(req: Request, res: Response): Promise<void> {
    const {
      firstName, lastName, phone, password, role,
      farmName, cooperativeRegNumber, farmLocation,
      businessName, businessRegNumber, businessAddress,
      vehicleType, vehicleRegNumber, operatingRegion,
    } = req.body as Record<string, string | undefined>;

    const errors: string[] = [];
    if (!firstName?.trim()) errors.push("firstName is required.");
    if (!lastName?.trim())  errors.push("lastName is required.");
    if (!phone?.trim())     errors.push("phone is required.");
    if (!password || password.length < 8) errors.push("password must be at least 8 characters.");
    if (!role?.trim())      errors.push("role is required.");

    const validRoles = ["FARMER","COOPERATIVE","COMMERCIAL_BUYER","HOUSEHOLD_BUYER","LOGISTICS_PARTNER"];
    if (role && !validRoles.includes(role)) errors.push(`role must be one of: ${validRoles.join(", ")}.`);

    if (errors.length > 0) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, messages: errors });
      return;
    }

    try {
      const result = await signUp({
        firstName: firstName!,
        lastName:  lastName!,
        phone:     phone!,
        password:  password!,
        role:      role as UserRole,
        farmName, cooperativeRegNumber, farmLocation,
        businessName, businessRegNumber, businessAddress,
        vehicleType, vehicleRegNumber, operatingRegion,
      }, db);

      res.status(201).json({ message: "Account created successfully.", data: result });
    } catch (err) {
      if (err instanceof PhoneAlreadyExistsError) {
        res.status(409).json({ error: err.code, message: err.message });
        return;
      }
      handleServiceError(err, res);
    }
  }

  // ── POST /auth/signin ────────────────────────────────────────
  async function signin(req: Request, res: Response): Promise<void> {
    const { phone, password } = req.body as { phone?: string; password?: string };

    if (!phone?.trim() || !password?.trim()) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, message: "phone and password are required." });
      return;
    }

    try {
      const result = await signIn({ phone, password }, db);
      res.status(200).json({ message: "Signed in successfully.", data: result });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        res.status(401).json({ error: err.code, message: err.message });
        return;
      }
      handleServiceError(err, res);
    }
  }

  // ── POST /auth/google ────────────────────────────────────────
  async function google(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken?.trim()) {
      res.status(400).json({ error: ErrorCode.VALIDATION_ERROR, message: "idToken is required." });
      return;
    }

    try {
      const result = await googleAuth(idToken, db);
      res.status(200).json({ message: "Google sign-in successful.", data: result });
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        res.status(401).json({ error: err.code, message: err.message });
        return;
      }
      handleServiceError(err, res);
    }
  }

  // ── GET /auth/me — return current user from JWT ──────────────
  async function me(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: ErrorCode.UNAUTHENTICATED, message: "No token provided." });
      return;
    }

    const token = authHeader.slice(7);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jwt = require("jsonwebtoken");
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? "fresheri-dev-secret-change-in-prod") as { sub: string };

      const user = await db.user.findUnique({
        where:  { id: payload.sub },
        select: {
          id: true, firstName: true, lastName: true,
          role: true, status: true, phone: true, email: true,
          isVerified: true, profileImageUrl: true,
        },
      });

      if (!user) {
        res.status(401).json({ error: ErrorCode.USER_NOT_FOUND, message: "User not found." });
        return;
      }

      res.status(200).json({ data: user });
    } catch {
      res.status(401).json({ error: ErrorCode.UNAUTHENTICATED, message: "Invalid or expired token." });
    }
  }

  return { signup, signin, google, me };
}
