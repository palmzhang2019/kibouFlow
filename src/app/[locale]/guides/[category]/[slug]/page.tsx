import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getArticleBySlug,
  getRelatedArticles,
  getAllArticleSlugs,
  CATEGORIES,
  type Category,
} from "@/lib/content";
import { ArticleLayout } from "@/components/article/ArticleLayout";
import { ArticleTracking } from "@/components/article/ArticleTracking";
import { getMDXComponents } from "@/components/article/mdx-components";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FAQPageJsonLd } from "@/components/seo/FAQPageJsonLd";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import { extractFaqPairsFromMarkdown } from "@/lib/faq-extractor";
import { extractHowToFromMarkdown } from "@/lib/howto-extractor";

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

  return {
    title: `${article.title} | GEO`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
    },
    alternates: {
      canonical: url,
      languages: {
        zh: `/zh/guides/${category}/${slug}`,
        ja: `/ja/guides/${category}/${slug}`,
      },
    },
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

  const relatedArticles = article.relatedSlugs
    ? getRelatedArticles(locale, article.relatedSlugs)
    : [];

  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const tGuides = await getTranslations({ locale, namespace: "guides" });
  const categoryLabel = tGuides(`categories.${category as Category}`);

  const crumbs = buildBreadcrumbItems([
    { path: `/${locale}`, name: tNav("home") },
    { path: `/${locale}/guides`, name: tNav("guides") },
    { path: `/${locale}/guides#${category}`, name: categoryLabel },
    { path: `/${locale}/guides/${category}/${slug}`, name: article.title },
  ]);

  const faqPairs =
    article.contentType === "faq" ? extractFaqPairsFromMarkdown(article.content) : [];
  const howTo =
    article.contentType === "framework" || article.contentType === "cluster"
      ? extractHowToFromMarkdown(article.content)
      : null;

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} id="jsonld-breadcrumb-article" />
      <ArticleJsonLd article={article} locale={locale} />
      {faqPairs.length >= 2 ? <FAQPageJsonLd pairs={faqPairs} locale={locale} /> : null}
      {howTo && howTo.steps.length >= 2 ? (
        <HowToJsonLd howTo={howTo} locale={locale} />
      ) : null}
      <ArticleTracking category={category} slug={slug} />
      <ArticleLayout article={article} relatedArticles={relatedArticles}>
        <MDXRemote
          source={article.content}
          components={getMDXComponents()}
        />
      </ArticleLayout>
    </>
  );
}
