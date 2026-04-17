import { expect, test } from "@playwright/test";

test.describe("Core locale and conversion flows", () => {
  test("zh and ja home pages are reachable", async ({ page }) => {
    const zh = await page.goto("/zh");
    expect(zh?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText("GEO");

    const ja = await page.goto("/ja");
    expect(ja?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText("GEO");
  });

  test("guides list and one detail article are reachable", async ({ page }) => {
    const guides = await page.goto("/zh/guides");
    expect(guides?.ok()).toBeTruthy();

    const firstGuide = page.locator('a[href^="/zh/guides/"]').first();
    await expect(firstGuide).toBeVisible();

    await firstGuide.click();
    await expect(page).toHaveURL(/\/zh\/guides\/.+\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("trial page form fields and success page are reachable", async ({ page }) => {
    await page.goto("/zh/trial");
    await expect(page.locator('form input[name="name"]')).toBeVisible();
    await expect(page.locator('form input[name="contact"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();

    const success = await page.goto("/zh/trial/success");
    expect(success?.ok()).toBeTruthy();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("partner page form fields and success page are reachable", async ({ page }) => {
    await page.goto("/ja/partner");
    await expect(page.locator('form input[name="org_name"]')).toBeVisible();
    await expect(page.locator('form input[name="contact_person"]')).toBeVisible();
    await expect(page.locator('form input[name="contact_method"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();

    const success = await page.goto("/ja/partner/success");
    expect(success?.ok()).toBeTruthy();
    await expect(page.locator("h1")).toBeVisible();
  });
});
