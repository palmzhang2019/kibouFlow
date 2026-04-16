"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTracking } from "@/components/tracking/TrackingProvider";

interface CTAButtonsProps {
  size?: "default" | "lg";
  showSecondary?: boolean;
  className?: string;
  ctaId?: string;
}

export function CTAButtons({
  size = "default",
  showSecondary = true,
  className = "",
  ctaId = "cta",
}: CTAButtonsProps) {
  const t = useTranslations("common.cta");
  const { trackCTAClick } = useTracking();

  const sizeClasses =
    size === "lg"
      ? "px-8 py-3.5 text-base"
      : "px-6 py-2.5 text-sm";

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <Link
        href="/trial"
        onClick={() => trackCTAClick(`${ctaId}-primary`, "trial")}
        className={`inline-flex items-center justify-center font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors ${sizeClasses}`}
      >
        {t("trial")}
      </Link>
      {showSecondary && (
        <Link
          href="/partner"
          onClick={() => trackCTAClick(`${ctaId}-secondary`, "partner")}
          className={`inline-flex items-center justify-center font-medium rounded-lg border border-gray-300 text-foreground hover:bg-gray-50 transition-colors ${sizeClasses}`}
        >
          {t("partner")}
        </Link>
      )}
    </div>
  );
}
