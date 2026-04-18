import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST as runPost } from "@/app/api/admin/geo-audit/run/route";
import { GET as historyGet } from "@/app/api/admin/geo-audit/history/route";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { NextRequest } from "next/server";

describe("admin geo-audit API routes", () => {
  const origPwd = process.env.ADMIN_GEO_PASSWORD;
  const origSec = process.env.ADMIN_SESSION_SECRET;
  const origSkip = process.env.GEO_AUDIT_SKIP;
  const origDb = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.ADMIN_GEO_PASSWORD = "test-password-geo";
    process.env.ADMIN_SESSION_SECRET = "session-secret-key-32chars!!";
    process.env.GEO_AUDIT_SKIP = "1";
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (origPwd === undefined) delete process.env.ADMIN_GEO_PASSWORD;
    else process.env.ADMIN_GEO_PASSWORD = origPwd;
    if (origSec === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = origSec;
    if (origSkip === undefined) delete process.env.GEO_AUDIT_SKIP;
    else process.env.GEO_AUDIT_SKIP = origSkip;
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

  it("GET history returns 401 without session", async () => {
    const res = await historyGet(new NextRequest("http://localhost/api/admin/geo-audit/history"));
    expect(res.status).toBe(401);
  });

  it("GET history returns items array when authenticated", async () => {
    const cookie = await sessionCookie();
    const res = await historyGet(
      new NextRequest("http://localhost/api/admin/geo-audit/history", {
        headers: { cookie },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("POST run returns ok with GEO_AUDIT_SKIP and persisted false without DATABASE_URL", async () => {
    const cookie = await sessionCookie();
    const res = await runPost(
      new NextRequest("http://localhost/api/admin/geo-audit/run", {
        method: "POST",
        headers: { cookie },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; persisted: boolean; markdown: string };
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(false);
    expect(body.markdown).toContain("GEO_AUDIT_SKIP");
  });
});
