import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { slugifyHeading } from "@/lib/article-anchors";

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
const HIGH_VALUE_CONTENT_TYPES = new Set<ContentType>([
  "cluster",
  "framework",
  "concept",
  "faq",
  "case",
]);
const CLUSTER_ENTRY_SLUGS: Record<Exclude<ClusterType, "partner-needs">, string> = {
  "job-prep": "job-prep-cluster-entry",
  "japanese-path": "japanese-learning-path-cluster-entry",
  "direction-sorting": "direction-sorting-cluster-entry",
};
const CLUSTER_LABELS: Record<"zh" | "ja", Record<ClusterType, string>> = {
  zh: {
    "job-prep": "求职准备",
    "japanese-path": "日语学习路径",
    "direction-sorting": "方向整理",
    "partner-needs": "机构合作前置判断",
  },
  ja: {
    "job-prep": "就職準備",
    "japanese-path": "日本語学習ルート",
    "direction-sorting": "方向整理",
    "partner-needs": "連携前の受け入れ判断",
  },
};

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
  tldr?: string[];
  prerequisites?: string[];
  expectedOutcome?: string[];
  commonMistakes?: string[];
  about?: string[];
  mentions?: string[];
  keyTakeaways?: string[];
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

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return normalized.length > 0 ? normalized : undefined;
}

function uniqueStrings(values: (string | undefined)[]): string[] | undefined {
  const normalized = values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);

  return normalized.length > 0 ? normalized : undefined;
}

export function getClusterLabel(locale: string, cluster: ClusterType): string {
  const localized = locale === "ja" ? CLUSTER_LABELS.ja : CLUSTER_LABELS.zh;
  return localized[cluster];
}

function buildDerivedAbout(
  frontmatter: ArticleFrontmatter,
  contentType: ContentType,
  cluster: ClusterType,
  locale: string,
): string[] | undefined {
  const explicitAbout = normalizeStringArray(frontmatter.about);
  if (explicitAbout) return explicitAbout;
  if (!HIGH_VALUE_CONTENT_TYPES.has(contentType)) return undefined;

  const title = frontmatter.title?.trim();
  const clusterLabel = getClusterLabel(locale, cluster);

  switch (contentType) {
    case "cluster":
      return uniqueStrings([clusterLabel, title]);
    case "framework":
    case "concept":
    case "faq":
    case "case":
      return uniqueStrings([title, clusterLabel]);
    default:
      return undefined;
  }
}

