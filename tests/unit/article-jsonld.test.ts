import { afterEach, describe, expect, it } from "vitest";
import { getArticleBySlug } from "@/lib/content";
import { absoluteUrl, getSiteUrl, localeToInLanguage, organizationId, websiteIdForLocale } from "@/lib/seo/site-url";

/** Mirrors ArticleJsonLd payload for stable field checks without React renderer. */
function buildArticleJsonLdShape(article: NonNullable<ReturnType<typeof getArticleBySlug>>, locale: string) {
  const site = getSiteUrl();
  const pagePath = `/${locale}${article.href}`;
  const pageUrl = absoluteUrl(pagePath, site);
  const webpageId = `${pageUrl}#webpage`;
  return {
    "@type": "Article",
    url: pageUrl,
    inLanguage: localeToInLanguage(locale),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": webpageId,
    },
    isPartOf: { "@id": websiteIdForLocale(locale, site) },
    publisher: { "@id": organizationId(site) },
  };
}

describe("Article JSON-LD shape", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("includes absolute url and inLanguage for a real article", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://kibouflow.com";
    const article = getArticleBySlug("zh", "boundaries", "faq-japanese-path");
    expect(article).not.toBeNull();
    const shape = buildArticleJsonLdShape(article!, "zh");
    expect(shape.url).toBe("https://kibouflow.com/zh/guides/boundaries/faq-japanese-path");
    expect(shape.inLanguage).toBe("zh-CN");
    expect(shape.isPartOf["@id"]).toBe("https://kibouflow.com/zh/#website");
  });
});
