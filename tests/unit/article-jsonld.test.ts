import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { getArticleBySlug } from "@/lib/content";
import {
  absoluteUrl,
  getSiteUrl,
  localeToInLanguage,
  organizationId,
  websiteIdForLocale,
} from "@/lib/seo/site-url";

function buildArticleJsonLdShape(
  article: NonNullable<ReturnType<typeof getArticleBySlug>>,
  locale: string,
) {
  const site = getSiteUrl();
  const pagePath = `/${locale}${article.href}`;
  const pageUrl = absoluteUrl(pagePath, site);
  const webpageId = `${pageUrl}#webpage`;
  const aboutThings = article.about?.map((name) => ({ "@type": "Thing", name }));
  const normalizedAbout =
    aboutThings && aboutThings.length > 0 ? aboutThings : undefined;
  const mentions = article.mentions?.map((name) => ({ "@type": "Thing", name }));
  const keywords = Array.from(
    new Set(
      [
        article.category,
        article.contentType,
        article.cluster,
        ...(article.about ?? []),
      ].filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  const shape: Record<string, unknown> = {
    "@type": "Article",
    url: pageUrl,
    inLanguage: localeToInLanguage(locale),
    abstract: article.tldr?.[0] || article.description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": webpageId,
    },
    isPartOf: { "@id": websiteIdForLocale(locale, site) },
    publisher: { "@id": organizationId(site) },
    "about": normalizedAbout,
    ...(mentions && mentions.length > 0 ? { mentions } : {}),
    ...(keywords.length > 0 ? { keywords } : {}),
  };
  // 对齐组件：运行时 undefined 会被 stripUndefinedDeep 清掉，这里等价处理。
  if (shape["about"] === undefined) delete shape["about"];
  return shape as Record<string, unknown> & { about?: unknown[] };
}

describe("Article JSON-LD shape", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("includes absolute url, inLanguage, and abstract for a real article", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://kibouflow.com";
    const article = getArticleBySlug("zh", "boundaries", "faq-japanese-path");
    expect(article).not.toBeNull();
    const shape = buildArticleJsonLdShape(article!, "zh");
    expect(shape.url).toBe("https://kibouflow.com/zh/guides/boundaries/faq-japanese-path");
    expect(shape.inLanguage).toBe("zh-CN");
    expect(shape.abstract).toBeDefined();
    expect(shape.isPartOf["@id"]).toBe("https://kibouflow.com/zh/#website");
  });

  it("maps about, mentions, and keywords when the article provides them", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://kibouflow.com";
    const article = getArticleBySlug("zh", "boundaries", "concept-hope-sorting");
    expect(article).not.toBeNull();
    const shape = buildArticleJsonLdShape(article!, "zh");
    expect(shape.about).toEqual([
      { "@type": "Thing", name: "希望整理" },
      { "@type": "Thing", name: "方向判断" },
    ]);
    expect(shape.mentions).toEqual([
      { "@type": "Thing", name: "需求澄清" },
      { "@type": "Thing", name: "优先级判断" },
    ]);
    expect(shape.keywords).toContain("boundaries");
    expect(shape.keywords).toContain("concept");
    expect(shape.keywords).toContain("direction-sorting");
    expect(shape.keywords).toContain("希望整理");
  });

  it("keeps about stable for high-value FAQ pages without explicit frontmatter about", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://kibouflow.com";
    const article = getArticleBySlug("zh", "boundaries", "faq-japanese-path");
    expect(article).not.toBeNull();
    const shape = buildArticleJsonLdShape(article!, "zh");
    expect(shape.about).toEqual([
      { "@type": "Thing", name: "日语学习路径 FAQ" },
      { "@type": "Thing", name: "日语学习路径" },
    ]);
  });

  it('exposes a literal "about": key in ArticleJsonLd source for GEO audit scanner', () => {
    // 与 scripts/geo_principles_audit.py 的 src_article_about_key 正则完全一致：
    //   f.src_article_about_key = grep_src(src, r'"about"\s*:')
    // 该测试确保模板层存在稳定的 "about": 字面量，避免 TEMPLATE_ARTICLE_ABOUT_MISSING 回归。
    const filePath = path.join(
      process.cwd(),
      "src",
      "components",
      "seo",
      "ArticleJsonLd.tsx",
    );
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toMatch(/"about"\s*:/);
  });
});
