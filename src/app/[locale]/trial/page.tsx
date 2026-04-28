import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { TrialForm } from "@/components/forms/TrialForm";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import { resolveGeoMetadata } from "@/lib/geo-settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.trial" });
  const path = `/${locale}/trial`;
  const resolved = await resolveGeoMetadata({
    locale: locale as "zh" | "ja",
    path,
    existingTitle: t("title"),
    existingDescription: t("description"),
    existingCanonical: path,
    existingOpenGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
      type: "website",
      url: path,
    },
  });

  return {
    title: resolved.title,
    description: resolved.description,
    openGraph: resolved.openGraph,
    alternates: {
      canonical: resolved.canonical,
      languages: { "x-default": "/zh/trial", zh: "/zh/trial", ja: "/ja/trial" },
    },
    robots: resolved.robots,
  };
}

export default async function TrialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trial" });
  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const crumbs = buildBreadcrumbItems([
    { path: `/${locale}`, name: tNav("home") },
    { path: `/${locale}/trial`, name: tNav("trial") },
  ]);

  const afterSubmitItems = [0, 1, 2, 3].map((i) => t(`form.afterSubmit.items.${i}`));
  const hintCardItems = [0, 1, 2].map((i) => t(`hintCard.items.${i}`));

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} id="jsonld-breadcrumb-trial" />
      <Section className="pt-8 pb-4 sm:pt-10 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          {/* Left: title + info */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{t("title")}</h1>
            <p className="text-muted text-sm leading-relaxed">{t("subtitle")}</p>
            <p className="text-xs text-muted/70">{t("assistant")}</p>

            {/* Hint card */}
            <div className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 text-sm">
              <p className="font-semibold text-foreground mb-2.5">{t("hintCard.title")}</p>
              <ul className="space-y-1.5 text-muted">
                {hintCardItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">・</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <p className="text-lg font-semibold text-foreground">{t("form.formTitle")}</p>
              <p className="text-sm text-muted mt-1">{t("form.hint")}</p>
              <TrialForm />
            </div>
          </div>
        </div>
      </Section>

      {/* After submit info */}
      <Section bg="muted" className="py-8">
        <h2 className="text-xl font-bold">{t("form.afterSubmit.title")}</h2>
        <ul className="mt-5 space-y-3">
          {afterSubmitItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light text-primary text-xs font-bold shrink-0">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
