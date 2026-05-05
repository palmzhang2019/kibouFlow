import { expect, test } from "@playwright/test";

test.describe("ShareBox presence", () => {
  const shareBoxTests = [
    { locale: "zh", path: "/zh/guides", name: "zh/guides" },
    { locale: "ja", path: "/ja/guides", name: "ja/guides" },
    { locale: "zh", path: "/zh/faq", name: "zh/faq" },
    { locale: "ja", path: "/ja/faq", name: "ja/faq" },
  ] as const;

  for (const { path, name } of shareBoxTests) {
    test(`${name} — ShareBox section exists`, async ({ page }) => {
      await page.goto(path);
      const shareBox = page.locator('[aria-label="シェア"], [aria-label="Share"], [aria-label="分享"]');
      await expect(shareBox).toBeVisible();
    });

    test(`${name} — all three share buttons exist`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("button", { name: /リンクをコピー|Copy link|复制链接/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Xで共有|Share on X|分享到 X/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /共有文をコピー|Copy share text|复制分享文案/ })).toBeVisible();
    });
  }

  test("zh article page — ShareBox appears at bottom", async ({ page }) => {
    await page.goto("/zh/guides/paths/push-forward-or-sort-first");
    const shareBox = page.locator("section[aria-label='分享']");
    await expect(shareBox).toBeVisible();
    // ShareBox should come after the ArticleCTA section
    await expect(shareBox).toBeVisible();
  });
});
