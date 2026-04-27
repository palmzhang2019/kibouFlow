import { useTranslations } from "next-intl";
import { Section } from "@/components/shared/Section";
import { CTAButtons } from "@/components/layout/CTAButtons";
import { HeroPathCard } from "@/components/home/HeroPathCard";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <Section className="!pt-12 !pb-12 sm:!pt-20 sm:!pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight whitespace-pre-line">
            {t("title")}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed">
            {t("subtitle")}
          </p>
          <CTAButtons size="lg" className="mt-8" ctaId="hero" />
          <p className="text-sm text-slate-500 mt-3">{t("ctaAssistant")}</p>
        </div>
        <HeroPathCard />
      </div>
    </Section>
  );
}
