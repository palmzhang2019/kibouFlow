import { describe, expect, it } from "vitest";
import { extractFaqPairsFromMarkdown } from "@/lib/faq-extractor";
import { extractHowToFromMarkdown } from "@/lib/howto-extractor";
import { compilePatterns, DEFAULT_GEO_RULES } from "@/lib/geo-rules";

describe("markdown geo extractors (formerly rules preview API)", () => {
  const markdown = "## Q1\nA1\n\n## Q2\nA2\n\n## 判断框架\n1. S1\n2. S2";

  it("respects faq_min_items threshold", () => {
    const low = extractFaqPairsFromMarkdown(markdown, {
      excludeHeadingPatterns: compilePatterns(
        DEFAULT_GEO_RULES.faq_exclude_heading_patterns,
      ),
      minItems: 2,
    });
    expect(low.length).toBe(3);

    const high = extractFaqPairsFromMarkdown(markdown, {
      excludeHeadingPatterns: compilePatterns(
        DEFAULT_GEO_RULES.faq_exclude_heading_patterns,
      ),
      minItems: 4,
    });
    expect(high.length).toBe(0);
  });

  it("respects howto_min_steps threshold", () => {
    const merged = { ...DEFAULT_GEO_RULES, howto_section_patterns: ["判断框架"] };
    const howtoOk = extractHowToFromMarkdown(markdown, {
      sectionPatterns: compilePatterns(merged.howto_section_patterns),
      minSteps: 2,
    });
    expect(howtoOk?.steps.length).toBeGreaterThanOrEqual(2);

    const howtoHigh = extractHowToFromMarkdown(markdown, {
      sectionPatterns: compilePatterns(merged.howto_section_patterns),
      minSteps: 3,
    });
    expect(howtoHigh).toBeNull();
  });
});
