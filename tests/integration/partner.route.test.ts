import { POST } from "@/app/api/partner/route";

const { checkRateLimitMock, insertPartnerSubmissionMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  insertPartnerSubmissionMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/pg-data", () => ({
  insertPartnerSubmission: insertPartnerSubmissionMock,
}));

describe("POST /api/partner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({ allowed: true });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, retryAfterMs: 1000 });

    const req = new Request("http://localhost/api/partner", { method: "POST" });
    const res = await POST(req as never);

    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid payload", async () => {
    const req = new Request("http://localhost/api/partner", {
      method: "POST",
      body: JSON.stringify({ org_name: "Kibou" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 when database is not configured", async () => {
    insertPartnerSubmissionMock.mockResolvedValue({ ok: false, reason: "not_configured" });

    const req = new Request("http://localhost/api/partner", {
      method: "POST",
      body: JSON.stringify({
        org_name: "Kibou",
        contact_person: "Bob",
        contact_method: "bob@example.com",
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "3.3.3.3" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });

  it("returns success for valid payload", async () => {
    insertPartnerSubmissionMock.mockResolvedValue({ ok: true });

    const req = new Request("http://localhost/api/partner", {
      method: "POST",
      body: JSON.stringify({
        org_name: "Kibou",
        contact_person: "Bob",
        contact_method: "bob@example.com",
      }),
      headers: { "content-type": "application/json", "x-real-ip": "4.4.4.4" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(insertPartnerSubmissionMock).toHaveBeenCalledWith(
      "4.4.4.4",
      expect.objectContaining({
        org_name: "Kibou",
        contact_person: "Bob",
        contact_method: "bob@example.com",
      }),
    );
  });

  it("returns error status when database insert fails", async () => {
    insertPartnerSubmissionMock.mockResolvedValue({ ok: false, reason: "insert_failed", detail: "connection refused" });
    const req = new Request("http://localhost/api/partner", {
      method: "POST",
      body: JSON.stringify({ org_name: "Kibou", contact_person: "Bob", contact_method: "bob@example.com" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).not.toBe(200);
  });

  it("extracts IP from x-forwarded-for with multiple IPs", async () => {
    insertPartnerSubmissionMock.mockResolvedValue({ ok: true });
    const req = new Request("http://localhost/api/partner", {
      method: "POST",
      body: JSON.stringify({ org_name: "Kibou", contact_person: "Bob", contact_method: "bob@example.com" }),
      headers: { "content-type": "application/json", "x-forwarded-for": "5.5.5.5, 6.6.6.6" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(insertPartnerSubmissionMock).toHaveBeenCalledWith(
      "5.5.5.5",
      expect.any(Object),
    );
  });
});
