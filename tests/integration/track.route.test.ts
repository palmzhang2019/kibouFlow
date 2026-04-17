import { POST } from "@/app/api/track/route";

const { getSupabaseMock } = vi.hoisted(() => ({
  getSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: getSupabaseMock,
}));

describe("POST /api/track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok when supabase is not configured", async () => {
    getSupabaseMock.mockReturnValue(null);

    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({ event_name: "view", page_path: "/zh" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("inserts tracking event and truncates long user_agent", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
    getSupabaseMock.mockReturnValue({ from: fromMock });

    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({
        event_name: "click",
        page_path: "/ja",
        user_agent: "a".repeat(800),
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith("tracking_events");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "click",
        page_path: "/ja",
        user_agent: "a".repeat(500),
      }),
    );
  });
});
