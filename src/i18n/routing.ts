import { defineRouting } from "next-intl/routing";

export const SUPPORTED_LOCALES = ["zh", "ja", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "zh",
});

/** Map SupportedLocale to BCP 47 tags for Open Graph / metadata */
export const LOCALE_TO_BCP47: Record<SupportedLocale, string> = {
  zh: "zh_CN",
  ja: "ja_JP",
  en: "en_US",
};
