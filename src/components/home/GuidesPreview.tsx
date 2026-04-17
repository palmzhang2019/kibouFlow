"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTracking } from "@/components/tracking/TrackingProvider";

const previewItems = [
  {
    titleKey: "item1",
    href: "/guides/paths/job-prep-cluster-entry",
  },
  {
    titleKey: "item2",
    href: "/guides/paths/japanese-learning-path-cluster-entry",
  },
  {
    titleKey: "item3",
    href: "/guides/paths/direction-sorting-cluster-entry",
  },
] as const;

export function GuidesPreview() {
  const t = useTranslations("home.guidesPreview");
  const guides = useTranslations("guides");
  const { trackCTAClick } = useTracking();

  return (
    <div className="mt-12">
      <h2 className="text-xl sm:text-2xl font-bold text-center">
        {t("title")}
      </h2>
      <p className="mt-2 text-muted text-center text-sm">{t("subtitle")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {previewItems.map((item) => (
          <Link
            key={item.titleKey}
            href={item.href}
            onClick={() => trackCTAClick(`home-cluster-preview-${item.titleKey}`, "home")}
            className="group block rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
          >
            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
              {t(item.titleKey)}
            </h3>
            <span className="mt-3 inline-block text-xs font-medium text-primary">
              {guides("readMore")} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
