import { useTranslations } from "next-intl";
import { Section } from "@/components/shared/Section";
import { CTAButtons } from "@/components/layout/CTAButtons";
import { HeroPathCard } from "@/components/home/HeroPathCard";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <Section className="!pt-12 !pb-8 sm:!pt-20 sm:!pb-16 lg:!pt-8 lg:!pb-6 lg:min-h-[520px]">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-10 items-center">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight whitespace-pre-line">
            {t("title")}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
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
