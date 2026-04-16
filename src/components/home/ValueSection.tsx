import { useTranslations } from "next-intl";
import { Section } from "@/components/shared/Section";

export function ValueSection() {
  const t = useTranslations("home.value");

  const steps = [0, 1, 2].map((i) => ({
    label: t(`steps.${i}.label`),
    desc: t(`steps.${i}.desc`),
  }));

  return (
    <Section>
      <h2 className="text-2xl sm:text-3xl font-bold text-center">{t("title")}</h2>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary text-xl font-bold">
              {i + 1}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{step.label}</h3>
            <p className="mt-2 text-sm text-muted">{step.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
