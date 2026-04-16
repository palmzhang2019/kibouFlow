import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const CATEGORIES = ["problems", "paths", "boundaries", "cases"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: Category;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  suitableFor?: string[];
  notSuitableFor?: string[];
  relatedSlugs?: string[]; // e.g. "paths/four-preparation-paths"
  ctaType?: "trial" | "partner" | "both";
}

export interface ArticleMeta extends ArticleFrontmatter {
  locale: string;
  href: string; // e.g. "/guides/problems/resume-vs-japanese"
}

export interface Article extends ArticleMeta {
  content: string; // raw MDX string
}

const CONTENT_DIR = path.join(process.cwd(), "content");

function buildHref(category: string, slug: string): string {
  return `/guides/${category}/${slug}`;
}

export function getArticleBySlug(
  locale: string,
  category: string,
  slug: string,
): Article | null {
  const filePath = path.join(CONTENT_DIR, locale, category, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fm = data as ArticleFrontmatter;

  return {
    ...fm,
    locale,
    href: buildHref(category, slug),
    content,
  };
}

export function getArticlesByCategory(
  locale: string,
  category: string,
): ArticleMeta[] {
  const dirPath = path.join(CONTENT_DIR, locale, category);
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(dirPath, filename), "utf-8");
      const { data } = matter(raw);
      const fm = data as ArticleFrontmatter;
      return { ...fm, locale, href: buildHref(category, slug) };
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getAllArticles(locale: string): ArticleMeta[] {
  return CATEGORIES.flatMap((cat) => getArticlesByCategory(locale, cat));
}

export function getRelatedArticles(
  locale: string,
  relatedSlugs: string[],
): ArticleMeta[] {
  return relatedSlugs
    .map((ref) => {
      const [category, slug] = ref.split("/");
      const article = getArticleBySlug(locale, category, slug);
      if (!article) return null;
      const { content: _, ...meta } = article;
      return meta;
    })
    .filter((a): a is ArticleMeta => a !== null);
}

export function getAllArticleSlugs(): {
  locale: string;
  category: string;
  slug: string;
}[] {
  const locales = ["zh", "ja"];
  const results: { locale: string; category: string; slug: string }[] = [];

  for (const locale of locales) {
    for (const category of CATEGORIES) {
      const dirPath = path.join(CONTENT_DIR, locale, category);
      if (!fs.existsSync(dirPath)) continue;
      for (const filename of fs.readdirSync(dirPath)) {
        if (!filename.endsWith(".mdx")) continue;
        results.push({
          locale,
          category,
          slug: filename.replace(/\.mdx$/, ""),
        });
      }
    }
  }

  return results;
}
