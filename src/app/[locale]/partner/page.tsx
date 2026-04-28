import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { Card } from "@/components/shared/Card";
import { PartnerForm } from "@/components/forms/PartnerForm";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import { resolveGeoMetadata } from "@/lib/geo-settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.partner" });
  const path = `/${locale}/partner`;
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
      languages: { "x-default": "/zh/partner", zh: "/zh/partner", ja: "/ja/partner" },
    },
    robots: resolved.robots,
  };
}

export default async function PartnerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partner" });
  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const crumbs = buildBreadcrumbItems([
    { path: `/${locale}`, name: tNav("home") },
    { path: `/${locale}/partner`, name: tNav("partner") },
  ]);

  const typeItems = [0, 1, 2, 3].map((i) => ({
    title: t(`types.items.${i}.title`),
    desc: t(`types.items.${i}.desc`),
  }));

  const benefitItems = [0, 1, 2].map((i) => ({
    title: t(`benefits.items.${i}.title`),
    desc: t(`benefits.items.${i}.desc`),
  }));

  const coopItems = [0, 1, 2, 3].map((i) => ({
    title: t(`cooperation.items.${i}.title`),
    desc: t(`cooperation.items.${i}.desc`),
  }));

  const boundaryItems = [0, 1, 2, 3].map((i) => t(`boundary.items.${i}`));

  const processSteps = [0, 1, 2, 3].map((i) => ({
    title: t(`process.steps.${i}.title`),
    desc: t(`process.steps.${i}.desc`),
  }));

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} id="jsonld-breadcrumb-partner" />
      {/* Header */}
      <Section>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#partner-form"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-6 py-3 text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {t("ctaPrimary")}
            </a>
            <a
              href="#partner-methods"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-700 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>
      </Section>

      {/* Partner types */}
      <Section bg="muted">
        <h2 className="text-2xl font-bold">{t("types.title")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {typeItems.map((item, i) => (
            <Card key={i}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* What we reduce */}
      <Section>
        <h2 className="text-2xl font-bold">{t("benefits.title")}</h2>
        {t("benefits.subtitle") && (
          <p className="mt-2 text-muted">{t("benefits.subtitle")}</p>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {benefitItems.map((item, i) => (
            <Card key={i}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section>
        <h2 className="text-2xl font-bold">{t("process.title")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {processSteps.map((step, i) => (
            <Card key={i}>
              <div className="text-xs font-medium text-muted mb-2">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Cooperation models */}
      <Section bg="muted" id="partner-methods">
        <h2 className="text-2xl font-bold">{t("cooperation.title")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {coopItems.map((item, i) => (
            <Card key={i}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Boundary */}
      <Section>
        <h2 className="text-2xl font-bold">{t("boundary.title")}</h2>
        <ul className="mt-6 space-y-3">
          {boundaryItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Form */}
      <Section bg="muted" id="partner-form">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold">{t("form.introTitle")}</h2>
          <p className="mt-2 text-sm text-muted whitespace-pre-line">{t("form.introDesc")}</p>
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <PartnerForm />
          </div>
        </div>
      </Section>
    </>
  );
}
