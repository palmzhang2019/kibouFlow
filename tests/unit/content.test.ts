import {
  buildFaqArticleSuggestions,
  getAllArticleSlugs,
  getArticleBySlug,
  getArticleMarkdown,
  getArticlesByCategory,
  getArticlesByContentType,
  getArticlesByCluster,
  getClusterEntryForArticle,
  getStrategicRelatedArticles,
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
    expect(article?.tldr).toEqual([
      "这页是求职准备主题簇入口，帮你把简历、顺序、面试准备等问题拆成可阅读的路径。",
      "推荐顺序：先看问题判断 → 再看框架方法 → 再看 FAQ 定位 → 最后看案例找参考。",
      "先看全局再进细节，引用锚点更稳定。",
    ]);
    expect(article?.about).toEqual(["求职准备", "主题入口"]);
  });

  it("loads article with frontmatter summary fields populated", () => {
    // resume-vs-japanese.mdx now has tldr/suitableFor/notSuitableFor in its MDX frontmatter
    const article = getArticleBySlug("zh", "problems", "resume-vs-japanese");
    expect(article).not.toBeNull();
    expect(article?.tldr).toBeDefined();
    expect(Array.isArray(article?.tldr)).toBe(true);
  });

  it("derives about for high-value articles when frontmatter omits it", () => {
    const article = getArticleBySlug("zh", "boundaries", "faq-japanese-path");
    expect(article).not.toBeNull();
    expect(article?.slug).toBe("faq-japanese-path");
    expect(article?.contentType).toBe("faq");
    expect(article?.about).toEqual([
      "日语学习路径 FAQ",
      "日语学习路径",
    ]);
  });

  it("normalizes malformed frontmatter enum values", () => {
    const article = getArticleBySlug("zh", "boundaries", "what-we-dont-handle-yet");
    expect(article).not.toBeNull();
    expect(article?.contentType).toBe("boundary");
    expect(article?.slug).toBe("what-we-dont-handle-yet");
  });

  it("prioritizes the cluster hub in strategic related articles", () => {
    const article = getArticleBySlug("zh", "boundaries", "concept-path-judgment");
    expect(article).not.toBeNull();
    const related = getStrategicRelatedArticles("zh", article!);
    expect(related.length).toBeGreaterThan(0);
    expect(related[0].slug).toBe("direction-sorting-cluster-entry");
  });

  it("finds the cluster hub for a clustered article", () => {
    const article = getArticleBySlug("zh", "paths", "framework-japanese-or-job-first");
    expect(article).not.toBeNull();
    const hub = getClusterEntryForArticle("zh", article!);
    expect(hub?.slug).toBe("japanese-learning-path-cluster-entry");
  });

  it("prepares stable standalone FAQ article suggestions", () => {
    const article = getArticleBySlug("zh", "boundaries", "faq-job-prep");
    expect(article).not.toBeNull();
    const suggestions = buildFaqArticleSuggestions("zh", article!, [
      "要不要先改简历？",
      "语言不够能不能先投？",
    ]);
    expect(suggestions).toEqual([
      {
        question: "要不要先改简历？",
        anchorId: "要不要先改简历",
        suggestedSlug: "faq-job-prep-q01",
        suggestedHref: "/zh/guides/boundaries/faq-job-prep-q01",
      },
      {
        question: "语言不够能不能先投？",
        anchorId: "语言不够能不能先投",
        suggestedSlug: "faq-job-prep-q02",
        suggestedHref: "/zh/guides/boundaries/faq-job-prep-q02",
      },
    ]);
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
      "concept-hope-sorting",
      "https://kibouflow.com",
    );
    expect(md).not.toBeNull();
    expect(md!).toContain(
      "- URL: https://kibouflow.com/zh/guides/boundaries/concept-hope-sorting",
    );
    expect(md!).toContain("## TL;DR");
    expect(md!).toContain("## Common Mistakes");
    expect(md!).toContain("## Key Takeaways");
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
