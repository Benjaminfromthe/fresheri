import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales:       ["en", "rw", "fr"],
  defaultLocale: "en",
  localePrefix:  "as-needed", // /marketplace (en), /rw/marketplace, /fr/marketplace
});