function normalizeFrontmatter(
  frontmatter: ArticleFrontmatter,
  category: string,
  locale: string,
): ArticleFrontmatter {
  const normalizedCategory = category as Category;
  const normalizedContentType =
    frontmatter.contentType || inferContentType(normalizedCategory);
  const normalizedCluster =
    frontmatter.cluster || inferCluster(normalizedCategory, frontmatter.slug);
  const normalizedAudience =
    (normalizeStringArray(frontmatter.audience) as
      | ("individual" | "partner" | "both")[]
      | undefined) ?? ["individual"];

  return {
    ...frontmatter,
    category: normalizedCategory,
    contentType: normalizedContentType,
    cluster: normalizedCluster,
    ctaType: frontmatter.ctaType || "trial",
    audience: normalizedAudience,
    suitableFor: normalizeStringArray(frontmatter.suitableFor),
    notSuitableFor: normalizeStringArray(frontmatter.notSuitableFor),
    tldr: normalizeStringArray(frontmatter.tldr),
    prerequisites: normalizeStringArray(frontmatter.prerequisites),
    expectedOutcome: normalizeStringArray(frontmatter.expectedOutcome),
    commonMistakes: normalizeStringArray(frontmatter.commonMistakes),
    about: buildDerivedAbout(
      frontmatter,
      normalizedContentType,
      normalizedCluster,
      locale,
    ),
    mentions: normalizeStringArray(frontmatter.mentions),
    keyTakeaways: normalizeStringArray(frontmatter.keyTakeaways),
    relatedSlugs: normalizeStringArray(frontmatter.relatedSlugs),
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
  const fm = normalizeFrontmatter(data as ArticleFrontmatter, category, locale);

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
      const fm = normalizeFrontmatter(data as ArticleFrontmatter, category, locale);
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

export function getArticleSummary(
  article: Pick<ArticleFrontmatter, "description" | "tldr">,
): string {
  return article.tldr?.[0] || article.description;
}

export function getClusterEntry(locale: string, cluster: ClusterType): ArticleMeta | null {
  const slug = CLUSTER_ENTRY_SLUGS[cluster as keyof typeof CLUSTER_ENTRY_SLUGS];
  if (!slug) return null;

  const article = getArticleBySlug(locale, "paths", slug);
  if (!article) return null;
  const { content, ...meta } = article;
  void content;
  return meta;
}

export function getClusterEntryForArticle(
  locale: string,
  article: Pick<ArticleMeta, "cluster">,
): ArticleMeta | null {
  if (!article.cluster) return null;
  return getClusterEntry(locale, article.cluster);
}

export function getStrategicRelatedArticles(
  locale: string,
  article: ArticleMeta,
  limit = 6,
): ArticleMeta[] {
  const results: ArticleMeta[] = [];
  const seen = new Set([`${article.category}/${article.slug}`]);
  const pushArticle = (candidate: ArticleMeta | null) => {
    if (!candidate) return;
    const key = `${candidate.category}/${candidate.slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(candidate);
  };

  if (article.cluster) {
    const clusterEntry = getClusterEntry(locale, article.cluster);
    pushArticle(clusterEntry);
  }

  if (article.relatedSlugs?.length) {
    for (const related of getRelatedArticles(locale, article.relatedSlugs)) {
      pushArticle(related);
    }
  }

  if (article.cluster) {
    const preferredTypesBySource: Record<ContentType, ContentType[]> = {
      cluster: ["framework", "concept", "faq", "case", "path", "boundary", "problem"],
      framework: ["cluster", "faq", "concept", "case", "path", "problem", "boundary"],
      concept: ["cluster", "framework", "faq", "case", "boundary", "path", "problem"],
      faq: ["cluster", "framework", "concept", "case", "boundary", "path", "problem"],
      case: ["cluster", "framework", "faq", "concept", "path", "problem", "boundary"],
      path: ["cluster", "framework", "faq", "concept", "case", "problem", "boundary"],
      boundary: ["cluster", "framework", "concept", "faq", "case", "path", "problem"],
      problem: ["cluster", "framework", "faq", "concept", "case", "path", "boundary"],
    };
    const preferredTypes =
      preferredTypesBySource[article.contentType || "problem"] ??
      preferredTypesBySource.problem;
    const peers = getArticlesByCluster(locale, article.cluster)
      .filter((candidate) => candidate.slug !== article.slug)
      .sort((left, right) => {
        const leftIndex = preferredTypes.indexOf(left.contentType || "problem");
        const rightIndex = preferredTypes.indexOf(right.contentType || "problem");
        const safeLeftIndex = leftIndex === -1 ? preferredTypes.length : leftIndex;
        const safeRightIndex = rightIndex === -1 ? preferredTypes.length : rightIndex;
        if (safeLeftIndex !== safeRightIndex) return safeLeftIndex - safeRightIndex;
        return (
          new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
        );
      });

    for (const candidate of peers) {
      pushArticle(candidate);
    }
  }

  return results.slice(0, limit);
}

export interface FaqArticleSuggestion {
  question: string;
  anchorId: string;
  suggestedSlug: string;
  suggestedHref: string;
}

export function buildFaqArticleSuggestions(
  locale: string,
  article: Pick<ArticleMeta, "category" | "slug">,
  questions: string[],
): FaqArticleSuggestion[] {
  return questions.map((question, index) => {
    const anchorId = slugifyHeading(question);
    const suggestedSlug = `${article.slug}-q${String(index + 1).padStart(2, "0")}`;
    return {
      question,
      anchorId,
      suggestedSlug,
      suggestedHref: `/${locale}/guides/${article.category}/${suggestedSlug}`,
    };
  });
}

/**
 * 返回一篇文章的 "LLM-friendly" Markdown：
 *  - `Article.content` 经 gray-matter 已无 frontmatter，无需再剥离
 *  - 顶部追加最小元信息头（title / description / url / locale / published / [updated] / [type] / [cluster]）
 *  - 正文 .trim() + 末尾换行归一化
 *  - 不读 env，siteUrl 由调用方注入
 */
export function getArticleMarkdown(
  locale: string,
  category: string,
  slug: string,
  siteUrl: string,
): string | null {
  const article = getArticleBySlug(locale, category, slug);
  if (!article) return null;

  const url = `${siteUrl}/${locale}${article.href}`;
  const summarySections = [
    article.tldr?.length
      ? ["## TL;DR", "", ...article.tldr.map((item) => `- ${item}`), ""]
      : [],
    article.prerequisites?.length
      ? [
          "## Prerequisites",
          "",
          ...article.prerequisites.map((item) => `- ${item}`),
          "",
        ]
      : [],
    article.expectedOutcome?.length
      ? [
          "## Expected Outcome",
          "",
          ...article.expectedOutcome.map((item) => `- ${item}`),
          "",
        ]
      : [],
    article.commonMistakes?.length
      ? [
          "## Common Mistakes",
          "",
          ...article.commonMistakes.map((item) => `- ${item}`),
          "",
        ]
      : [],
    article.keyTakeaways?.length
      ? [
          "## Key Takeaways",
          "",
          ...article.keyTakeaways.map((item) => `- ${item}`),
          "",
        ]
      : [],
  ].flat();
  const header = [
    `# ${article.title}`,
    "",
    `> ${article.description}`,
    "",
    `- URL: ${url}`,
    `- Locale: ${locale}`,
    `- Published: ${article.publishedAt}`,
    article.updatedAt ? `- Updated: ${article.updatedAt}` : null,
    article.contentType ? `- Type: ${article.contentType}` : null,
    article.cluster ? `- Cluster: ${article.cluster}` : null,
    "",
    ...summarySections,
    "---",
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return header + article.content.trim() + "\n";
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
