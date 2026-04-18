import { expect, test } from "@playwright/test";

test.describe("Admin GEO session API", () => {
  test("session endpoint is reachable without auth", async ({ request }) => {
    const res = await request.get("/api/admin/session");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("authenticated");
    expect(body.authenticated).toBe(false);
  });
});
