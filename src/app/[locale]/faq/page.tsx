import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { FAQAccordion } from "@/components/faq/FAQAccordion";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.faq" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
    },
    alternates: {
      languages: { zh: "/zh/faq", ja: "/ja/faq" },
    },
  };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const tNav = await getTranslations({ locale, namespace: "common.nav" });

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
          <h1 className="text-3xl sm:text-4xl font-bold text-center">{t("title")}</h1>
          <p className="mt-3 text-muted text-center">{t("subtitle")}</p>
          <div className="mt-10">
            <FAQAccordion items={items} />
          </div>
        </div>
      </Section>
    </>
  );
}
