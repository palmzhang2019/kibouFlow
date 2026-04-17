import { describe, expect, it } from "vitest";
import { extractHowToFromMarkdown } from "@/lib/howto-extractor";

const CLUSTER_SNIPPET = `
## 推荐阅读顺序

1. [\`日语和求职可以并行吗？\`](/guides/paths/parallel-japanese-and-job)
2. [\`先补日语还是先求职：判断框架\`](/guides/paths/framework-japanese-or-job-first)
3. [\`日语学习路径 FAQ\`](/guides/boundaries/faq-japanese-path)

## 常见误区

- 把证书等级当作实际求职能力。
`;

describe("extractHowToFromMarkdown", () => {
  it("extracts ordered list under 推荐阅读顺序 and strips markdown links", () => {
    const howTo = extractHowToFromMarkdown(CLUSTER_SNIPPET);
    expect(howTo).not.toBeNull();
    expect(howTo!.steps.length).toBeGreaterThanOrEqual(3);
    expect(howTo!.steps[0].text).toContain("并行");
    expect(howTo!.steps[0].text).not.toContain("](");
  });

  it("extracts 判断维度 section in framework-style content", () => {
    const md = `
## 判断维度

1. **表达维度**：能否用日语说明经历、成果、目标岗位。
2. **理解维度**：能否读懂岗位描述并提炼要求。
3. **沟通维度**：能否完成基础面试往返问答。
`;
    const howTo = extractHowToFromMarkdown(md);
    expect(howTo).not.toBeNull();
    expect(howTo!.steps.length).toBe(3);
    expect(howTo!.steps[0].text).toContain("表达维度");
  });
});
