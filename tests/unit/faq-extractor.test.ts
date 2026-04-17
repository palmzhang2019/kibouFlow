import { describe, expect, it } from "vitest";
import { extractFaqPairsFromMarkdown } from "@/lib/faq-extractor";

const FAQ_SNIPPET = `
## 学到什么程度适合求职？

关键不是证书等级，而是是否能稳定完成“简历表达 + 面试沟通 +岗位理解”。

## 先学语言还是先准备求职？

先判断短板位置。若语言表达严重拖后腿，优先补语言；若语言可用，转入求职准备。

## 下一步建议

先看案例。

## 语言和求职怎么并行？

建议用“岗位任务反推语言训练”：围绕自我介绍、项目说明、面试问答做场景化练习。
`;

describe("extractFaqPairsFromMarkdown", () => {
  it("extracts Q/A blocks and skips excluded headings", () => {
    const pairs = extractFaqPairsFromMarkdown(FAQ_SNIPPET);
    expect(pairs.length).toBeGreaterThanOrEqual(3);
    expect(pairs.map((p) => p.name)).not.toContain("下一步建议");
    expect(pairs.some((p) => p.name.includes("并行"))).toBe(true);
  });
});
