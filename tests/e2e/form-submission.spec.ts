import { expect, test } from "@playwright/test";

test.describe("Trial form submission flow", () => {
  test("zh trial form fields are fillable and submit button is interactive", async ({ page }) => {
    await page.goto("/zh/trial");
    await page.locator('input[name="name"]').fill("测试用户");
    await page.locator('input[name="contact"]').fill("test@example.com");
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
  });

  test("trial form shows validation when required fields are empty", async ({ page }) => {
    await page.goto("/zh/trial");
    const urlBeforeSubmit = page.url();
    await page.locator('input[name="name"]').evaluate((el) => (el as HTMLInputElement).reportValidity());
    await expect(page.locator('input[name="name"]:invalid')).toBeVisible();
    expect(page.url()).toBe(urlBeforeSubmit);
  });

  test("ja partner form fields are fillable and submit button is interactive", async ({ page }) => {
    await page.goto("/ja/partner");
    await page.locator('input[name="org_name"]').fill("テスト組織");
    await page.locator('input[name="contact_person"]').fill("田中太郎");
    await page.locator('input[name="contact_method"]').fill("test@example.com");
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
  });

  test("zh partner form fields are fillable and submit button is interactive", async ({ page }) => {
    await page.goto("/zh/partner");
    await page.locator('input[name="org_name"]').fill("测试组织");
    await page.locator('input[name="contact_person"]').fill("张三");
    await page.locator('input[name="contact_method"]').fill("test@example.com");
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
  });
});