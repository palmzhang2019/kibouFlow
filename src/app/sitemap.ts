import type { MetadataRoute } from "next";
import { getAllArticleSlugs } from "@/lib/content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["zh", "ja"];
  const staticPages = ["", "/trial", "/partner", "/faq", "/guides"];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : page === "/guides" ? 0.9 : 0.8,
        alternates: {
          languages: {
            zh: `${BASE_URL}/zh${page}`,
            ja: `${BASE_URL}/ja${page}`,
          },
        },
      });
    }
  }

  const articleSlugs = getAllArticleSlugs();
  for (const { locale, category, slug } of articleSlugs) {
    const path = `/guides/${category}/${slug}`;
    entries.push({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          zh: `${BASE_URL}/zh${path}`,
          ja: `${BASE_URL}/ja${path}`,
        },
      },
    });
  }

  return entries;
}
