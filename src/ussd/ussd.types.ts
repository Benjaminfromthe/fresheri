// ─────────────────────────────────────────────────────────────
// USSD Types & Interfaces
// ─────────────────────────────────────────────────────────────

/** Raw POST body sent by Africa's Talking gateway */
export interface ATUSSDPayload {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  /** All inputs joined by "*", e.g. "1*2*500*45" */
  text: string;
}

/** Supported display languages */
export type Language = "en" | "rw"; // English | Kinyarwanda

/** Every distinct screen in the state machine */
export enum USSDStep {
  // ── Entry
  LANGUAGE_SELECT = "LANGUAGE_SELECT",

  // ── Main menu
  MAIN_MENU = "MAIN_MENU",

  // ── Register Harvest flow
  HARVEST_SELECT_CROP = "HARVEST_SELECT_CROP",
  HARVEST_ENTER_QUANTITY = "HARVEST_ENTER_QUANTITY",
  HARVEST_ENTER_PRICE = "HARVEST_ENTER_PRICE",
  HARVEST_CONFIRM = "HARVEST_CONFIRM",
  HARVEST_SAVED = "HARVEST_SAVED",

  // ── Check Orders flow
  ORDERS_LIST = "ORDERS_LIST",

  // ── Profile flow
  PROFILE_VIEW = "PROFILE_VIEW",

  // ── Terminal states
  ERROR = "ERROR",
}

/** Crops available for selection (Level 3 options) */
export enum CropChoice {
  RICE = "1",
  MAIZE = "2",
  POTATOES = "3",
}

export const CROP_NAMES: Record<CropChoice, string> = {
  [CropChoice.RICE]: "Rice",
  [CropChoice.MAIZE]: "Maize",
  [CropChoice.POTATOES]: "Potatoes",
};

export const CROP_NAMES_RW: Record<CropChoice, string> = {
  [CropChoice.RICE]: "Umuceli",
  [CropChoice.MAIZE]: "Ibigori",
  [CropChoice.POTATOES]: "Ibirayi",
};

/** Data accumulated across steps for a harvest registration */
export interface HarvestDraft {
  cropChoice?: CropChoice;
  cropName?: string;
  quantityKg?: number;
  unitPrice?: number;
}

/** Full session state stored in USSDSession.sessionData (JSON) */
export interface USSDSessionData {
  language?: Language;
  step: USSDStep;
  harvest?: HarvestDraft;
}

/** Shape returned by every step handler */
export interface USSDResponse {
  /** "CON" keeps session open; "END" closes it */
  type: "CON" | "END";
  message: string;
}
