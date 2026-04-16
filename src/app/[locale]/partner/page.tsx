import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { Card } from "@/components/shared/Card";
import { PartnerForm } from "@/components/forms/PartnerForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.partner" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
    },
    alternates: {
      languages: { zh: "/zh/partner", ja: "/ja/partner" },
    },
  };
}

export default async function PartnerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partner" });

  const typeItems = [0, 1, 2, 3].map((i) => ({
    title: t(`types.items.${i}.title`),
    desc: t(`types.items.${i}.desc`),
  }));

  const benefitItems = [0, 1, 2, 3].map((i) => ({
    title: t(`benefits.items.${i}.title`),
    desc: t(`benefits.items.${i}.desc`),
  }));

  const coopItems = [0, 1, 2, 3].map((i) => ({
    title: t(`cooperation.items.${i}.title`),
    desc: t(`cooperation.items.${i}.desc`),
  }));

  const boundaryItems = [0, 1, 2, 3].map((i) => t(`boundary.items.${i}`));

  return (
    <>
      {/* Header */}
      <Section>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {benefitItems.map((item, i) => (
            <Card key={i}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Cooperation models */}
      <Section bg="muted">
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
      <Section bg="muted">
        <div className="max-w-lg mx-auto">
          <PartnerForm />
        </div>
      </Section>
    </>
  );
}
