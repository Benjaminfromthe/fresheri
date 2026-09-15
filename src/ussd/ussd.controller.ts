// ─────────────────────────────────────────────────────────────
// USSD Controller — HTTP Layer Only
//
// Architecture compliance:
//   ✅ No direct Prisma calls — all DB work delegated to ussd.service
//   ✅ Receives PrismaClient as injected dependency
//   ✅ State machine logic kept pure (no side effects)
//   ✅ Config values from src/constants/config.ts
// ─────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { PrismaClient, USSDFlowType, USSDSessionStatus } from "@prisma/client";
import { getMenus } from "./ussd.menus";
import {
  ATUSSDPayload,
  CropChoice,
  CROP_NAMES,
  CROP_NAMES_RW,
  Language,
  USSDResponse,
  USSDSessionData,
  USSDStep,
} from "./ussd.types";
import {
  loadOrCreateSession,
  updateSessionStep,
  finaliseSession,
  markSessionFailed,
  saveHarvestListing,
} from "./ussd.service";

// ─────────────────────────────────────────────────────────────
// Pure helpers (no side-effects — safe to unit test)
// ─────────────────────────────────────────────────────────────

function parseMenuPrefix(raw: string): { type: "CON" | "END"; message: string } {
  if (raw.startsWith("CON ")) return { type: "CON", message: raw.slice(4) };
  if (raw.startsWith("END ")) return { type: "END", message: raw.slice(4) };
  return { type: "CON", message: raw };
}

function splitInputs(text: string): string[] {
  return text === "" ? [] : text.split("*");
}

function cropName(choice: CropChoice, lang: Language): string {
  return lang === "rw" ? CROP_NAMES_RW[choice] : CROP_NAMES[choice];
}

function isPositiveNumber(val: string): boolean {
  const n = Number(val);
  return !isNaN(n) && isFinite(n) && n > 0;
}

// ─────────────────────────────────────────────────────────────
// Pure state machine — returns next state + response
// No DB calls. Side effects happen in the controller.
// ─────────────────────────────────────────────────────────────

type StateMachineResult = USSDResponse & { _state: USSDSessionData };

export function processStateMachine(
  inputs: string[],
  sessionData: USSDSessionData
): StateMachineResult {
  const state: USSDSessionData = {
    ...sessionData,
    harvest: { ...sessionData.harvest },
  };
  const lang: Language = state.language ?? "en";
  const menus = getMenus(lang);

  const withState = (raw: string): StateMachineResult => ({
    ...parseMenuPrefix(raw),
    _state: state,
  });

  // ── LANGUAGE SELECT ──────────────────────────────────────
  if (state.step === USSDStep.LANGUAGE_SELECT) {
    if (inputs.length === 0) return { ...parseMenuPrefix(menus.languageSelect), _state: state };

    const choice = inputs[0];
    if (choice === "1")      state.language = "en";
    else if (choice === "2") state.language = "rw";
    else return { ...parseMenuPrefix(menus.invalidOption), _state: state };

    state.step = USSDStep.MAIN_MENU;
    return withState(getMenus(state.language).mainMenu);
  }

  // ── MAIN MENU ────────────────────────────────────────────
  if (state.step === USSDStep.MAIN_MENU) {
    const choice = inputs[1];
    if (!choice) return withState(menus.mainMenu);

    if (choice === "1") {
      state.step = USSDStep.HARVEST_SELECT_CROP;
      state.harvest = {};
      return withState(menus.harvestSelectCrop);
    }
    if (choice === "2") { state.step = USSDStep.ORDERS_LIST;  return withState(menus.ordersEmpty); }
    if (choice === "3") { state.step = USSDStep.PROFILE_VIEW; return withState(menus.profileNotFound); }
    return withState(menus.invalidOption);
  }

  // ── HARVEST: SELECT CROP ────────────────────────────────
  if (state.step === USSDStep.HARVEST_SELECT_CROP) {
    const choice = inputs[2];
    if (!choice) return withState(menus.harvestSelectCrop);

    const validCrops: CropChoice[] = [CropChoice.RICE, CropChoice.MAIZE, CropChoice.POTATOES];
    if (!validCrops.includes(choice as CropChoice)) return withState(menus.invalidOption);

    const cc = choice as CropChoice;
    state.harvest = { cropChoice: cc, cropName: cropName(cc, lang) };
    state.step = USSDStep.HARVEST_ENTER_QUANTITY;
    return withState(menus.harvestEnterQuantity(state.harvest.cropName!));
  }

  // ── HARVEST: ENTER QUANTITY ─────────────────────────────
  if (state.step === USSDStep.HARVEST_ENTER_QUANTITY) {
    const input = inputs[3];
    if (!input) return withState(menus.harvestEnterQuantity(state.harvest?.cropName ?? ""));
    if (!isPositiveNumber(input)) return withState(menus.invalidNumber);

    state.harvest = { ...state.harvest, quantityKg: Number(input) };
    state.step = USSDStep.HARVEST_ENTER_PRICE;
    return withState(menus.harvestEnterPrice(state.harvest.cropName!, state.harvest.quantityKg!));
  }

  // ── HARVEST: ENTER PRICE ────────────────────────────────
  if (state.step === USSDStep.HARVEST_ENTER_PRICE) {
    const input = inputs[4];
    if (!input) return withState(menus.harvestEnterPrice(state.harvest?.cropName ?? "", state.harvest?.quantityKg ?? 0));
    if (!isPositiveNumber(input)) return withState(menus.invalidNumber);

    state.harvest = { ...state.harvest, unitPrice: Number(input) };
    state.step = USSDStep.HARVEST_CONFIRM;
    return withState(menus.harvestConfirm(state.harvest.cropName!, state.harvest.quantityKg!, state.harvest.unitPrice!));
  }

  // ── HARVEST: CONFIRM ────────────────────────────────────
  if (state.step === USSDStep.HARVEST_CONFIRM) {
    const input = inputs[5];
    if (!input) return withState(menus.harvestConfirm(
      state.harvest?.cropName ?? "", state.harvest?.quantityKg ?? 0, state.harvest?.unitPrice ?? 0
    ));

    if (input === "1") {
      state.step = USSDStep.HARVEST_SAVED;
      return withState(menus.harvestSaved(state.harvest!.cropName!, state.harvest!.quantityKg!, state.harvest!.unitPrice!));
    }
    if (input === "2") {
      state.step = USSDStep.MAIN_MENU;
      state.harvest = {};
      return withState(menus.mainMenu);
    }
    return withState(menus.invalidOption);
  }

  return { ...parseMenuPrefix(menus.sessionError), _state: state };
}

