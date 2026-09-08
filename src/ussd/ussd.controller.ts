import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getMenus } from "./ussd.menus";
import {
  ATUSSDPayload,
  CropChoice,
  CROP_NAMES,
  CROP_NAMES_RW,
  HarvestDraft,
  Language,
  USSDResponse,
  USSDSessionData,
  USSDStep,
} from "./ussd.types";
import {
  DeliveryOption,
  ListingStatus,
  QuantityUnit,
  USSDFlowType,
  USSDSessionStatus,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Session TTL in minutes (default 5) */
const SESSION_TTL_MINUTES = Number(process.env.USSD_SESSION_TTL_MINUTES ?? 5);

/** Strip the CON/END prefix that our menu strings carry and return the raw type */
function parseMenuPrefix(raw: string): { type: "CON" | "END"; message: string } {
  if (raw.startsWith("CON ")) return { type: "CON", message: raw.slice(4) };
  if (raw.startsWith("END ")) return { type: "END", message: raw.slice(4) };
  return { type: "CON", message: raw };
}

/** Split Africa's Talking's cumulative text input into individual steps */
function splitInputs(text: string): string[] {
  return text === "" ? [] : text.split("*");
}

/** Resolve a crop name from its menu choice code */
function cropName(choice: CropChoice, lang: Language): string {
  return lang === "rw" ? CROP_NAMES_RW[choice] : CROP_NAMES[choice];
}

/** Validate that a string is a positive finite number */
function isPositiveNumber(val: string): boolean {
  const n = Number(val);
  return !isNaN(n) && isFinite(n) && n > 0;
}

// ─────────────────────────────────────────────────────────────
// Session helpers (Prisma)
// ─────────────────────────────────────────────────────────────

async function loadOrCreateSession(
  sessionId: string,
  phoneNumber: string,
  serviceCode: string,
  networkOperator?: string
) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);

  // Try to find an existing ACTIVE session
  const existing = await prisma.uSSDSession.findUnique({
    where: { sessionId },
  });

  if (existing && existing.status === USSDSessionStatus.ACTIVE) {
    return existing;
  }

  // Create a fresh session
  return prisma.uSSDSession.create({
    data: {
      sessionId,
      phoneNumber,
      flowType: USSDFlowType.HARVEST_PUBLISH, // default; updated when user chooses
      status: USSDSessionStatus.ACTIVE,
      currentStep: USSDStep.LANGUAGE_SELECT,
      sessionData: { step: USSDStep.LANGUAGE_SELECT } satisfies USSDSessionData,
      inputHistory: [],
      serviceCode,
      networkOperator: networkOperator ?? null,
      expiresAt,
    },
  });
}

async function persistStep(
  sessionId: string,
  step: USSDStep,
  data: USSDSessionData,
  input: string
) {
  await prisma.uSSDSession.update({
    where: { sessionId },
    data: {
      currentStep: step,
      sessionData: data as object,
      // Append to inputHistory array via raw JSON concat
      inputHistory: {
        // Prisma doesn't support array push on Json, so we fetch + append in controller
      } as never,
    },
  });
}

