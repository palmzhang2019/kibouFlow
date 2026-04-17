import { POST } from "@/app/api/trial/route";

const { checkRateLimitMock, getSupabaseMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  getSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: getSupabaseMock,
}));

describe("POST /api/trial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({ allowed: true });
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

  it("returns 503 when database is not configured", async () => {
    getSupabaseMock.mockReturnValue(null);

    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "alice@example.com",
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });

  it("returns success for valid payload", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
    getSupabaseMock.mockReturnValue({ from: fromMock });

    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice",
        contact: "alice@example.com",
      }),
      headers: { "content-type": "application/json", "x-real-ip": "2.2.2.2" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(fromMock).toHaveBeenCalledWith("trial_submissions");
  });
});
