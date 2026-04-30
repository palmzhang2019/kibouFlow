import { getArticleBySlug } from "@/lib/content";

export function buildArticleAlternateLanguages(category: string, slug: string) {
  const languages: Record<string, string> = {
    "x-default": `/zh/guides/${category}/${slug}`,
    zh: `/zh/guides/${category}/${slug}`,
    ja: `/ja/guides/${category}/${slug}`,
  };

  if (getArticleBySlug("en", category, slug)) {
    languages.en = `/en/guides/${category}/${slug}`;
  }

  return languages;
}
