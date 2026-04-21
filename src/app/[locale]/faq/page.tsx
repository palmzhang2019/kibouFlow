import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { FAQAccordion } from "@/components/faq/FAQAccordion";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import { resolveGeoMetadata } from "@/lib/geo-settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.faq" });
  const title =
    locale === "ja"
      ? "対応範囲とよくある質問 | GEO"
      : locale === "zh"
        ? "常见问题与服务边界 | GEO"
        : t("title");
  const description =
    locale === "ja"
      ? "GEO の対応範囲とよくある質問。サービス内容、対象者、料金、プライバシー、進め方を確認できます。"
      : locale === "zh"
        ? "关于 GEO 的常见问题与服务边界：服务内容、适合对象、收费、隐私与合作方式。"
        : t("description");
  const path = `/${locale}/faq`;
  const resolved = await resolveGeoMetadata({
    locale: locale as "zh" | "ja",
    path,
    existingTitle: title,
    existingDescription: description,
    existingCanonical: path,
    existingOpenGraph: {
      title,
      description,
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
      type: "website",
      url: path,
    },
  });

  return {
    title: resolved.title,
    description: resolved.description,
    openGraph: resolved.openGraph,
    alternates: {
      canonical: resolved.canonical,
      languages: { "x-default": "/zh/faq", zh: "/zh/faq", ja: "/ja/faq" },
    },
    robots: resolved.robots,
  };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const pageTitle =
    locale === "ja"
      ? "対応範囲とよくある質問"
      : locale === "zh"
        ? "常见问题与服务边界"
        : t("title");
  const pageSubtitle =
    locale === "ja"
      ? "GEO の対応範囲、対象者、進め方について先に確認できます"
      : locale === "zh"
        ? "关于 GEO 的服务范围、适合对象与下一步，你可能想知道的都在这里"
        : t("subtitle");

  const items = Array.from({ length: 10 }, (_, i) => ({
    q: t(`items.${i}.q`),
    a: t(`items.${i}.a`),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const crumbs = buildBreadcrumbItems([
    { path: `/${locale}`, name: tNav("home") },
    { path: `/${locale}/faq`, name: tNav("faq") },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} id="jsonld-breadcrumb-faq" />
      <JsonLd data={jsonLd} id="jsonld-faqpage-index" />
      <Section>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-center">{pageTitle}</h1>
          <p className="mt-3 text-muted text-center">{pageSubtitle}</p>
          <div className="mt-10">
            <FAQAccordion items={items} />
          </div>
        </div>
      </Section>
    </>
  );
}
