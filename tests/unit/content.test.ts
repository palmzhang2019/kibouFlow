import { getAllArticleSlugs, getArticleBySlug, getArticlesByCategory } from "@/lib/content";

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
});
