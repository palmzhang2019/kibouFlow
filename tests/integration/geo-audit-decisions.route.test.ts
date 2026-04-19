import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { POST as decisionsPost } from "@/app/api/admin/geo-audit/decisions/route";

describe("admin geo-audit decisions API", () => {
  const origPwd = process.env.ADMIN_GEO_PASSWORD;
  const origSec = process.env.ADMIN_SESSION_SECRET;
  const origDb = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.ADMIN_GEO_PASSWORD = "test-password-geo";
    process.env.ADMIN_SESSION_SECRET = "session-secret-key-32chars!!";
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (origPwd === undefined) delete process.env.ADMIN_GEO_PASSWORD;
    else process.env.ADMIN_GEO_PASSWORD = origPwd;
    if (origSec === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = origSec;
    if (origDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = origDb;
  });

  async function sessionCookie(): Promise<string> {
    const loginReq = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "test-password-geo" }),
    });
    const loginRes = await loginPost(loginReq);
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    const m = setCookie.match(/geo_admin_session=([^;]+)/);
    expect(m).toBeTruthy();
    return `geo_admin_session=${m![1]}`;
  }

  it("POST decisions returns 503 without DATABASE_URL", async () => {
    const cookie = await sessionCookie();
    const res = await decisionsPost(
      new NextRequest("http://localhost/api/admin/geo-audit/decisions", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ issueId: "00000000-0000-4000-8000-000000000001", choice: "ignore" }),
      }),
    );
    expect(res.status).toBe(503);
  });
});
