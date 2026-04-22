import type { MetadataRoute } from "next";
import { getAllArticles, CATEGORIES } from "@/lib/content";
import type { ContentType } from "@/lib/content";
import { getSiteUrl } from "@/lib/seo/site-url";

const BASE_URL = getSiteUrl();

const LOCALES = ["zh", "ja"] as const;
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

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: staticChangeFrequency(page),
        priority: staticPriority(page),
        alternates: {
          languages: {
            "x-default": `${BASE_URL}/zh${page}`,
            zh: `${BASE_URL}/zh${page}`,
            ja: `${BASE_URL}/ja${page}`,
          },
        },
      });
    }
  }

  for (const locale of LOCALES) {
    for (const category of CATEGORIES) {
      entries.push({
        url: `${BASE_URL}/${locale}/guides/${category}`,
        lastModified: STATIC_SITEMAP_LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: 0.85,
        alternates: {
          languages: {
            "x-default": `${BASE_URL}/zh/guides/${category}`,
            zh: `${BASE_URL}/zh/guides/${category}`,
            ja: `${BASE_URL}/ja/guides/${category}`,
          },
        },
      });
    }
  }

  for (const locale of LOCALES) {
    const articles = getAllArticles(locale);
    for (const article of articles) {
      const lastMod = article.updatedAt ?? article.publishedAt;
      entries.push({
        url: `${BASE_URL}/${locale}${article.href}`,
        lastModified: new Date(lastMod),
        changeFrequency: "monthly",
        priority: priorityOf(article.contentType),
        alternates: {
          languages: {
            "x-default": `${BASE_URL}/zh${article.href}`,
            zh: `${BASE_URL}/zh${article.href}`,
            ja: `${BASE_URL}/ja${article.href}`,
          },
        },
      });
    }
  }

  return entries;
}
