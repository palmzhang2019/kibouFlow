"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { sendTrackingEvent } from "@/lib/tracking";
import { trackGaEvent } from "@/lib/ga";
import { getOrCreateSessionId, getStoredUTMParams } from "@/lib/utm";

interface ArticleCTAProps {
  ctaType?: "trial" | "partner" | "both";
  articleSlug: string;
  articleCategory?: string;
  variant?: "inline" | "full";
}

export function ArticleCTA({
  ctaType = "trial",
  articleSlug,
  articleCategory = "",
  variant = "full",
}: ArticleCTAProps) {
  const t = useTranslations("guides.articleCta");
  const cta = useTranslations("common.cta");
  const locale = useLocale();
  const utm = getStoredUTMParams();

  const showTrial = ctaType === "trial" || ctaType === "both";
  const showPartner = ctaType === "partner" || ctaType === "both";

  function trackCTA(ctaId: string, ctaLabel: string, href: string) {
    const source = variant === "inline" ? "article_inline" : "article_bottom";
    const localeAwareHref = `/${locale}${href}`;
    const payload = {
      event_name: "cta_click",
      cta_id: ctaId,
      cta_label: ctaLabel,
      cta_href: localeAwareHref,
      cta_source: source,
      content_type: "article",
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
      cta_id: ctaId,
      cta_label: ctaLabel,
      cta_href: localeAwareHref,
      cta_source: source,
      content_type: "article",
      article_slug: articleSlug,
      article_category: articleCategory,
      page_path: payload.page_path,
      locale,
    });
  }

  if (variant === "inline") {
    return (
      <div className="my-8 rounded-lg border border-primary/20 bg-primary-light/30 p-5 text-center">
        <p className="text-sm font-medium text-foreground">{t("title")}</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
          {showTrial && (
            <Link
              href="/trial"
              onClick={() => trackCTA(`article-inline-trial-${articleSlug}`, cta("trial") as string, "/trial")}
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {cta("trial")}
            </Link>
          )}
          {showPartner && (
            <Link
              href="/partner"
              onClick={() => trackCTA(`article-inline-partner-${articleSlug}`, cta("partner") as string, "/partner")}
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-foreground hover:bg-gray-50 transition-colors"
            >
              {cta("partner")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-12 rounded-xl border-2 border-primary/20 bg-primary-light/20 p-8 text-center">
      <h2 className="text-xl font-bold">{t("title")}</h2>
      <p className="mt-2 text-muted text-sm">{t("subtitle")}</p>
      <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
        {showTrial && (
          <Link
            href="/trial"
            onClick={() => trackCTA(`article-bottom-trial-${articleSlug}`, cta("trial") as string, "/trial")}
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {cta("trial")}
          </Link>
        )}
        {showPartner && (
          <Link
            href="/partner"
            onClick={() => trackCTA(`article-bottom-partner-${articleSlug}`, cta("partner") as string, "/partner")}
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg border border-gray-300 text-foreground hover:bg-gray-50 transition-colors"
          >
            {cta("partner")}
          </Link>
        )}
      </div>
    </section>
  );
}
