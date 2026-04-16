import { useTranslations } from "next-intl";
import { Section } from "@/components/shared/Section";

export function FlowSection() {
  const t = useTranslations("home.flow");

  const steps = [0, 1, 2, 3].map((i) => ({
    step: t(`steps.${i}.step`),
    label: t(`steps.${i}.label`),
  }));

  return (
    <Section bg="muted">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">{t("title")}</h2>
      <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-center gap-4 md:gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4 md:gap-0">
            <div className="flex flex-col items-center text-center min-w-[120px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                {step.step}
              </div>
              <p className="mt-3 text-sm font-medium leading-tight max-w-[140px]">
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block text-gray-300 mx-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
