import { JsonLd } from "@/components/seo/JsonLd";
import type { Article } from "@/lib/content";
import {
  absoluteUrl,
  getSiteUrl,
  localeToInLanguage,
  organizationId,
  websiteIdForLocale,
} from "@/lib/seo/site-url";

export function ArticleJsonLd({ article, locale }: { article: Article; locale: string }) {
  const site = getSiteUrl();
  const pagePath = `/${locale}${article.href}`;
  const pageUrl = absoluteUrl(pagePath, site);
  const webpageId = `${pageUrl}#webpage`;

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: { "@type": "Organization", name: "GEO" },
    publisher: { "@type": "Organization", name: "GEO", "@id": organizationId(site) },
    inLanguage: localeToInLanguage(locale),
    url: pageUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": webpageId,
    },
    isPartOf: { "@id": websiteIdForLocale(locale, site) },
  };

  return <JsonLd data={data} id="jsonld-article" />;
}
