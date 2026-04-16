import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === "zh" ? "申请已提交 | GEO" : "申し込み完了 | GEO",
    robots: { index: false },
  };
}

export default async function PartnerSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partner.success" });
  const ct = await getTranslations({ locale, namespace: "common.cta" });

  const steps = [0, 1, 2].map((i) => t(`steps.${i}`));

  return (
    <Section className="text-center">
      <div className="max-w-md mx-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("message")}</p>

        <div className="mt-8 text-left">
          <p className="font-medium">{t("nextSteps")}</p>
          <ul className="mt-3 space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5">•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {ct("backHome")}
          </Link>
        </div>
      </div>
    </Section>
  );
}
