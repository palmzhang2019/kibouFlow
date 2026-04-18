import {
  compilePatterns,
  DEFAULT_SCHEMA_TOGGLES,
  isProtectedTogglePath,
} from "@/lib/geo-rules";
import { extractFaqPairsFromMarkdown } from "@/lib/faq-extractor";
import { extractHowToFromMarkdown } from "@/lib/howto-extractor";

describe("geo rules runtime", () => {
  it("protects homepage and article paths", () => {
    expect(isProtectedTogglePath("/zh")).toBe(true);
    expect(isProtectedTogglePath("/ja/guides/paths/demo")).toBe(true);
    expect(isProtectedTogglePath("/zh/guides")).toBe(false);
  });

  it("compiles regex string patterns", () => {
    const patterns = compilePatterns(["FAQ", "判断"]);
    expect(patterns[0].test("faq")).toBe(true);
    expect(patterns[1].test("判断框架")).toBe(true);
  });

  it("keeps defaults enabled for schema toggles", () => {
    expect(DEFAULT_SCHEMA_TOGGLES).toMatchObject({
      enable_article: true,
      enable_faqpage: true,
      enable_howto: true,
      enable_breadcrumb: true,
      enable_website: true,
    });
  });

  it("applies min items/min steps in extractors", () => {
    const markdown = `## 问题一\n答案一\n\n## 问题二\n答案二\n\n## 判断框架\n1. A\n2. B`;
    const faq = extractFaqPairsFromMarkdown(markdown, { minItems: 4 });
    const howto = extractHowToFromMarkdown(markdown, { minSteps: 3 });
    expect(faq).toEqual([]);
    expect(howto).toBeNull();
  });
});
