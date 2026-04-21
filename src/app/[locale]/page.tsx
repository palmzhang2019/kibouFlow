import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/home/HeroSection";
import { ProblemSection } from "@/components/home/ProblemSection";
import { ValueSection } from "@/components/home/ValueSection";
import { FlowSection } from "@/components/home/FlowSection";
import { AudienceSection } from "@/components/home/AudienceSection";
import { GuidesPreview } from "@/components/home/GuidesPreview";
import { Section } from "@/components/shared/Section";
import { CTAButtons } from "@/components/layout/CTAButtons";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { resolveGeoMetadata } from "@/lib/geo-settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  const description =
    locale === "zh"
      ? "帮助在日本发展但方向不清的人做希望整理、路径判断与下一步选择。先整理，再决定该先做什么。"
      : t("description");
  const resolved = await resolveGeoMetadata({
    locale: locale as "zh" | "ja",
    path: `/${locale}`,
    existingTitle: t("title"),
    existingDescription: description,
    existingCanonical: `/${locale}`,
    existingOpenGraph: {
      title: t("title"),
      description,
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
      type: "website",
      url: `/${locale}`,
    },
  });

  return {
    title: resolved.title,
    description: resolved.description,
    openGraph: resolved.openGraph,
    alternates: {
      canonical: resolved.canonical,
      languages: {
        zh: "/zh",
        ja: "/ja",
      },
    },
    robots: resolved.robots,
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.bottomCta" });

  return (
    <>
      <OrganizationJsonLd />
      <HeroSection />
      <ProblemSection />
      <ValueSection />
      <FlowSection />
      <AudienceSection />
      <Section bg="muted">
        <GuidesPreview />
      </Section>
      <Section className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">{t("title")}</h2>
        <p className="mt-3 text-muted">{t("subtitle")}</p>
        <CTAButtons size="lg" className="mt-8 justify-center" ctaId="bottom" />
      </Section>
    </>
  );
}
