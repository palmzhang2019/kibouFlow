import { expect, test } from "@playwright/test";

test.describe("Geo phase3 health and role APIs", () => {
  test("health endpoint is reachable", async ({ request }) => {
    const res = await request.get("/api/admin/geo/health?locale=zh&window=7");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("metrics");
    expect(body).toHaveProperty("highRiskPages");
  });

  test("me-role endpoint is reachable", async ({ request }) => {
    const res = await request.get("/api/admin/geo/me-role", {
      headers: { "x-admin-user": "e2e-user", "x-admin-role": "editor" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("role");
    expect(body).toHaveProperty("permissions");
  });
});
