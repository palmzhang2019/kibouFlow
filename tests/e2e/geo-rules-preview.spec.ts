import { expect, test } from "@playwright/test";

test.describe("Geo rules preview API", () => {
  test("changing thresholds changes extracted schema candidates", async ({ request }) => {
    const markdown = "## Q1\nA1\n\n## Q2\nA2\n\n## 判断框架\n1. S1\n2. S2";

    const lowThreshold = await request.post("/api/admin/geo/rules/preview", {
      data: {
        locale: "zh",
        markdown,
        ruleOverrides: {
          locale: "zh",
          faq_min_items: 2,
          howto_min_steps: 2,
        },
      },
    });
    expect(lowThreshold.ok()).toBeTruthy();
    const low = await lowThreshold.json();
    expect(low.faq.count).toBe(3);
    expect(low.howto.enabled).toBe(true);

    const highThreshold = await request.post("/api/admin/geo/rules/preview", {
      data: {
        locale: "zh",
        markdown,
        ruleOverrides: {
          locale: "zh",
          faq_min_items: 4,
          howto_min_steps: 3,
        },
      },
    });
    expect(highThreshold.ok()).toBeTruthy();
    const high = await highThreshold.json();
    expect(high.faq.count).toBe(0);
    expect(high.howto.enabled).toBe(false);
  });
});
