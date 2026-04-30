import type { SupportedLocale } from "@/i18n/routing";

export type AdminUiLocale = Exclude<SupportedLocale, "en">;

export function isAdminUiLocale(locale: string): locale is AdminUiLocale {
  return locale === "zh" || locale === "ja";
}
