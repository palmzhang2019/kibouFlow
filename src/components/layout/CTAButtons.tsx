"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { sendTrackingEvent } from "@/lib/tracking";
import { trackGaEvent } from "@/lib/ga";
import { getOrCreateSessionId, getStoredUTMParams } from "@/lib/utm";

interface CTAButtonsProps {
  size?: "default" | "lg";
  showSecondary?: boolean;
  className?: string;
  ctaId?: string;
  ctaSource?: string;
  contentType?: string;
  articleSlug?: string;
  articleCategory?: string;
}

export function CTAButtons({
  size = "default",
  showSecondary = true,
  className = "",
  ctaId = "cta",
  ctaSource = "unknown",
  contentType = "page",
  articleSlug = "",
  articleCategory = "",
}: CTAButtonsProps) {
  const t = useTranslations("common.cta");
  const locale = useLocale();
  const utm = getStoredUTMParams();

  const sizeClasses =
    size === "lg"
      ? "px-8 py-3.5 text-base min-h-[48px]"
      : "px-6 py-2.5 text-sm min-h-[40px]";

  function trackCTA(id: string, label: string, href: string) {
    const localeAwareHref = `/${locale}${href}`;
    const payload = {
      event_name: "cta_click",
      cta_id: id,
      cta_label: label,
      cta_href: localeAwareHref,
      cta_source: ctaSource,
      content_type: contentType,
      article_slug: articleSlug,
      article_category: articleCategory,
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
      session_id: getOrCreateSessionId(),
      locale,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      ...utm,
    };
    sendTrackingEvent(payload);
    trackGaEvent("cta_click", {
      cta_id: id,
      cta_label: label,
      cta_href: localeAwareHref,
      cta_source: ctaSource,
      content_type: contentType,
      article_slug: articleSlug,
      article_category: articleCategory,
      page_path: payload.page_path,
      locale,
    });
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <Link
        href="/trial"
        onClick={() => trackCTA(`${ctaId}-primary`, t("trial") as string, "/trial")}
        className={`inline-flex items-center justify-center font-medium rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1e3a8a] transition-colors ${sizeClasses}`}
      >
        {t("trial")}
      </Link>
      {showSecondary && (
        <Link
          href="/partner"
          onClick={() => trackCTA(`${ctaId}-secondary`, t("partner") as string, "/partner")}
          className={`inline-flex items-center justify-center font-medium rounded-lg border border-gray-300 text-foreground hover:bg-gray-50 transition-colors ${sizeClasses}`}
        >
          {t("partner")}
        </Link>
      )}
    </div>
  );
}
