import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { FAQQuestionGroup } from "@/components/faq/FAQQuestionGroup";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import { resolveGeoMetadata } from "@/lib/geo-settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.faq" });
  const title =
    locale === "ja"
      ? "対応範囲とよくある質問 | kibouFlow"
      : locale === "zh"
        ? "常见问题与服务边界 | kibouFlow"
        : t("title");
  const description =
    locale === "ja"
      ? "kibouFlow の対応範囲とよくある質問。サービス内容、対象者、料金、プライバシー、進め方を確認できます。"
      : locale === "zh"
        ? "关于 kibouFlow 的常见问题与服务边界：服务内容、适合对象、收费、隐私与合作方式。"
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

type FAQGroup = {
  heading: string;
  indices: number[];
};

const FAQ_GROUPS_ZH: FAQGroup[] = [
  { heading: "关于 kibouFlow", indices: [0, 1] },
  { heading: "适合对象", indices: [2, 3] },
  { heading: "服务与合作", indices: [4, 9] },
  { heading: "费用与数据", indices: [5, 6, 7, 8] },
];

const FAQ_GROUPS_JA: FAQGroup[] = [
  { heading: "kibouFlow について", indices: [0, 1] },
  { heading: "対象者", indices: [2, 3] },
  { heading: "サービス与合作", indices: [4, 9] },
  { heading: "料金とデータ", indices: [5, 6, 7, 8] },
];

function getGroupedItems(items: { q: string; a: string }[], groups: FAQGroup[]) {
  return groups.map((group) => ({
    heading: group.heading,
    questions: group.indices.map((i) => items[i]),
  }));
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
      ? "kibouFlow の対応範囲、対象者、進め方について先に確認できます"
      : locale === "zh"
        ? "关于 kibouFlow 的服务范围、适合对象与下一步，你可能想知道的都在这里"
        : t("subtitle");

  const items = Array.from({ length: 10 }, (_, i) => ({
    q: t(`items.${i}.q`),
    a: t(`items.${i}.a`),
  }));

  const groups = locale === "ja" ? FAQ_GROUPS_JA : FAQ_GROUPS_ZH;
  const groupedItems = getGroupedItems(items, groups);

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
          <div className="mt-10 space-y-10">
            {groupedItems.map((group, gi) => (
              <FAQQuestionGroup
                key={gi}
                groupHeading={group.heading}
                items={group.questions}
                groupIndex={gi}
              />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}