// ─────────────────────────────────────────────────────────────
// Controller factory — receives injected dependencies
// ─────────────────────────────────────────────────────────────

export function createUssdController(db: PrismaClient) {

  async function handleUSSD(req: Request, res: Response): Promise<void> {
    const { sessionId, serviceCode, phoneNumber, text } =
      req.body as ATUSSDPayload;

    if (!sessionId || !phoneNumber || text === undefined) {
      res.set("Content-Type", "text/plain");
      res.send("END Invalid request parameters.");
      return;
    }

    try {
      // 1. Load or create session (service layer)
      const dbSession = await loadOrCreateSession(sessionId, phoneNumber, serviceCode, db);

      // 2. Rehydrate state
      const sessionData: USSDSessionData =
        (dbSession.sessionData as unknown as USSDSessionData) ?? {
          step: USSDStep.LANGUAGE_SELECT,
        };

      // 3. Parse inputs
      const inputs = splitInputs(text);

      // 4. Run pure state machine
      const result = processStateMachine(inputs, sessionData);
      const newState = result._state;

      // 5. Build updated input history
      const currentHistory = Array.isArray(dbSession.inputHistory)
        ? (dbSession.inputHistory as object[])
        : [];

      const updatedHistory = [
        ...currentHistory,
        {
          step:      sessionData.step,
          input:     inputs[inputs.length - 1] ?? "",
          timestamp: new Date().toISOString(),
        },
      ];

      // 6. Persist: harvest saved path
      if (newState.step === USSDStep.HARVEST_SAVED && newState.harvest) {
        await saveHarvestListing(
          phoneNumber,
          newState.harvest,
          newState.language ?? "en",
          db
        );
        await finaliseSession(
          sessionId,
          USSDSessionStatus.COMPLETED,
          USSDFlowType.HARVEST_PUBLISH,
          newState,
          updatedHistory,
          db
        );
      } else {
        // 7. Persist: normal step update
        await updateSessionStep(sessionId, newState.step, newState, updatedHistory, db);

        if (result.type === "END") {
          await finaliseSession(
            sessionId,
            USSDSessionStatus.COMPLETED,
            USSDFlowType.ACCOUNT_MENU,
            newState,
            updatedHistory,
            db
          );
        }
      }

      // 8. Respond to Africa's Talking gateway
      res.set("Content-Type", "text/plain");
      res.send(`${result.type} ${result.message}`);
    } catch (err) {
      console.error("[USSD] Unhandled error:", err);
      await markSessionFailed(sessionId, db).catch(() => undefined);
      res.set("Content-Type", "text/plain");
      res.send("END Service error. Please try again later.");
    }
  }

  return { handleUSSD };
}
