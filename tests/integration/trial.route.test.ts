import { POST } from "@/app/api/trial/route";

const { checkRateLimitMock, insertTrialSubmissionMock, hasRecentTrialSubmissionByEmailMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  insertTrialSubmissionMock: vi.fn(),
  hasRecentTrialSubmissionByEmailMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/pg-data", () => ({
  insertTrialSubmission: insertTrialSubmissionMock,
  hasRecentTrialSubmissionByEmail: hasRecentTrialSubmissionByEmailMock,
}));

describe("POST /api/trial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({ allowed: true });
    hasRecentTrialSubmissionByEmailMock.mockResolvedValue(false);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, retryAfterMs: 1000 });

    const req = new Request("http://localhost/api/trial", { method: "POST" });
    const res = await POST(req as never);

    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid payload", async () => {
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when japanese_level is missing", async () => {
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "alice@example.com",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when contact is not a valid email", async () => {
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "not-an-email",
        japanese_level: "n3",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 when database is not configured", async () => {
    insertTrialSubmissionMock.mockResolvedValue({ ok: false, reason: "not_configured" });

    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "alice@example.com",
        japanese_level: "n3",
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });

  it("returns success for valid payload", async () => {
    insertTrialSubmissionMock.mockResolvedValue({ ok: true });

    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "alice@example.com",
        japanese_level: "n3",
      }),
      headers: { "content-type": "application/json", "x-real-ip": "2.2.2.2" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(insertTrialSubmissionMock).toHaveBeenCalledWith(
      "2.2.2.2",
      expect.objectContaining({
        name: "Alice",
        contact: "alice@example.com",
        japanese_level: "n3",
      }),
    );
  });

  it("returns error status when database insert fails", async () => {
    insertTrialSubmissionMock.mockResolvedValue({ ok: false, reason: "insert_failed", detail: "connection refused" });
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", contact: "alice@example.com", japanese_level: "n3" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).not.toBe(200);
  });

  it("extracts IP from x-forwarded-for with multiple IPs", async () => {
    insertTrialSubmissionMock.mockResolvedValue({ ok: true });
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", contact: "alice@example.com", japanese_level: "n3" }),
      headers: { "content-type": "application/json", "x-forwarded-for": "3.3.3.3, 4.4.4.4" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(insertTrialSubmissionMock).toHaveBeenCalledWith(
      "3.3.3.3",
      expect.any(Object),
    );
  });

  it("returns 429 with duplicate_email when email already submitted recently", async () => {
    hasRecentTrialSubmissionByEmailMock.mockResolvedValue(true);

    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "alice@example.com",
        japanese_level: "n3",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("duplicate_email");
    expect(insertTrialSubmissionMock).not.toHaveBeenCalled();
  });

  it("allows submission when email check returns false (DB not configured)", async () => {
    hasRecentTrialSubmissionByEmailMock.mockResolvedValue(false);
    insertTrialSubmissionMock.mockResolvedValue({ ok: true });

    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "alice@example.com",
        japanese_level: "n3",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });
});
