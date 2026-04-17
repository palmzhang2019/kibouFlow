import {
  getAllArticleSlugs,
  getArticleBySlug,
  getArticleMarkdown,
  getArticlesByCategory,
  getArticlesByContentType,
  getArticlesByCluster,
} from "@/lib/content";
import { extractFaqPairsFromMarkdown } from "@/lib/faq-extractor";
import { extractHowToFromMarkdown } from "@/lib/howto-extractor";

describe("content utilities", () => {
  it("loads known article by slug", () => {
    const article = getArticleBySlug("zh", "problems", "resume-vs-japanese");
    expect(article).not.toBeNull();
    expect(article?.locale).toBe("zh");
    expect(article?.href).toBe("/guides/problems/resume-vs-japanese");
  });

  it("returns null for missing article", () => {
    const article = getArticleBySlug("zh", "problems", "missing-slug");
    expect(article).toBeNull();
  });

  it("returns category list sorted by publishedAt desc", () => {
    const list = getArticlesByCategory("ja", "paths");
    expect(list.length).toBeGreaterThan(0);

    for (let i = 1; i < list.length; i++) {
      const prev = new Date(list[i - 1].publishedAt).getTime();
      const curr = new Date(list[i].publishedAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("includes both locales in all slugs", () => {
    const slugs = getAllArticleSlugs();
    expect(slugs.some((s) => s.locale === "zh")).toBe(true);
    expect(slugs.some((s) => s.locale === "ja")).toBe(true);
  });

  it("infers contentType and cluster for existing stage2 article", () => {
    const article = getArticleBySlug("zh", "problems", "resume-vs-japanese");
    expect(article).not.toBeNull();
    expect(article?.contentType).toBe("problem");
    expect(article?.cluster).toBe("japanese-path");
    expect(article?.audience).toEqual(["individual"]);
  });

  it("loads stage3 cluster entry and keeps explicit metadata", () => {
    const article = getArticleBySlug("zh", "paths", "job-prep-cluster-entry");
    expect(article).not.toBeNull();
    expect(article?.contentType).toBe("cluster");
    expect(article?.cluster).toBe("job-prep");
    expect(article?.audience).toEqual(["individual"]);
  });

  it("filters articles by contentType", () => {
    const faqs = getArticlesByContentType("zh", "faq");
    expect(faqs.length).toBeGreaterThanOrEqual(3);
    expect(faqs.every((item) => item.contentType === "faq")).toBe(true);
  });

  it("filters articles by cluster", () => {
    const clusterArticles = getArticlesByCluster("zh", "direction-sorting");
    expect(clusterArticles.length).toBeGreaterThan(0);
    expect(clusterArticles.some((item) => item.slug === "direction-sorting-cluster-entry")).toBe(true);
  });

  it("renders LLM-friendly markdown with header and no frontmatter residue", () => {
    const md = getArticleMarkdown(
      "zh",
      "boundaries",
      "faq-japanese-path",
      "https://kibouflow.com",
    );
    expect(md).not.toBeNull();
    expect(md!).toContain(
      "- URL: https://kibouflow.com/zh/guides/boundaries/faq-japanese-path",
    );
    expect(md!.startsWith("---\ntitle:")).toBe(false);
    expect(md!.endsWith("\n")).toBe(true);
  });

  it("returns null for missing article in getArticleMarkdown", () => {
    const md = getArticleMarkdown(
      "zh",
      "problems",
      "missing-slug",
      "https://kibouflow.com",
    );
    expect(md).toBeNull();
  });

  it("real faq MDX yields enough FAQ pairs for FAQPage JSON-LD", () => {
    const article = getArticleBySlug("zh", "boundaries", "faq-japanese-path");
    expect(article?.contentType).toBe("faq");
    const pairs = extractFaqPairsFromMarkdown(article!.content);
    expect(pairs.length).toBeGreaterThanOrEqual(2);
    expect(pairs.every((p) => p.name && p.text)).toBe(true);
  });

  it("real cluster entry MDX yields HowTo steps", () => {
    const article = getArticleBySlug(
      "zh",
      "paths",
      "japanese-learning-path-cluster-entry",
    );
    expect(article?.contentType).toBe("cluster");
    const how = extractHowToFromMarkdown(article!.content);
    expect(how).not.toBeNull();
    expect(how!.steps.length).toBeGreaterThanOrEqual(2);
  });

  it("real framework MDX yields HowTo under 判断维度", () => {
    const article = getArticleBySlug(
      "zh",
      "paths",
      "framework-japanese-or-job-first",
    );
    expect(article?.contentType).toBe("framework");
    const how = extractHowToFromMarkdown(article!.content);
    expect(how).not.toBeNull();
    expect(how!.steps.length).toBeGreaterThanOrEqual(2);
  });
});
