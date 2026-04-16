import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { Card } from "@/components/shared/Card";
import { TrialForm } from "@/components/forms/TrialForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.trial" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
    },
    alternates: {
      languages: { zh: "/zh/trial", ja: "/ja/trial" },
    },
  };
}

export default async function TrialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trial" });

  const forWhomItems = [0, 1, 2, 3].map((i) => t(`forWhom.items.${i}`));
  const notForItems = [0, 1, 2].map((i) => t(`notFor.items.${i}`));
  const benefitItems = [0, 1, 2, 3].map((i) => ({
    title: t(`benefits.items.${i}.title`),
    desc: t(`benefits.items.${i}.desc`),
  }));
  const afterSubmitItems = [0, 1, 2, 3].map((i) => t(`form.afterSubmit.items.${i}`));

  return (
    <>
      <Section>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
        </div>
      </Section>

      {/* For whom */}
      <Section bg="muted">
        <h2 className="text-2xl font-bold">{t("forWhom.title")}</h2>
        <ul className="mt-6 space-y-3">
          {forWhomItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <svg className="h-5 w-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Benefits */}
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

      {/* Not for */}
      <Section bg="muted">
        <h2 className="text-2xl font-bold">{t("notFor.title")}</h2>
        <ul className="mt-6 space-y-3">
          {notForItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Form */}
      <Section>
        <div className="max-w-lg mx-auto">
          <TrialForm />
        </div>
      </Section>

      {/* After submit info */}
      <Section bg="muted">
        <h2 className="text-2xl font-bold">{t("form.afterSubmit.title")}</h2>
        <ul className="mt-6 space-y-3">
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
