import {
  getAllArticleSlugs,
  getArticleBySlug,
  getArticlesByCategory,
  getArticlesByContentType,
  getArticlesByCluster,
} from "@/lib/content";

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
});
