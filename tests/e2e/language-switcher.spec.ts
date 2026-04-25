import { expect, test } from "@playwright/test";

test.describe("Language switching", () => {
  test("language switcher button exists on zh home page", async ({ page }) => {
    await page.goto("/zh");
    const langBtn = page.locator('header button[title]').filter({ has: page.locator("svg") });
    await expect(langBtn).toBeVisible();
    const title = await langBtn.getAttribute("title");
    expect(title).toBeTruthy();
  });

  test("language switcher button exists on zh guides page", async ({ page }) => {
    await page.goto("/zh/guides");
    const langBtn = page.locator('header button[title]').filter({ has: page.locator("svg") });
    await expect(langBtn).toBeVisible();
  });

  test("language switcher button exists on zh trial page", async ({ page }) => {
    await page.goto("/zh/trial");
    const langBtn = page.locator('header button[title]').filter({ has: page.locator("svg") });
    await expect(langBtn).toBeVisible();
  });

  test("language switcher button exists on zh partner page", async ({ page }) => {
    await page.goto("/zh/partner");
    const langBtn = page.locator('header button[title]').filter({ has: page.locator("svg") });
    await expect(langBtn).toBeVisible();
  });

  test("language switcher button exists on zh faq page", async ({ page }) => {
    await page.goto("/zh/faq");
    const langBtn = page.locator('header button[title]').filter({ has: page.locator("svg") });
    await expect(langBtn).toBeVisible();
  });

  test("ja versions of pages are reachable directly", async ({ page }) => {
    const pages = ["/ja", "/ja/guides", "/ja/trial", "/ja/partner", "/ja/faq"];
    for (const path of pages) {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});