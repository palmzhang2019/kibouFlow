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

  it("collects non-fixed fields into extra", async () => {
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({
        event_name: "cta_click",
        page_path: "/zh/guides/paths/test",
        cta_id: "article-bottom-trial",
        cta_label: "免费整理",
        cta_href: "/zh/trial",
        cta_source: "article_bottom",
        content_type: "article",
        article_slug: "test",
        article_category: "paths",
        locale: "zh",
        session_id: "sess-1",
        user_agent: "test-agent",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(insertTrackingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "cta_click",
        page_path: "/zh/guides/paths/test",
        extra: expect.objectContaining({
          cta_id: "article-bottom-trial",
          cta_label: "免费整理",
          cta_href: "/zh/trial",
          cta_source: "article_bottom",
          content_type: "article",
          article_slug: "test",
          article_category: "paths",
        }),
      }),
    );
  });

  it("does not collect undefined values into extra", async () => {
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({
        event_name: "share_copy_link",
        page_path: "/zh/article/test",
        share_target: "copy_link",
        share_source: "article_bottom",
        content_type: "article",
        article_slug: "test",
        article_category: "paths",
        title: "Test Title",
        locale: "zh",
        session_id: "sess-1",
        user_agent: "agent",
        unknown_field: undefined,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const call = insertTrackingEventMock.mock.calls[0][0];
    expect(call.extra).not.toHaveProperty("unknown_field");
    expect(call.extra).toEqual({
      share_target: "copy_link",
      share_source: "article_bottom",
      content_type: "article",
      article_slug: "test",
      article_category: "paths",
      title: "Test Title",
    });
  });

  it("keeps page_view events working without extra", async () => {
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({
        event_name: "trial_page_view",
        page_path: "/zh/trial",
        locale: "zh",
        session_id: "sess-1",
        user_agent: "agent",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(insertTrackingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "trial_page_view",
        page_path: "/zh/trial",
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
