// ─────────────────────────────────────────────────────────────
// ussd.controller.test.ts — Unit tests for USSD state machine
//
// The state machine is a pure function — no DB calls.
// These tests verify state transitions without any mocking.
//
// Coverage targets:
//   ✅ Language selection (EN / RW)
//   ✅ Main menu routing (harvest / orders / profile)
//   ✅ Full harvest flow: crop → qty → price → confirm
//   ✅ Invalid inputs handled gracefully (CON, no crash)
//   ✅ Cancellation returns to main menu
// ─────────────────────────────────────────────────────────────

import { processStateMachine } from "./ussd.controller";
import { USSDStep, USSDSessionData, CropChoice } from "./ussd.types";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function initialState(): USSDSessionData {
  return { step: USSDStep.LANGUAGE_SELECT };
}

function run(text: string, state: USSDSessionData) {
  const inputs = text === "" ? [] : text.split("*");
  return processStateMachine(inputs, state);
}

// ─────────────────────────────────────────────────────────────
// Language selection
// ─────────────────────────────────────────────────────────────

describe("USSD state machine — language selection", () => {
  it("shows language prompt on initial dial-in (empty text)", () => {
    const result = run("", initialState());
    expect(result.type).toBe("CON");
    expect(result.message.toLowerCase()).toContain("english");
  });

  it("selects English and advances to main menu", () => {
    const result = run("1", initialState());
    expect(result.type).toBe("CON");
    expect(result._state.step).toBe(USSDStep.MAIN_MENU);
    expect(result._state.language).toBe("en");
  });

  it("selects Kinyarwanda and advances to main menu", () => {
    const result = run("2", initialState());
    expect(result._state.step).toBe(USSDStep.MAIN_MENU);
    expect(result._state.language).toBe("rw");
  });

  it("returns invalidOption on unrecognised language choice", () => {
    const result = run("9", initialState());
    expect(result.type).toBe("CON");
    expect(result._state.step).toBe(USSDStep.LANGUAGE_SELECT);
  });
});

// ─────────────────────────────────────────────────────────────
// Main menu
// ─────────────────────────────────────────────────────────────

describe("USSD state machine — main menu", () => {
  const afterLanguage: USSDSessionData = {
    step: USSDStep.MAIN_MENU,
    language: "en",
  };

  it("navigates to harvest flow on choice 1", () => {
    const result = run("1*1", afterLanguage);
    expect(result._state.step).toBe(USSDStep.HARVEST_SELECT_CROP);
    expect(result._state.harvest).toEqual({});
  });

  it("navigates to orders on choice 2", () => {
    const result = run("1*2", afterLanguage);
    expect(result._state.step).toBe(USSDStep.ORDERS_LIST);
  });

  it("navigates to profile on choice 3", () => {
    const result = run("1*3", afterLanguage);
    expect(result._state.step).toBe(USSDStep.PROFILE_VIEW);
  });

  it("shows invalidOption for unknown menu choice", () => {
    const result = run("1*9", afterLanguage);
    expect(result.type).toBe("CON");
  });
});

// ─────────────────────────────────────────────────────────────
// Harvest flow — full path
// ─────────────────────────────────────────────────────────────

describe("USSD state machine — harvest registration flow", () => {
  const base: USSDSessionData = { step: USSDStep.MAIN_MENU, language: "en" };

  it("step 1: prompts for crop selection", () => {
    const result = run("1*1", base);
    expect(result._state.step).toBe(USSDStep.HARVEST_SELECT_CROP);
    expect(result.type).toBe("CON");
  });

  it("step 2: records crop choice and prompts for quantity", () => {
    const state: USSDSessionData = { step: USSDStep.HARVEST_SELECT_CROP, language: "en" };
    const result = run("1*1*1", state); // choice 1 = Rice
    expect(result._state.step).toBe(USSDStep.HARVEST_ENTER_QUANTITY);
    expect(result._state.harvest?.cropName).toBe("Rice");
  });

  it("step 3: records quantity and prompts for price", () => {
    const state: USSDSessionData = {
      step: USSDStep.HARVEST_ENTER_QUANTITY,
      language: "en",
      harvest: { cropChoice: CropChoice.RICE, cropName: "Rice" },
    };
    const result = run("1*1*1*2000", state);
    expect(result._state.step).toBe(USSDStep.HARVEST_ENTER_PRICE);
    expect(result._state.harvest?.quantityKg).toBe(2000);
  });

  it("step 4: records price and shows confirmation screen", () => {
    const state: USSDSessionData = {
      step: USSDStep.HARVEST_ENTER_PRICE,
      language: "en",
      harvest: { cropChoice: CropChoice.RICE, cropName: "Rice", quantityKg: 2000 },
    };
    const result = run("1*1*1*2000*120", state);
    expect(result._state.step).toBe(USSDStep.HARVEST_CONFIRM);
    expect(result._state.harvest?.unitPrice).toBe(120);
  });

  it("step 5 (confirm=1): advances to HARVEST_SAVED with END response", () => {
    const state: USSDSessionData = {
      step: USSDStep.HARVEST_CONFIRM,
      language: "en",
      harvest: { cropChoice: CropChoice.RICE, cropName: "Rice", quantityKg: 2000, unitPrice: 120 },
    };
    const result = run("1*1*1*2000*120*1", state);
    expect(result.type).toBe("END");
    expect(result._state.step).toBe(USSDStep.HARVEST_SAVED);
  });

  it("step 5 (confirm=2): cancels and returns to main menu", () => {
    const state: USSDSessionData = {
      step: USSDStep.HARVEST_CONFIRM,
      language: "en",
      harvest: { cropChoice: CropChoice.RICE, cropName: "Rice", quantityKg: 2000, unitPrice: 120 },
    };
    const result = run("1*1*1*2000*120*2", state);
    expect(result.type).toBe("CON");
    expect(result._state.step).toBe(USSDStep.MAIN_MENU);
    expect(result._state.harvest).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────
// Invalid inputs
// ─────────────────────────────────────────────────────────────

describe("USSD state machine — invalid inputs", () => {
  it("rejects non-numeric quantity with invalidNumber", () => {
    const state: USSDSessionData = {
      step: USSDStep.HARVEST_ENTER_QUANTITY,
      language: "en",
      harvest: { cropChoice: CropChoice.RICE, cropName: "Rice" },
    };
    const result = run("1*1*1*abc", state);
    expect(result.type).toBe("CON");
    expect(result._state.step).toBe(USSDStep.HARVEST_ENTER_QUANTITY);
  });

  it("rejects zero quantity", () => {
    const state: USSDSessionData = {
      step: USSDStep.HARVEST_ENTER_QUANTITY,
      language: "en",
      harvest: { cropChoice: CropChoice.RICE, cropName: "Rice" },
    };
    const result = run("1*1*1*0", state);
    expect(result.type).toBe("CON");
  });

  it("rejects invalid crop choice", () => {
    const state: USSDSessionData = {
      step: USSDStep.HARVEST_SELECT_CROP,
      language: "en",
    };
    const result = run("1*1*9", state);
    expect(result.type).toBe("CON");
    expect(result._state.step).toBe(USSDStep.HARVEST_SELECT_CROP);
  });
});
