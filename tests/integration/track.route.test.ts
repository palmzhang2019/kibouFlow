import { POST } from "@/app/api/track/route";

const { insertTrackingEventMock } = vi.hoisted(() => ({
  insertTrackingEventMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/pg-data", () => ({
  insertTrackingEvent: insertTrackingEventMock,
}));

describe("POST /api/track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok when database is not configured", async () => {
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
    expect(insertTrackingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "click",
        page_path: "/ja",
        user_agent: "a".repeat(500),
      }),
    );
  });

  it("handles missing event_name gracefully", async () => {
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({ page_path: "/zh" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("handles empty request body gracefully", async () => {
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
