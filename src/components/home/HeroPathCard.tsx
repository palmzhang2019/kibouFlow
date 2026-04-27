"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTracking } from "@/components/tracking/TrackingProvider";

export function HeroPathCard() {
  const t = useTranslations("home.heroPathCard");
  const { trackCTAClick } = useTracking();

  const steps = [0, 1, 2].map((i) => ({
    label: t(`steps.${i}.label`),
    desc: t(`steps.${i}.desc`),
  }));

  return (
    <div className="hidden lg:flex flex-col justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <h3 className="text-base font-semibold text-foreground mb-5">
          {t("title")}
        </h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 text-xs font-bold text-primary mt-0.5">
                0{i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-xs text-muted mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted text-center border-t border-gray-100 pt-4">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
