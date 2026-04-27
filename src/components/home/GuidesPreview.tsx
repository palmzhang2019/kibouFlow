"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTracking } from "@/components/tracking/TrackingProvider";

export function GuidesPreview() {
  const t = useTranslations("home.guidesPreview");
  const guides = useTranslations("guides");
  const { trackCTAClick } = useTracking();

  const items = [0, 1, 2].map((i) => ({
    category: t(`items.${i}.category`),
    title: t(`items.${i}.title`),
    desc: t(`items.${i}.desc`),
    href: t(`items.${i}.href`),
  }));

  return (
    <div className="mt-12">
      <h2 className="text-xl sm:text-2xl font-bold text-center">
        {t("title")}
      </h2>
      <p className="mt-2 text-muted text-center text-sm">{t("subtitle")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            onClick={() => trackCTAClick(`home-guides-preview-${i}`, "home")}
            className="group block rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
          >
            <span className="text-xs font-medium text-primary/70 uppercase tracking-wide">
              {item.category}
            </span>
            <h3 className="mt-2 text-sm font-semibold group-hover:text-primary transition-colors leading-snug">
              {item.title}
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              {item.desc}
            </p>
            <span className="mt-3 inline-block text-xs font-medium text-primary">
              {guides("readMore")} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
