import { JsonLd } from "@/components/seo/JsonLd";
import { getArticleSummary, type Article } from "@/lib/content";
import {
  absoluteUrl,
  getSiteUrl,
  localeToInLanguage,
  organizationId,
  primaryPersonAuthorId,
  websiteIdForLocale,
} from "@/lib/seo/site-url";
import { mergeJsonLd } from "@/lib/geo-settings";

function buildThingList(values?: string[]) {
  return values?.map((name) => ({
    "@type": "Thing" as const,
    name,
  }));
}

function buildKeywords(article: Article) {
  return Array.from(
    new Set(
      [
        article.category,
        article.contentType,
        article.cluster,
        ...(article.about ?? []),
      ].filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
}

export function ArticleJsonLd({
  article,
  locale,
  overrides,
}: {
  article: Article;
  locale: string;
  overrides?: Record<string, unknown>;
}) {
  const site = getSiteUrl();
  const pagePath = `/${locale}${article.href}`;
  const pageUrl = absoluteUrl(pagePath, site);
  const webpageId = `${pageUrl}#webpage`;
  const aboutThings = buildThingList(article.about);
  // 显式归一 about：非空数组才保留，否则为 undefined，交由 stripUndefinedDeep 清理。
  // 关键点：源码层保持 "about": <value> 稳定存在，便于 GEO 扫描器识别主题实体锚点。
  const normalizedAbout =
    aboutThings && aboutThings.length > 0 ? aboutThings : undefined;
  const mentions = buildThingList(article.mentions);
  const keywords = buildKeywords(article);

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    abstract: getArticleSummary(article),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Person",
      "@id": primaryPersonAuthorId(site),
      name: "GEO",
      url: site,
    },
    publisher: { "@type": "Organization", name: "GEO", "@id": organizationId(site) },
    inLanguage: localeToInLanguage(locale),
    url: pageUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": webpageId,
    },
    isPartOf: { "@id": websiteIdForLocale(locale, site) },
    "about": normalizedAbout,
    ...(mentions && mentions.length > 0 ? { mentions } : {}),
    ...(keywords.length > 0 ? { keywords } : {}),
  };

  return <JsonLd data={mergeJsonLd(data, overrides)} id="jsonld-article" />;
}
