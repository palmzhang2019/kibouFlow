import { expect, test, type Page } from "@playwright/test";

async function collectSchemaTypes(page: Page): Promise<string[]> {
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  const types: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = await scripts.nth(i).textContent();
    if (!raw?.trim()) continue;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const pushType = (node: Record<string, unknown>) => {
      const t = node["@type"];
      if (typeof t === "string") types.push(t);
      else if (Array.isArray(t)) {
        for (const x of t) {
          if (typeof x === "string") types.push(x);
        }
      }
    };
    if (Array.isArray(data)) {
      for (const node of data) {
        if (node && typeof node === "object") pushType(node as Record<string, unknown>);
      }
    } else if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d["@graph"])) {
        for (const node of d["@graph"]) {
          if (node && typeof node === "object") pushType(node as Record<string, unknown>);
        }
      } else {
        pushType(d);
      }
    }
  }
  return types;
}

test.describe("Core locale and conversion flows", () => {
  test("zh and ja home pages are reachable", async ({ page }) => {
    const zh = await page.goto("/zh");
    expect(zh?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText("kibouFlow");

    const ja = await page.goto("/ja");
    expect(ja?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText("kibouFlow");
  });

  test("guides list and one detail article are reachable", async ({ page }) => {
    const guides = await page.goto("/zh/guides");
    expect(guides?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText("主题簇入口");
    await expect(page.locator("body")).toContainText("案例库");

    const firstGuide = page.locator('a[href^="/zh/guides/"]').first();
    await expect(firstGuide).toBeVisible();

    await firstGuide.click();
    await expect(page).toHaveURL(/\/zh\/guides\/.+\/.+/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("body")).toContainText("下一步建议");
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

  test("guides index exposes BreadcrumbList and WebSite JSON-LD", async ({ page }) => {
    const res = await page.goto("/zh/guides");
    expect(res?.ok()).toBeTruthy();
    const types = await collectSchemaTypes(page);
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("WebSite");
  });

  test("FAQ MDX article exposes FAQPage and Article JSON-LD", async ({ page }) => {
    const res = await page.goto("/zh/guides/boundaries/faq-japanese-path");
    expect(res?.ok()).toBeTruthy();
    const types = await collectSchemaTypes(page);
    expect(types).toContain("FAQPage");
    expect(types).toContain("Article");
    expect(types).toContain("BreadcrumbList");
  });

  test("cluster entry exposes HowTo and Article JSON-LD", async ({ page }) => {
    const res = await page.goto("/zh/guides/paths/japanese-learning-path-cluster-entry");
    expect(res?.ok()).toBeTruthy();
    const types = await collectSchemaTypes(page);
    expect(types).toContain("HowTo");
    expect(types).toContain("Article");
  });

  test("framework article exposes HowTo JSON-LD", async ({ page }) => {
    const res = await page.goto("/zh/guides/paths/framework-japanese-or-job-first");
    expect(res?.ok()).toBeTruthy();
    const types = await collectSchemaTypes(page);
    expect(types).toContain("HowTo");
    expect(types).toContain("Article");
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
