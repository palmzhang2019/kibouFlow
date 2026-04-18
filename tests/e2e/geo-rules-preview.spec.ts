import { expect, test } from "@playwright/test";

test.describe("Admin login API", () => {
  test("login rejects wrong password when admin is configured", async ({ request }) => {
    const res = await request.post("/api/admin/login", {
      data: { password: "definitely-wrong-password-xyz" },
    });
    if (res.status() === 503) {
      test.skip();
      return;
    }
    expect(res.status()).toBe(401);
  });
});
