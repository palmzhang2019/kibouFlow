import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const CATEGORIES = ["problems", "paths", "boundaries", "cases"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CONTENT_TYPES = [
  "problem",
  "path",
  "boundary",
  "case",
  "faq",
  "framework",
  "concept",
  "cluster",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export const CLUSTERS = [
  "job-prep",
  "japanese-path",
  "direction-sorting",
  "partner-needs",
] as const;
export type ClusterType = (typeof CLUSTERS)[number];

export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: Category;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  contentType?: ContentType;
  cluster?: ClusterType;
  audience?: ("individual" | "partner" | "both")[];
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

function inferContentType(category: Category): ContentType {
  switch (category) {
    case "problems":
      return "problem";
    case "paths":
      return "path";
    case "boundaries":
      return "boundary";
    case "cases":
      return "case";
    default:
      return "problem";
  }
}

function inferCluster(category: Category, slug: string): ClusterType {
  if (
    slug.includes("hope-sorting") ||
    slug.includes("goal-unclear") ||
    slug.includes("push-forward-or-sort-first")
  ) {
    return "direction-sorting";
  }
  if (slug.includes("japanese") || slug.includes("language")) {
    return "japanese-path";
  }
  if (slug.includes("partner")) {
    return "partner-needs";
  }
  if (category === "paths" || category === "problems") {
    return "job-prep";
  }
  return "direction-sorting";
}

function normalizeFrontmatter(
  frontmatter: ArticleFrontmatter,
  category: string,
): ArticleFrontmatter {
  const normalizedCategory = category as Category;
  return {
    ...frontmatter,
    category: normalizedCategory,
    contentType: frontmatter.contentType || inferContentType(normalizedCategory),
    cluster: frontmatter.cluster || inferCluster(normalizedCategory, frontmatter.slug),
    ctaType: frontmatter.ctaType || "trial",
    audience: frontmatter.audience || ["individual"],
  };
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
  const fm = normalizeFrontmatter(data as ArticleFrontmatter, category);

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
      const fm = normalizeFrontmatter(data as ArticleFrontmatter, category);
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
      const { content, ...meta } = article;
      void content;
      return meta;
    })
    .filter((a): a is ArticleMeta => a !== null);
}

export function getArticlesByContentType(
  locale: string,
  contentType: ContentType,
): ArticleMeta[] {
  return getAllArticles(locale).filter((article) => article.contentType === contentType);
}

export function getArticlesByCluster(
  locale: string,
  cluster: ClusterType,
): ArticleMeta[] {
  return getAllArticles(locale).filter((article) => article.cluster === cluster);
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
