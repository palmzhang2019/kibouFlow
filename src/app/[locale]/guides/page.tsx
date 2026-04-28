import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { ArticleCard } from "@/components/article/ArticleCard";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import {
  getAllArticles,
  CATEGORIES,
  getArticlesByContentType,
  getArticlesByCluster,
  CLUSTERS,
} from "@/lib/content";
import type { Category } from "@/lib/content";
import { resolveGeoMetadata } from "@/lib/geo-settings";
import { getGeoSchemaToggles } from "@/lib/geo-rules";

const CATEGORY_SECTION_IDS: Record<Category, string> = {
  problems: "section-problems",
  paths: "section-paths",
  boundaries: "section-boundaries",
  cases: "section-cases",
};

function renderSectionTitle(title: string) {
  return (
    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-foreground">
      <span className="h-6 w-1 rounded-full bg-primary" aria-hidden="true" />
      {title}
    </h2>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.guides" });
  const resolved = await resolveGeoMetadata({
    locale: locale as "zh" | "ja",
    path: `/${locale}/guides`,
    existingTitle: t("title"),
    existingDescription: t("description"),
    existingCanonical: `/${locale}/guides`,
    existingOpenGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
    },
  });

  return {
    title: resolved.title,
    description: resolved.description,
    openGraph: resolved.openGraph,
    alternates: {
      canonical: resolved.canonical,
      languages: { "x-default": "/zh/guides", zh: "/zh/guides", ja: "/ja/guides" },
    },
    robots: resolved.robots,
  };
}

export default async function GuidesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const toggles = await getGeoSchemaToggles(locale as "zh" | "ja", `/${locale}/guides`);
  const allArticles = getAllArticles(locale);
  const crumbs = buildBreadcrumbItems([
    { path: `/${locale}`, name: tNav("home") },
    { path: `/${locale}/guides`, name: tNav("guides") },
  ]);
  const clusterEntries = getArticlesByContentType(locale, "cluster");
  const faqEntries = getArticlesByContentType(locale, "faq");
  const frameworkEntries = getArticlesByContentType(locale, "framework");
  const conceptEntries = getArticlesByContentType(locale, "concept");
  const caseLibrary = allArticles.find((article) => article.slug === "case-library");

  const grouped = CATEGORIES.map((cat) => ({
    category: cat as Category,
    articles: allArticles.filter(
      (a) =>
        a.category === cat &&
        !["cluster", "faq", "framework", "concept"].includes(a.contentType || ""),
    ),
  })).filter((g) => g.articles.length > 0);
  const sectionNavItems = [
    ...(clusterEntries.length > 0
      ? [{ id: "section-clusters", label: t("sections.clusters") }]
      : []),
    ...(caseLibrary
      ? [{ id: "section-case-library", label: t("sections.caseLibrary") }]
      : []),
    ...(faqEntries.length > 0 ? [{ id: "section-faqs", label: t("sections.faqs") }] : []),
    ...(frameworkEntries.length > 0
      ? [{ id: "section-frameworks", label: t("sections.frameworks") }]
      : []),
    ...(conceptEntries.length > 0
      ? [{ id: "section-concepts", label: t("sections.concepts") }]
      : []),
    ...grouped.map(({ category }) => ({
      id: CATEGORY_SECTION_IDS[category],
      label: t(`categories.${category}`),
    })),
  ];

  return (
    <>
      {toggles.data.enable_breadcrumb ? (
        <BreadcrumbJsonLd items={crumbs} id="jsonld-breadcrumb-guides" />
      ) : null}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
        </div>

        <nav className="mt-8 overflow-x-auto" aria-label={t("title")}>
          <div className="flex gap-2 whitespace-nowrap pb-1">
            {sectionNavItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:border-primary hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-14 space-y-16">
          {clusterEntries.length > 0 && (
            <div id="section-clusters" className="scroll-mt-24">
              {renderSectionTitle(t("sections.clusters"))}
              <p className="mb-6 max-w-2xl text-sm leading-6 text-muted">
                {t("sectionLeads.clusters")}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {clusterEntries.map((article) => (
                  <ArticleCard key={article.href} article={article} />
                ))}
              </div>
            </div>
          )}

          {caseLibrary && (
            <div id="section-case-library" className="scroll-mt-24">
              {renderSectionTitle(t("sections.caseLibrary"))}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <ArticleCard article={caseLibrary} />
                {CLUSTERS.map((cluster) => {
                  const sample = getArticlesByCluster(locale, cluster).find(
                    (entry) =>
                      entry.contentType === "case" && entry.slug !== "case-library",
                  );
                  if (!sample) return null;
                  return <ArticleCard key={`${cluster}-${sample.href}`} article={sample} />;
                })}
              </div>
            </div>
          )}

          {faqEntries.length > 0 && (
            <div id="section-faqs" className="scroll-mt-24">
              {renderSectionTitle(t("sections.faqs"))}
              <p className="mb-6 max-w-2xl text-sm leading-6 text-muted">
                {t("sectionLeads.faqs")}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {faqEntries.map((article) => (
                  <ArticleCard key={article.href} article={article} />
                ))}
              </div>
            </div>
          )}

          {frameworkEntries.length > 0 && (
            <div id="section-frameworks" className="scroll-mt-24">
              {renderSectionTitle(t("sections.frameworks"))}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {frameworkEntries.map((article) => (
                  <ArticleCard key={article.href} article={article} />
                ))}
              </div>
            </div>
          )}

          {conceptEntries.length > 0 && (
            <div id="section-concepts" className="scroll-mt-24">
              {renderSectionTitle(t("sections.concepts"))}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {conceptEntries.map((article) => (
                  <ArticleCard key={article.href} article={article} />
                ))}
              </div>
            </div>
          )}

          {grouped.map(({ category, articles }) => (
            <div key={category} id={CATEGORY_SECTION_IDS[category]} className="scroll-mt-24">
              {renderSectionTitle(t(`categories.${category}`))}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.href} article={article} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
