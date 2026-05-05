import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Section } from "@/components/shared/Section";
import { CTAButtons } from "@/components/layout/CTAButtons";
import { HeroPathCard } from "@/components/home/HeroPathCard";

export function HeroSection() {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  const isEnglish = locale === "en";

  return (
    <Section className="!pt-12 !pb-8 sm:!pt-20 sm:!pb-16 lg:!pt-12 lg:!pb-8 lg:min-h-[520px]">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-10 items-center">
        <div className={isEnglish ? "max-w-lg" : "max-w-xl"}>
          <h1
            className={`leading-tight tracking-tight whitespace-pre-line ${
              isEnglish
                ? "text-3xl sm:text-4xl lg:text-4xl font-bold"
                : "text-3xl sm:text-4xl lg:text-5xl font-bold"
            }`}
          >
            {t("title")}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line">
            {t("subtitle")}
          </p>
          <CTAButtons size="lg" className="mt-8" ctaId="hero" showSecondary={!isEnglish} />
          {/* 三语统一：单行小字，不使用 badge chips */}
          <p className="text-sm text-slate-500 mt-3">{t("ctaAssistant")}</p>
        </div>
        <HeroPathCard />
      </div>
    </Section>
  );
}
