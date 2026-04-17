import { POST } from "@/app/api/partner/route";

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
    getSupabaseMock.mockReturnValue(null);

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
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
    getSupabaseMock.mockReturnValue({ from: fromMock });

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
    expect(fromMock).toHaveBeenCalledWith("partner_submissions");
  });
});
