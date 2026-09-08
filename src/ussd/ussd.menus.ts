import { Language } from "./ussd.types";

// ─────────────────────────────────────────────────────────────
// Bilingual menu strings (English / Kinyarwanda)
// All menus are plain text – USSD displays don't support markup.
// ─────────────────────────────────────────────────────────────

type Menus = {
  languageSelect: string;
  mainMenu: string;
  harvestSelectCrop: string;
  harvestEnterQuantity: (crop: string) => string;
  harvestEnterPrice: (crop: string, qty: number) => string;
  harvestConfirm: (crop: string, qty: number, price: number) => string;
  harvestSaved: (crop: string, qty: number, price: number) => string;
  ordersEmpty: string;
  profileNotFound: string;
  invalidOption: string;
  invalidNumber: string;
  sessionError: string;
};

const EN: Menus = {
  languageSelect:
    "CON Welcome to Fresheri\n1. English\n2. Kinyarwanda",

  mainMenu:
    "CON Main Menu\n1. Register Harvest\n2. Check Orders\n3. My Profile",

  harvestSelectCrop:
    "CON Select Crop:\n1. Rice\n2. Maize\n3. Potatoes",

  harvestEnterQuantity: (crop) =>
    `CON Enter quantity of ${crop} (kg):`,

  harvestEnterPrice: (crop, qty) =>
    `CON Enter unit price per kg for\n${qty}kg of ${crop} (KES):`,

  harvestConfirm: (crop, qty, price) =>
    `CON Confirm listing:\n${crop} - ${qty}kg @ KES ${price}/kg\nTotal: KES ${qty * price}\n1. Confirm\n2. Cancel`,

  harvestSaved: (crop, qty, price) =>
    `END Harvest saved!\n${crop}: ${qty}kg @ KES ${price}/kg\nBuyers will contact you soon.`,

  ordersEmpty:
    "END No orders found for your account.",

  profileNotFound:
    "END Profile not found. Dial again to register.",

  invalidOption:
    "CON Invalid option. Try again:\n0. Back to Main Menu",

  invalidNumber:
    "CON Invalid number. Enter digits only:\n0. Back",

  sessionError:
    "END Service error. Please try again later.",
};

const RW: Menus = {
  languageSelect:
    "CON Murakaza neza kuri Fresheri\n1. English\n2. Kinyarwanda",

  mainMenu:
    "CON Menu Nyamukuru\n1. Andika Harvest\n2. Reba Amatumwa\n3. Umwirondoro Wanjye",

  harvestSelectCrop:
    "CON Hitamo Umusaruro:\n1. Umuceli\n2. Ibigori\n3. Ibirayi",

  harvestEnterQuantity: (crop) =>
    `CON Injiza umubare wa ${crop} (kg):`,

  harvestEnterPrice: (crop, qty) =>
    `CON Injiza igiciro cya kg imwe\n${qty}kg ya ${crop} (RWF):`,

  harvestConfirm: (crop, qty, price) =>
    `CON Emeza urutonde:\n${crop} - ${qty}kg @ RWF ${price}/kg\nIngano Yose: RWF ${qty * price}\n1. Emeza\n2. Reka`,

  harvestSaved: (crop, qty, price) =>
    `END Harvest yabitswe!\n${crop}: ${qty}kg @ RWF ${price}/kg\nAbaguzi bazakuvugisha vuba.`,

  ordersEmpty:
    "END Nta matumwa aboneka kuri konti yawe.",

  profileNotFound:
    "END Umwirondoro ntiboneka. Ongera wite kugirango uiyandikishe.",

  invalidOption:
    "CON Ihitoze si ryiza. Gerageza nanone:\n0. Subira ku Menu",

  invalidNumber:
    "CON Umubare si wo. Injiza imibare gusa:\n0. Subira",

  sessionError:
    "END Ikibazo cya serivisi. Gerageza nyuma gato.",
};

/** Returns the correct menu bundle for the given language */
export function getMenus(lang: Language = "en"): Menus {
  return lang === "rw" ? RW : EN;
}
