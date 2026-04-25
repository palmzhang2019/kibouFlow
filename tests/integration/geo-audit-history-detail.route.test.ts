import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/admin/geo-audit/history/[id]/route";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { NextRequest } from "next/server";

const { checkRateLimitMock, getGeoAuditRunByIdMock, mergeMetaMock, resolvePayloadMock, mergeScoresMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  getGeoAuditRunByIdMock: vi.fn(),
  mergeMetaMock: vi.fn(),
  resolvePayloadMock: vi.fn(),
  mergeScoresMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/geo-audit-runs", () => ({
  getGeoAuditRunById: getGeoAuditRunByIdMock,
  mergeGeoAuditRunMetaFromReportJson: mergeMetaMock,
  resolveGeoAuditReportPayload: resolvePayloadMock,
}));

vi.mock("@/lib/geo-audit-scores", () => ({
  mergeScoreColumnsWithReportJson: mergeScoresMock,
}));

describe("GET /api/admin/geo-audit/history/[id]", () => {
  const origPwd = process.env.ADMIN_GEO_PASSWORD;
  const origSec = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.ADMIN_GEO_PASSWORD = "test-password-geo";
    process.env.ADMIN_SESSION_SECRET = "session-secret-key-32chars!!";
    checkRateLimitMock.mockReturnValue({ allowed: true });
    getGeoAuditRunByIdMock.mockReset();
    mergeMetaMock.mockReset();
    resolvePayloadMock.mockReset();
    mergeScoresMock.mockReset();
  });

  afterEach(() => {
    if (origPwd === undefined) delete process.env.ADMIN_GEO_PASSWORD;
    else process.env.ADMIN_GEO_PASSWORD = origPwd;
    if (origSec === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = origSec;
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

  it("returns 401 without session cookie", async () => {
    const req = new NextRequest("http://localhost/api/admin/geo-audit/history/some-id");
    const res = await GET(req, { params: Promise.resolve({ id: "some-uuid" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty id", async () => {
    const cookie = await sessionCookie();
    const req = new NextRequest("http://localhost/api/admin/geo-audit/history/some-id", {
      headers: { cookie },
    });
    const res = await GET(req, { params: Promise.resolve({ id: "" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when id exceeds 80 characters", async () => {
    const cookie = await sessionCookie();
    const longId = "a".repeat(81);
    const req = new NextRequest("http://localhost/api/admin/geo-audit/history/some-id", {
      headers: { cookie },
    });
    const res = await GET(req, { params: Promise.resolve({ id: longId }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when getGeoAuditRunById returns null", async () => {
    const cookie = await sessionCookie();
    getGeoAuditRunByIdMock.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/admin/geo-audit/history/some-id", {
      headers: { cookie },
    });
    const res = await GET(req, { params: Promise.resolve({ id: "valid-uuid" }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 with full fields when getGeoAuditRunById returns a row", async () => {
    const cookie = await sessionCookie();
    const mockRow = {
      id: "run-001",
      status: "completed",
      started_at: new Date("2026-01-01T00:00:00Z"),
      finished_at: new Date("2026-01-01T00:01:00Z"),
      overall_score: 85,
      retrievability_score: 90,
      chunkability_score: 80,
      extractability_score: 88,
      trust_score: 82,
      attributability_score: 85,
      report_markdown: "# Audit Report",
      report_json: { scores: {} },
      error_message: null,
    };
    getGeoAuditRunByIdMock.mockResolvedValue(mockRow);
    mergeMetaMock.mockReturnValue({ used_llm: false, llm_model: null, script_version: "1.0.0", target_path: "/tmp" });
    resolvePayloadMock.mockReturnValue({});
    mergeScoresMock.mockReturnValue({
      overall_score: 85,
      retrievability_score: 90,
      chunkability_score: 80,
      extractability_score: 88,
      trust_score: 82,
      attributability_score: 85,
    });

    const req = new NextRequest("http://localhost/api/admin/geo-audit/history/run-001", {
      headers: { cookie },
    });
    const res = await GET(req, { params: Promise.resolve({ id: "run-001" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("run-001");
    expect(body.status).toBe("completed");
    expect(body.overall_score).toBe(85);
    expect(body.report_markdown).toBe("# Audit Report");
    expect(body.used_llm).toBe(false);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, retryAfterMs: 1000 });
    const req = new NextRequest("http://localhost/api/admin/geo-audit/history/some-id");
    const res = await GET(req, { params: Promise.resolve({ id: "some-uuid" }) });
    expect(res.status).toBe(429);
  });
});