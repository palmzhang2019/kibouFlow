import { expect, test } from "@playwright/test";

test.describe("SEO metadata", () => {
  test("home page has correct meta tags for zh", async ({ page }) => {
    await page.goto("/zh");
    const title = await page.title();
    expect(title).toContain("kibouFlow");
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();
  });

  test("home page has correct meta tags for ja", async ({ page }) => {
    await page.goto("/ja");
    const title = await page.title();
    expect(title).toContain("kibouFlow");
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();
  });

  test("article page has og:title and og:description", async ({ page }) => {
    await page.goto("/zh/guides/boundaries/faq-japanese-path");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogDesc).toBeTruthy();
  });

  test("hreflang alternates are present on guides page", async ({ page }) => {
    await page.goto("/zh/guides");
    const hreflangZh = await page.locator('link[hreflang="zh"]').getAttribute("href");
    expect(hreflangZh).toBeTruthy();
    const hreflangJa = await page.locator('link[hreflang="ja"]').getAttribute("href");
    expect(hreflangJa).toBeTruthy();
    const hreflangDefault = await page.locator('link[hreflang="x-default"]').getAttribute("href");
    expect(hreflangDefault).toBeTruthy();
  });
});

test.describe("Bilingual content parity", () => {
  test("all four category pages are reachable in both locales", async ({ page }) => {
    const categories = ["problems", "paths", "boundaries", "cases"];
    const locales = ["zh", "ja"];
    for (const locale of locales) {
      for (const category of categories) {
        const res = await page.goto(`/${locale}/guides/${category}`);
        expect(res?.ok()).toBeTruthy();
      }
    }
  });
});