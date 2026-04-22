import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getArticleBySlug,
  getClusterEntryForArticle,
  getAllArticleSlugs,
  getStrategicRelatedArticles,
  buildFaqArticleSuggestions,
  CATEGORIES,
  type Category,
} from "@/lib/content";
import { ArticleLayout } from "@/components/article/ArticleLayout";
import { ArticleTracking } from "@/components/article/ArticleTracking";
import { getMDXComponents } from "@/components/article/mdx-components";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { DefinedTermJsonLd } from "@/components/seo/DefinedTermJsonLd";
import { FAQPageJsonLd } from "@/components/seo/FAQPageJsonLd";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import { extractFaqPairsFromMarkdown } from "@/lib/faq-extractor";
import { extractHowToFromMarkdown } from "@/lib/howto-extractor";
import { getGeoConfigBundle, resolveGeoMetadata } from "@/lib/geo-settings";
import { compilePatterns, getGeoRules, getGeoSchemaToggles } from "@/lib/geo-rules";

interface PageParams {
  locale: string;
  category: string;
  slug: string;
}

export async function generateStaticParams() {
  return getAllArticleSlugs().map(({ locale, category, slug }) => ({
    locale,
    category,
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, category, slug } = await params;
  const article = getArticleBySlug(locale, category, slug);
  if (!article) return {};

  const url = `/${locale}/guides/${category}/${slug}`;
  const resolved = await resolveGeoMetadata({
    locale: locale as "zh" | "ja",
    path: url,
    existingTitle: `${article.title} | kibouFlow`,
    existingDescription: article.description,
    existingCanonical: url,
    existingOpenGraph: {
      title: article.title,
      description: article.description,
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
    },
  });

  return {
    title: resolved.title,
    description: resolved.description,
    openGraph: resolved.openGraph,
    alternates: {
      canonical: resolved.canonical,
      languages: {
        "x-default": `/zh/guides/${category}/${slug}`,
        zh: `/zh/guides/${category}/${slug}`,
        ja: `/ja/guides/${category}/${slug}`,
      },
    },
    robots: resolved.robots,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, category, slug } = await params;

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    notFound();
  }

  const article = getArticleBySlug(locale, category, slug);
  if (!article) notFound();
  const geoBundle = await getGeoConfigBundle(
    locale as "zh" | "ja",
    `/${locale}/guides/${category}/${slug}`,
  );
  const [rulesResult, togglesResult] = await Promise.all([
    getGeoRules(locale as "zh" | "ja"),
    getGeoSchemaToggles(
      locale as "zh" | "ja",
      `/${locale}/guides/${category}/${slug}`,
    ),
  ]);

  const clusterEntry = getClusterEntryForArticle(locale, article);
  const relatedArticles = getStrategicRelatedArticles(locale, article);

  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const tGuides = await getTranslations({ locale, namespace: "guides" });
  const categoryLabel = tGuides(`categories.${category as Category}`);

  const crumbs = buildBreadcrumbItems([
    { path: `/${locale}`, name: tNav("home") },
    { path: `/${locale}/guides`, name: tNav("guides") },
    { path: `/${locale}/guides/${category}`, name: categoryLabel },
    { path: `/${locale}/guides/${category}/${slug}`, name: article.title },
  ]);

  const faqPairs =
    article.contentType === "faq"
      ? extractFaqPairsFromMarkdown(article.content, {
          excludeHeadingPatterns: compilePatterns(
            rulesResult.data.faq_exclude_heading_patterns,
          ),
          minItems: rulesResult.data.faq_min_items,
        })
      : [];
  const howTo =
    article.contentType === "framework" || article.contentType === "cluster"
      ? extractHowToFromMarkdown(article.content, {
          sectionPatterns: compilePatterns(rulesResult.data.howto_section_patterns),
          minSteps: rulesResult.data.howto_min_steps,
        })
      : null;
  const toggles = togglesResult.data;
  const faqSuggestions =
    article.contentType === "faq" && faqPairs.length > 0
      ? buildFaqArticleSuggestions(
          locale,
          article,
          faqPairs.map((pair) => pair.name),
        )
      : [];

  return (
    <>
      {toggles.enable_breadcrumb ? (
        <BreadcrumbJsonLd items={crumbs} id="jsonld-breadcrumb-article" />
      ) : null}
      {toggles.enable_article ? (
        <ArticleJsonLd
          article={article}
          locale={locale}
          overrides={geoBundle.page?.jsonld_overrides ?? undefined}
        />
      ) : null}
      {article.contentType === "concept" ? (
        <DefinedTermJsonLd article={article} locale={locale} />
      ) : null}
      {toggles.enable_faqpage && faqPairs.length > 0 ? (
        <FAQPageJsonLd pairs={faqPairs} locale={locale} />
      ) : null}
      {toggles.enable_howto && howTo && howTo.steps.length > 0 ? (
        <HowToJsonLd howTo={howTo} locale={locale} />
      ) : null}
      <ArticleTracking category={category} slug={slug} />
      <ArticleLayout
        article={article}
        relatedArticles={relatedArticles}
        clusterEntry={clusterEntry}
        faqPairs={faqPairs}
        faqSuggestions={faqSuggestions}
      >
        <MDXRemote
          source={article.content}
          components={getMDXComponents(locale)}
        />
      </ArticleLayout>
    </>
  );
}
