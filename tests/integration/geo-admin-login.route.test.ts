import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { GET as sessionGet } from "@/app/api/admin/session/route";
import { NextRequest } from "next/server";

const { cookiesMock, checkRateLimitMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  checkRateLimitMock: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

describe("admin login + session routes", () => {
  const origPwd = process.env.ADMIN_GEO_PASSWORD;
  const origSec = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.ADMIN_GEO_PASSWORD = "test-password-geo";
    process.env.ADMIN_SESSION_SECRET = "session-secret-key-32chars!!";
    checkRateLimitMock.mockReturnValue({ allowed: true });
    cookiesMock.mockReset();
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

  it("GET session returns authenticated true with valid cookie", async () => {
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
    const token = m![1];

    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: token })),
    });

    const res = await sessionGet();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      authenticated: true,
      configured: true,
    });
  });

  it("GET session returns authenticated false with invalid token", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "invalid-garbage" })),
    });

    const res = await sessionGet();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      authenticated: false,
      configured: true,
    });
  });

  it("POST login returns 503 when admin is not configured", async () => {
    delete process.env.ADMIN_GEO_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    const req = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "anything" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(503);
  });
});