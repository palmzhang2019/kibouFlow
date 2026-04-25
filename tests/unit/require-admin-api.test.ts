import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { requireAdminApiAuth } from "@/lib/require-admin-api";
import { GEO_ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const mockGetAdminSecrets = vi.hoisted(() => vi.fn());
const mockVerifyAdminSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-session", () => ({
  getAdminSecrets: mockGetAdminSecrets,
  verifyAdminSession: mockVerifyAdminSession,
  signAdminSession: (secret: string, ttl: number) => {
    const { signAdminSession: real } = vi.importActual("@/lib/admin-session");
    return real(secret, ttl);
  },
  GEO_ADMIN_SESSION_COOKIE: "geo_admin_session",
}));

describe("requireAdminApiAuth", () => {
  it("returns 503 when admin is not configured", () => {
    mockGetAdminSecrets.mockReturnValue(null);

    const request = new NextRequest("http://localhost/api/test", {
      headers: {},
    });
    const result = requireAdminApiAuth(request);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(503);
  });

  it("returns 401 when cookie is missing", () => {
    mockGetAdminSecrets.mockReturnValue({ password: "pw", sessionSecret: "secret-16chars!!!" });
    mockVerifyAdminSession.mockReturnValue(false);

    const request = new NextRequest("http://localhost/api/test", {
      headers: {},
    });
    const result = requireAdminApiAuth(request);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });

  it("returns 401 when token is invalid", () => {
    mockGetAdminSecrets.mockReturnValue({ password: "pw", sessionSecret: "secret-16chars!!!" });
    mockVerifyAdminSession.mockReturnValue(false);

    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: `${GEO_ADMIN_SESSION_COOKIE}=bad-token` },
    });
    const result = requireAdminApiAuth(request);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });

  it("returns ok true when session is valid", () => {
    mockGetAdminSecrets.mockReturnValue({ password: "pw", sessionSecret: "secret-16chars!!!" });
    mockVerifyAdminSession.mockReturnValue(true);

    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: `${GEO_ADMIN_SESSION_COOKIE}=valid-token` },
    });
    const result = requireAdminApiAuth(request);
    expect(result.ok).toBe(true);
  });
});
