"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common.lang");

  function handleSwitch(target: SupportedLocale) {
    if (target === locale) return;
    router.replace(pathname, { locale: target });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-gray-200 text-sm">
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => handleSwitch(loc)}
          className={`px-2.5 py-1.5 font-medium transition-colors ${
            loc === locale
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-50"
          } ${loc === SUPPORTED_LOCALES[0] ? "rounded-l-[5px]" : ""} ${loc === SUPPORTED_LOCALES[SUPPORTED_LOCALES.length - 1] ? "rounded-r-[5px]" : ""}`}
          aria-current={loc === locale ? "true" : undefined}
          title={t("switch")}
        >
          {t(loc)}
        </button>
      ))}
    </div>
  );
}
