import { NextRequest, NextResponse } from "next/server";
import { geoRulesPreviewSchema } from "@/lib/schemas";
import { extractFaqPairsFromMarkdown } from "@/lib/faq-extractor";
import { extractHowToFromMarkdown } from "@/lib/howto-extractor";
import { compilePatterns, DEFAULT_GEO_RULES } from "@/lib/geo-rules";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = geoRulesPreviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const merged = {
      ...DEFAULT_GEO_RULES,
      locale: parsed.data.locale,
      ...parsed.data.ruleOverrides,
    };
    const faqExcludePatterns = compilePatterns(merged.faq_exclude_heading_patterns);
    const howtoSectionPatterns = compilePatterns(merged.howto_section_patterns);

    const faqPairs = extractFaqPairsFromMarkdown(parsed.data.markdown, {
      excludeHeadingPatterns: faqExcludePatterns,
      minItems: merged.faq_min_items,
    });
    const howto = extractHowToFromMarkdown(parsed.data.markdown, {
      sectionPatterns: howtoSectionPatterns,
      minSteps: merged.howto_min_steps,
    });

    return NextResponse.json({
      ruleConfig: merged,
      faq: {
        count: faqPairs.length,
        pairs: faqPairs,
      },
      howto: {
        enabled: !!howto,
        result: howto,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
