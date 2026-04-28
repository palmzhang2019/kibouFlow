import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/shared/Section";
import { Card } from "@/components/shared/Card";

export function PostSubmitSection() {
  const t = useTranslations("home.postSubmit");

  const steps = [0, 1, 2, 3].map((i) => ({
    label: t(`steps.${i}.label`),
    desc: t(`steps.${i}.desc`),
  }));

  const cards = [0, 1, 2].map((i) => ({
    title: t(`cards.${i}.title`),
    content: t(`cards.${i}.content`),
  }));

  const continueOptions = t.raw("continueOptions.items") as string[];

  return (
    <Section bg="muted" className="!py-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">{t("title")}</h2>
      <p className="mt-4 text-muted text-center max-w-xl mx-auto leading-relaxed">{t("subtitle")}</p>

      {/* Steps */}
      <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-center gap-6 md:gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4 md:gap-0">
            <div className="flex flex-col items-center text-center min-w-[120px]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                {i + 1}
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground leading-tight max-w-[140px]">
                {step.label}
              </p>
              <p className="mt-1 text-[13px] text-foreground/60 leading-relaxed max-w-[150px] hidden sm:block">
                {step.desc}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block text-slate-400 mx-2 text-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Example cards */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {cards.map((card, i) => (
          <Card
            key={i}
            className={`p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${
              i === 1 ? "bg-amber-50/50" : i === 2 ? "bg-blue-50/50" : ""
            }`}
          >
            <h3 className="font-semibold text-sm mb-2">{card.title}</h3>
            <p className="text-xs text-muted whitespace-pre-line">{card.content}</p>
          </Card>
        ))}
      </div>

      {/* Continue options */}
      <div className="mt-8">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-sm">
          <p className="text-sm text-muted mb-4 text-center">{t("continueOptions.title")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {continueOptions.map((option, i) => {
              const isPrimary = i === 1;
              const isSecondary = i === 3;
              if (isPrimary) {
                return (
                  <Link
                    key={i}
                    href="/trial"
                    className="inline-flex items-center px-5 py-2 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    {option}
                  </Link>
                );
              }
              if (isSecondary) {
                return (
                  <Link
                    key={i}
                    href="/partner"
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-foreground hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    {option}
                  </Link>
                );
              }
              return (
                <span
                  key={i}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-muted"
                >
                  {option}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
