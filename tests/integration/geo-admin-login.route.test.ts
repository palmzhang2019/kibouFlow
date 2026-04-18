import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { GET as sessionGet } from "@/app/api/admin/session/route";
import { NextRequest } from "next/server";

describe("admin login + session routes", () => {
  const origPwd = process.env.ADMIN_GEO_PASSWORD;
  const origSec = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.ADMIN_GEO_PASSWORD = "test-password-geo";
    process.env.ADMIN_SESSION_SECRET = "session-secret-key-32chars!!";
  });

  afterEach(() => {
    if (origPwd === undefined) delete process.env.ADMIN_GEO_PASSWORD;
    else process.env.ADMIN_GEO_PASSWORD = origPwd;
    if (origSec === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = origSec;
  });

  it("GET session returns configured false when secrets missing", async () => {
    delete process.env.ADMIN_GEO_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    const res = await sessionGet();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      authenticated: false,
      configured: false,
    });
  });

  it("POST login returns 401 for wrong password", async () => {
    const req = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(401);
  });

  it("POST login returns 200 and sets cookie for correct password", async () => {
    const req = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "test-password-geo" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("geo_admin_session=");
  });
});
