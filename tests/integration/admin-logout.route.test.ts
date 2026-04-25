import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/admin/logout/route";

describe("POST /api/admin/logout", () => {
  it("returns 200 with { ok: true }", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("sets set-cookie header to clear the session cookie", async () => {
    const res = await POST();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("geo_admin_session=");
  });

  it("sets Max-Age=0 so cookie expires immediately", async () => {
    const res = await POST();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("Max-Age=0");
  });

  it("sets HttpOnly flag on the clearing cookie", async () => {
    const res = await POST();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
  });

  it("sets Path=/ on the clearing cookie", async () => {
    const res = await POST();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("Path=/");
  });

  it("works without any request body", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("works regardless of whether a session existed", async () => {
    // Call twice — first with no session, second after a hypothetical session
    // Both should return the same successful response
    const res1 = await POST();
    const res2 = await POST();
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    await expect(res1.json()).resolves.toEqual({ ok: true });
    await expect(res2.json()).resolves.toEqual({ ok: true });
  });
});