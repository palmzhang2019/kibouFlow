import { useTranslations } from "next-intl";
import { Section } from "@/components/shared/Section";
import { CTAButtons } from "@/components/layout/CTAButtons";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <Section className="!pt-12 !pb-12 sm:!pt-20 sm:!pb-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed">
          {t("subtitle")}
        </p>
        <CTAButtons size="lg" className="mt-8" ctaId="hero" />
      </div>
    </Section>
  );
}
