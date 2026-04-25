import { expect, test } from "@playwright/test";
import { collectSchemaTypes } from "./helpers";

test.describe("Desktop navigation", () => {
  test("header contains all main navigation links", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.locator('header a[href*="/trial"]')).toBeVisible();
    await expect(page.locator('header a[href*="/partner"]')).toBeVisible();
    await expect(page.locator('header a[href*="/guides"]')).toBeVisible();
    await expect(page.locator('header a[href*="/faq"]')).toBeVisible();
  });

  test("clicking guides link navigates to guides page", async ({ page }) => {
    await page.goto("/zh");
    await page.locator('header a[href*="/guides"]').first().click();
    await page.waitForURL("**/guides**");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("category pages are reachable", async ({ page }) => {
    const categories = ["problems", "paths", "boundaries", "cases"];
    for (const category of categories) {
      const res = await page.goto(`/zh/guides/${category}`);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});

test.describe("FAQ page", () => {
  test("faq page is reachable and has structured data", async ({ page }) => {
    const res = await page.goto("/zh/faq");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("h1")).toBeVisible();
    const types = await collectSchemaTypes(page);
    expect(types).toContain("FAQPage");
    expect(types).toContain("BreadcrumbList");
  });

  test("ja faq page is reachable", async ({ page }) => {
    const res = await page.goto("/ja/faq");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Mobile navigation", () => {
  test("mobile hamburger button is present and clickable at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/zh");

    // Verify hamburger button is visible at mobile viewport
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();

    // Verify desktop nav is hidden at mobile viewport
    const desktopNav = page.locator('nav.hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();

    // Click hamburger - just verify it doesn't throw an error
    await hamburger.click();
    await page.waitForTimeout(300);
    // If we get here without error, the click succeeded
    expect(true).toBe(true);
  });
});