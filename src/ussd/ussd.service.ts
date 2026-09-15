// ─────────────────────────────────────────────────────────────
// USSD Service — Business Logic & Data Access Layer
//
// Architecture compliance:
//   ✅ Receives PrismaClient as injected dependency
//   ✅ All Prisma queries use explicit `select` blocks
//   ✅ Config values from src/constants/config.ts
//   ✅ Enum values from @prisma/client — no raw strings
//   ✅ No singleton prisma import
// ─────────────────────────────────────────────────────────────

import {
  PrismaClient,
  DeliveryOption,
  ListingStatus,
  QuantityUnit,
  USSDFlowType,
  USSDSessionStatus,
  UserRole,
} from "@prisma/client";
import {
  USSD_SESSION_TTL_MINUTES,
  DEFAULT_CATEGORY_SLUG,
  DEFAULT_CATEGORY_NAME,
  USSD_DEFAULT_FARM_LOCATION,
} from "../constants/config";
import { USSDStep, USSDSessionData, HarvestDraft } from "./ussd.types";

// ── Session management ───────────────────────────────────────

export async function loadOrCreateSession(
  sessionId: string,
  phoneNumber: string,
  serviceCode: string,
  db: PrismaClient,
  networkOperator?: string
) {
  const expiresAt = new Date(Date.now() + USSD_SESSION_TTL_MINUTES * 60 * 1000);

  const existing = await db.uSSDSession.findUnique({
    where:  { sessionId },
    select: {
      id:          true,
      sessionId:   true,
      phoneNumber: true,
      userId:      true,
      flowType:    true,
      status:      true,
      currentStep: true,
      sessionData: true,
      inputHistory:true,
      serviceCode: true,
      networkOperator: true,
      startedAt:   true,
      expiresAt:   true,
      completedAt: true,
    },
  });

  if (existing && existing.status === USSDSessionStatus.ACTIVE) {
    return existing;
  }

  return db.uSSDSession.create({
    data: {
      sessionId,
      phoneNumber,
      flowType:    USSDFlowType.HARVEST_PUBLISH,
      status:      USSDSessionStatus.ACTIVE,
      currentStep: USSDStep.LANGUAGE_SELECT,
      sessionData: { step: USSDStep.LANGUAGE_SELECT } satisfies USSDSessionData,
      inputHistory: [],
      serviceCode,
      networkOperator: networkOperator ?? null,
      expiresAt,
    },
    select: {
      id:          true,
      sessionId:   true,
      phoneNumber: true,
      userId:      true,
      flowType:    true,
      status:      true,
      currentStep: true,
      sessionData: true,
      inputHistory:true,
      serviceCode: true,
      networkOperator: true,
      startedAt:   true,
      expiresAt:   true,
      completedAt: true,
    },
  });
}

export async function updateSessionStep(
  sessionId: string,
  step: USSDStep,
  data: USSDSessionData,
  inputHistory: object[],
  db: PrismaClient
): Promise<void> {
  await db.uSSDSession.update({
    where: { sessionId },
    data:  {
      currentStep:  step,
      sessionData:  data as object,
      inputHistory: inputHistory,
    },
    select: { id: true },
  });
}

export async function finaliseSession(
  sessionId: string,
  status: USSDSessionStatus,
  flowType: USSDFlowType,
  data: USSDSessionData,
  inputHistory: object[],
  db: PrismaClient
): Promise<void> {
  await db.uSSDSession.update({
    where: { sessionId },
    data:  {
      status,
      flowType,
      currentStep:  data.step,
      sessionData:  data as object,
      inputHistory: inputHistory,
      completedAt:  new Date(),
    },
    select: { id: true },
  });
}

export async function markSessionFailed(
  sessionId: string,
  db: PrismaClient
): Promise<void> {
  await db.uSSDSession.updateMany({
    where: { sessionId, status: USSDSessionStatus.ACTIVE },
    data:  { status: USSDSessionStatus.FAILED },
  });
}

// ── Harvest listing persistence ──────────────────────────────

export async function saveHarvestListing(
  phoneNumber: string,
  draft: HarvestDraft,
  language: string,
  db: PrismaClient
): Promise<void> {
  // Resolve or auto-create the seller
  const existingUser = await db.user.findUnique({
    where:  { phone: phoneNumber },
    select: { id: true },
  });

  const sellerId = existingUser?.id ?? await createMinimalFarmer(phoneNumber, language, db);

  await persistListing(sellerId, draft, db);
}

async function createMinimalFarmer(
  phoneNumber: string,
  language: string,
  db: PrismaClient
): Promise<string> {
  const user = await db.user.create({
    data: {
      phone:             phoneNumber,
      firstName:         "USSD",
      lastName:          "Farmer",
      role:              UserRole.FARMER,
      preferredLanguage: language,
    },
    select: { id: true },
  });
  return user.id;
}

async function persistListing(
  sellerId: string,
  draft: HarvestDraft,
  db: PrismaClient
): Promise<void> {
  // Resolve or create default category
  let category = await db.produceCategory.findFirst({
    where:  { slug: DEFAULT_CATEGORY_SLUG },
    select: { id: true },
  });

  if (!category) {
    category = await db.produceCategory.create({
      data:   { name: DEFAULT_CATEGORY_NAME, slug: DEFAULT_CATEGORY_SLUG },
      select: { id: true },
    });
  }

  const cropLabel = draft.cropName ?? "Unknown";
  const qty       = draft.quantityKg ?? 0;
  const price     = draft.unitPrice ?? 0;

  await db.produceListing.create({
    data: {
      sellerId,
      categoryId:        category.id,
      title:             `${cropLabel} – ${qty}kg`,
      produceName:       cropLabel,
      totalQuantity:     qty,
      availableQuantity: qty,
      unit:              QuantityUnit.KG,
      minimumOrderQty:   1,
      unitPrice:         price,
      harvestDate:       new Date(),
      farmLocation:      USSD_DEFAULT_FARM_LOCATION,
      deliveryOptions:   [DeliveryOption.SELF_PICKUP],
      status:            ListingStatus.ACTIVE,
    },
    select: { id: true },
  });
}
