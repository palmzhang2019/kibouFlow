import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getArticleBySlug,
  getRelatedArticles,
  getAllArticleSlugs,
  CATEGORIES,
} from "@/lib/content";
import { ArticleLayout } from "@/components/article/ArticleLayout";
import { ArticleTracking } from "@/components/article/ArticleTracking";
import { getMDXComponents } from "@/components/article/mdx-components";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: { "@type": "Organization", name: "GEO" },
    publisher: { "@type": "Organization", name: "GEO" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
