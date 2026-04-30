import type { MetadataRoute } from "next";
import { getAllArticles, CATEGORIES } from "@/lib/content";
import type { ContentType } from "@/lib/content";
import { getSiteUrl } from "@/lib/seo/site-url";
import { SUPPORTED_LOCALES } from "@/i18n/routing";

const BASE_URL = getSiteUrl();
const STATIC_PAGES = ["", "/trial", "/partner", "/faq", "/guides"] as const;

/** 静态营销页的 lastModified；优先用构建时环境变量，兜底用运行时时间 */
const STATIC_SITEMAP_LAST_MODIFIED = (() => {
  const raw = process.env.SITEMAP_STATIC_LASTMOD?.trim();
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
})();

function priorityOf(contentType?: ContentType): number {
  switch (contentType) {
    case "cluster":
      return 0.9;
    case "framework":
      return 0.85;
    case "faq":
      return 0.8;
    case "case":
      return 0.75;
    default:
      return 0.7;
  }
}

function staticChangeFrequency(
  page: (typeof STATIC_PAGES)[number],
): "weekly" | "monthly" {
  return page === "" ? "weekly" : "monthly";
}

function staticPriority(page: (typeof STATIC_PAGES)[number]): number {
  if (page === "") return 1.0;
  if (page === "/guides") return 0.9;
  return 0.8;
}

/** Build a set of article hrefs that exist in the en locale */
function buildEnArticleHrefs(): Set<string> {
  const enArticles = getAllArticles("en");
  return new Set(enArticles.map((a) => a.href));
}

/** Build alternates languages object for static/category pages (always includes en) */
function staticAlternates(path: string): Record<string, string> {
  const langs: Record<string, string> = {
    "x-default": `${BASE_URL}/zh${path}`,
    zh: `${BASE_URL}/zh${path}`,
    ja: `${BASE_URL}/ja${path}`,
    en: `${BASE_URL}/en${path}`,
  };
  return langs;
}

/** Build alternates languages for article pages (en only if article exists in en) */
function articleAlternates(href: string, enHrefs: Set<string>): Record<string, string> {
  const langs: Record<string, string> = {
    "x-default": `${BASE_URL}/zh${href}`,
    zh: `${BASE_URL}/zh${href}`,
    ja: `${BASE_URL}/ja${href}`,
  };
  if (enHrefs.has(href)) {
    langs.en = `${BASE_URL}/en${href}`;
  }
  return langs;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const enHrefs = buildEnArticleHrefs();

  for (const locale of SUPPORTED_LOCALES) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: staticChangeFrequency(page),
        priority: staticPriority(page),
        alternates: {
          languages: staticAlternates(page),
        },
      });
    }
  }

  for (const locale of SUPPORTED_LOCALES) {
    for (const category of CATEGORIES) {
      entries.push({
        url: `${BASE_URL}/${locale}/guides/${category}`,
        lastModified: STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: 0.85,
        alternates: {
          languages: staticAlternates(`/guides/${category}`),
        },
      });
    }
  }

  for (const locale of SUPPORTED_LOCALES) {
    const articles = getAllArticles(locale);
    for (const article of articles) {
      const lastMod = article.updatedAt ?? article.publishedAt;
      entries.push({
        url: `${BASE_URL}/${locale}${article.href}`,
        lastModified: new Date(lastMod),
        changeFrequency: "monthly",
        priority: priorityOf(article.contentType),
        alternates: {
          languages: articleAlternates(article.href, enHrefs),
        },
      });
    }
  }

  return entries;
}
