"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTracking } from "@/components/tracking/TrackingProvider";

interface ArticleCTAProps {
  ctaType?: "trial" | "partner" | "both";
  articleSlug: string;
  variant?: "inline" | "full";
}

export function ArticleCTA({
  ctaType = "trial",
  articleSlug,
  variant = "full",
}: ArticleCTAProps) {
  const t = useTranslations("guides.articleCta");
  const cta = useTranslations("common.cta");
  const { trackCTAClick } = useTracking();

  const showTrial = ctaType === "trial" || ctaType === "both";
  const showPartner = ctaType === "partner" || ctaType === "both";

  if (variant === "inline") {
    return (
      <div className="my-8 rounded-lg border border-primary/20 bg-primary-light/30 p-5 text-center">
        <p className="text-sm font-medium text-foreground">{t("title")}</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
          {showTrial && (
            <Link
              href="/trial"
              onClick={() =>
                trackCTAClick(`article-inline-trial-${articleSlug}`, "trial")
              }
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {cta("trial")}
            </Link>
          )}
          {showPartner && (
            <Link
              href="/partner"
              onClick={() =>
                trackCTAClick(`article-inline-partner-${articleSlug}`, "partner")
              }
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
            onClick={() =>
              trackCTAClick(`article-bottom-trial-${articleSlug}`, "trial")
            }
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {cta("trial")}
          </Link>
        )}
        {showPartner && (
          <Link
            href="/partner"
            onClick={() =>
              trackCTAClick(`article-bottom-partner-${articleSlug}`, "partner")
            }
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg border border-gray-300 text-foreground hover:bg-gray-50 transition-colors"
          >
            {cta("partner")}
          </Link>
        )}
      </div>
    </section>
  );
}