async function finaliseSession(
  sessionId: string,
  status: USSDSessionStatus
) {
  await prisma.uSSDSession.update({
    where: { sessionId },
    data: {
      status,
      completedAt: new Date(),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Persist completed harvest listing to ProduceListing
// ─────────────────────────────────────────────────────────────

async function saveHarvestListing(
  phoneNumber: string,
  draft: HarvestDraft,
  lang: Language
): Promise<void> {
  // Resolve the seller by phone number
  const seller = await prisma.user.findUnique({ where: { phone: phoneNumber } });
  if (!seller) {
    // Auto-create a minimal FARMER user so the harvest isn't lost
    // Full profile will be completed via app/web later
    const newUser = await prisma.user.create({
      data: {
        phone: phoneNumber,
        firstName: "USSD",
        lastName: "Farmer",
        role: "FARMER",
        preferredLanguage: lang,
      },
    });
    await persistListing(newUser.id, draft);
    return;
  }
  await persistListing(seller.id, draft);
}

async function persistListing(sellerId: string, draft: HarvestDraft) {
  // Resolve or create a default "Uncategorised" category as fallback
  let category = await prisma.produceCategory.findFirst({
    where: { slug: "uncategorised" },
  });
  if (!category) {
    category = await prisma.produceCategory.create({
      data: { name: "Uncategorised", slug: "uncategorised" },
    });
  }

  const cropLabel = draft.cropName ?? "Unknown";
  const qty = draft.quantityKg ?? 0;
  const price = draft.unitPrice ?? 0;

  await prisma.produceListing.create({
    data: {
      sellerId,
      categoryId: category.id,
      title: `${cropLabel} – ${qty}kg`,
      produceName: cropLabel,
      totalQuantity: qty,
      availableQuantity: qty,
      unit: QuantityUnit.KG,
      minimumOrderQty: 1,
      unitPrice: price,
      harvestDate: new Date(),
      farmLocation: "To be updated", // farmer updates via app later
      deliveryOptions: [DeliveryOption.SELF_PICKUP],
      status: ListingStatus.ACTIVE,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// State Machine
// ─────────────────────────────────────────────────────────────

function processStateMachine(
  inputs: string[],
  sessionData: USSDSessionData
): USSDResponse {
  // Always work from a fresh copy to avoid mutation side-effects
  const state: USSDSessionData = { ...sessionData, harvest: { ...sessionData.harvest } };
  const lang: Language = state.language ?? "en";
  const menus = getMenus(lang);

  // ── STEP: LANGUAGE SELECT (first ever input) ───────────────
  if (state.step === USSDStep.LANGUAGE_SELECT) {
    if (inputs.length === 0) {
      // Initial dial-in — show language prompt
      return parseMenuPrefix(menus.languageSelect);
    }

    const choice = inputs[0];
    if (choice === "1") {
      state.language = "en";
    } else if (choice === "2") {
      state.language = "rw";
    } else {
      return parseMenuPrefix(menus.invalidOption);
    }

    state.step = USSDStep.MAIN_MENU;
    const localMenus = getMenus(state.language);
    return { ...parseMenuPrefix(localMenus.mainMenu), _state: state } as USSDResponse & { _state: USSDSessionData };
  }

  // ── STEP: MAIN MENU ────────────────────────────────────────
  if (state.step === USSDStep.MAIN_MENU) {
    const choice = inputs[1]; // inputs[0] was language
    if (!choice) return parseMenuPrefix(menus.mainMenu);

    if (choice === "1") {
      state.step = USSDStep.HARVEST_SELECT_CROP;
      state.harvest = {};
      return { ...parseMenuPrefix(menus.harvestSelectCrop), _state: state } as USSDResponse & { _state: USSDSessionData };
    }
    if (choice === "2") {
      state.step = USSDStep.ORDERS_LIST;
      return { ...parseMenuPrefix(menus.ordersEmpty), _state: state } as USSDResponse & { _state: USSDSessionData };
    }
    if (choice === "3") {
      state.step = USSDStep.PROFILE_VIEW;
      return { ...parseMenuPrefix(menus.profileNotFound), _state: state } as USSDResponse & { _state: USSDSessionData };
    }
    return parseMenuPrefix(menus.invalidOption);
  }

  // ── STEP: HARVEST – SELECT CROP ────────────────────────────
  if (state.step === USSDStep.HARVEST_SELECT_CROP) {
    const choice = inputs[2]; // [0]=lang, [1]=menu, [2]=crop
    if (!choice) return parseMenuPrefix(menus.harvestSelectCrop);

    const validCrops: CropChoice[] = [CropChoice.RICE, CropChoice.MAIZE, CropChoice.POTATOES];
    if (!validCrops.includes(choice as CropChoice)) {
      return parseMenuPrefix(menus.invalidOption);
    }

    const cc = choice as CropChoice;
    state.harvest = {
      cropChoice: cc,
      cropName: cropName(cc, lang),
    };
    state.step = USSDStep.HARVEST_ENTER_QUANTITY;
    return {
      ...parseMenuPrefix(menus.harvestEnterQuantity(state.harvest.cropName!)),
      _state: state,
    } as USSDResponse & { _state: USSDSessionData };
  }

  // ── STEP: HARVEST – ENTER QUANTITY ─────────────────────────
  if (state.step === USSDStep.HARVEST_ENTER_QUANTITY) {
    const input = inputs[3]; // [0]=lang,[1]=menu,[2]=crop,[3]=qty
    if (!input) return parseMenuPrefix(menus.harvestEnterQuantity(state.harvest?.cropName ?? ""));

    if (!isPositiveNumber(input)) {
      return parseMenuPrefix(menus.invalidNumber);
    }

    state.harvest = { ...state.harvest, quantityKg: Number(input) };
    state.step = USSDStep.HARVEST_ENTER_PRICE;
    return {
      ...parseMenuPrefix(
        menus.harvestEnterPrice(state.harvest.cropName!, state.harvest.quantityKg!)
      ),
      _state: state,
    } as USSDResponse & { _state: USSDSessionData };
  }

  // ── STEP: HARVEST – ENTER PRICE ────────────────────────────
  if (state.step === USSDStep.HARVEST_ENTER_PRICE) {
    const input = inputs[4]; // [0..3] used, [4]=price
    if (!input) {
      return parseMenuPrefix(
        menus.harvestEnterPrice(state.harvest?.cropName ?? "", state.harvest?.quantityKg ?? 0)
      );
    }

    if (!isPositiveNumber(input)) {
      return parseMenuPrefix(menus.invalidNumber);
    }

    state.harvest = { ...state.harvest, unitPrice: Number(input) };
    state.step = USSDStep.HARVEST_CONFIRM;
    return {
      ...parseMenuPrefix(
        menus.harvestConfirm(
          state.harvest.cropName!,
          state.harvest.quantityKg!,
          state.harvest.unitPrice!
        )
      ),
      _state: state,
    } as USSDResponse & { _state: USSDSessionData };
  }

  // ── STEP: HARVEST – CONFIRM ────────────────────────────────
  if (state.step === USSDStep.HARVEST_CONFIRM) {
    const input = inputs[5]; // [0..4] used, [5]=confirm
    if (!input) {
      return parseMenuPrefix(
        menus.harvestConfirm(
          state.harvest?.cropName ?? "",
          state.harvest?.quantityKg ?? 0,
          state.harvest?.unitPrice ?? 0
        )
      );
    }

    if (input === "1") {
      // Mark as ready to persist — handled in controller after state machine returns
      state.step = USSDStep.HARVEST_SAVED;
      return {
        ...parseMenuPrefix(
          menus.harvestSaved(
            state.harvest!.cropName!,
            state.harvest!.quantityKg!,
            state.harvest!.unitPrice!
          )
        ),
        _state: state,
      } as USSDResponse & { _state: USSDSessionData };
    }

    if (input === "2") {
      // Cancelled — return to main menu
      state.step = USSDStep.MAIN_MENU;
      state.harvest = {};
      return { ...parseMenuPrefix(menus.mainMenu), _state: state } as USSDResponse & { _state: USSDSessionData };
    }

    return parseMenuPrefix(menus.invalidOption);
  }

  // Fallback — should never reach here in normal flow
  return parseMenuPrefix(menus.sessionError);
}

// ─────────────────────────────────────────────────────────────
// Express Controller
// ─────────────────────────────────────────────────────────────

export async function handleUSSD(req: Request, res: Response): Promise<void> {
  // Africa's Talking sends data as application/x-www-form-urlencoded
  const { sessionId, serviceCode, phoneNumber, text } =
    req.body as ATUSSDPayload;

  // Guard: required fields
  if (!sessionId || !phoneNumber || text === undefined) {
    res.set("Content-Type", "text/plain");
    res.send("END Invalid request parameters.");
    return;
  }

  try {
    // 1. Load or create the DB session record
    const dbSession = await loadOrCreateSession(
      sessionId,
      phoneNumber,
      serviceCode
    );

    // 2. Rehydrate state from DB (or fresh default)
    const sessionData: USSDSessionData =
      (dbSession.sessionData as USSDSessionData) ?? {
        step: USSDStep.LANGUAGE_SELECT,
      };

    // 3. Split cumulative input string into individual step inputs
    const inputs = splitInputs(text);

    // 4. Run the state machine
    const result = processStateMachine(inputs, sessionData) as USSDResponse & {
      _state?: USSDSessionData;
    };

    const newState: USSDSessionData = result._state ?? sessionData;

    // 5. Append input to history
    const currentHistory = Array.isArray(dbSession.inputHistory)
      ? (dbSession.inputHistory as object[])
      : [];

    const updatedHistory = [
      ...currentHistory,
      {
        step: sessionData.step,
        input: inputs[inputs.length - 1] ?? "",
        timestamp: new Date().toISOString(),
      },
    ];

    // 6. If harvest was confirmed, save listing and finalise session
    if (newState.step === USSDStep.HARVEST_SAVED && newState.harvest) {
      await saveHarvestListing(phoneNumber, newState.harvest, newState.language ?? "en");
      await prisma.uSSDSession.update({
        where: { sessionId },
        data: {
          currentStep: USSDStep.HARVEST_SAVED,
          sessionData: newState as object,
          inputHistory: updatedHistory,
          status: USSDSessionStatus.COMPLETED,
          completedAt: new Date(),
          flowType: USSDFlowType.HARVEST_PUBLISH,
        },
      });
    } else {
      // 7. Persist updated state
      await prisma.uSSDSession.update({
        where: { sessionId },
        data: {
          currentStep: newState.step,
          sessionData: newState as object,
          inputHistory: updatedHistory,
          // Mark timed-out sessions on END responses
          status:
            result.type === "END"
              ? USSDSessionStatus.COMPLETED
              : USSDSessionStatus.ACTIVE,
          completedAt: result.type === "END" ? new Date() : null,
        },
      });
    }

    // 8. Respond to Africa's Talking
    // Response MUST be plain text: "CON <message>" or "END <message>"
    res.set("Content-Type", "text/plain");
    res.send(`${result.type} ${result.message}`);
  } catch (err) {
    console.error("[USSD] Unhandled error:", err);

    // Attempt to mark session as failed
    try {
      await prisma.uSSDSession.updateMany({
        where: { sessionId, status: USSDSessionStatus.ACTIVE },
        data: { status: USSDSessionStatus.FAILED },
      });
    } catch {
      // Swallow secondary error — don't block the response
    }

    res.set("Content-Type", "text/plain");
    res.send("END Service error. Please try again later.");
  }
}
