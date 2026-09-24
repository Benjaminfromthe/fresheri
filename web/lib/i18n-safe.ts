// ─────────────────────────────────────────────────────────────
// i18n Safe Fallback Helper
//
// When a translation key is missing in rw/fr, returns the English
// fallback value instead of rendering the raw key string.
//
// Usage:
//   const t = useTranslations("authGate");
//   const safe = useSafeT(t, EN_FALLBACKS.authGate);
//   safe("title") // → translated string or EN fallback
// ─────────────────────────────────────────────────────────────

export type TranslationFn = (key: string, values?: Record<string, string>) => string;

/**
 * Wraps a next-intl t() function.
 * If t() throws (missing key) or returns the raw key, returns the fallback.
 */
export function safeTFactory(
  t: TranslationFn,
  fallbacks: Record<string, string>
): TranslationFn {
  return (key: string, values?: Record<string, string>): string => {
    try {
      const result = t(key as never, values as never);
      // If result looks like a raw key (contains dots, no spaces), use fallback
      if (typeof result !== "string" || result === key) {
        return fallbacks[key] ?? key;
      }
      return result;
    } catch {
      return fallbacks[key] ?? key;
    }
  };
}

/** English fallbacks for the authGate namespace */
export const AUTH_GATE_FALLBACKS: Record<string, string> = {
  title:             "Join Fresheri to continue",
  subtitle:          "Create a free account to view exact pickup locations, place bulk orders, and connect directly with verified farmer cooperatives.",
  signUpBtn:         "Create Free Account",
  signInBtn:         "Sign In",
  alreadyHave:       "Already have an account?",
  noAccount:         "New to Fresheri?",
  actionViewDetails: "To view full details and pickup options",
  actionPlaceOrder:  "To place a bulk order",
  actionContact:     "To contact the cooperative",
  actionPublish:     "To publish your harvest",
  actionWishlist:    "To save listings",
  actionFilter:      "To use personalized filters",
  valueProp1:        "View exact pickup locations & farmer contacts",
  valueProp2:        "Place bulk orders directly with cooperatives",
  valueProp3:        "Get SMS updates at every delivery stage",
  privacy:           "Your identity & farm details stay private until order confirmation.",
};
