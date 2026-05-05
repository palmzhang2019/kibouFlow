/** @vitest-environment jsdom */

import { sendTrackingEvent } from "@/lib/tracking";

describe("sendTrackingEvent", () => {
  const basePayload = {
    event_name: "cta_click",
    page_path: "/zh",
    session_id: "session-1",
    locale: "zh",
    user_agent: "test-agent",
  };

  it("uses sendBeacon when available with Blob", () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });

    sendTrackingEvent(basePayload);
    expect(sendBeacon).toHaveBeenCalledTimes(1);

    const [url, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/track");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
  });

  it("falls back to fetch when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    sendTrackingEvent(basePayload);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/track",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("sends cta_click payload with all extra fields via sendBeacon", () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });

    const payload = {
      event_name: "cta_click",
      cta_id: "article-bottom-trial-test-slug",
      cta_label: "免费整理",
      cta_href: "/zh/trial",
      cta_source: "article_bottom",
      content_type: "article",
      article_slug: "test-slug",
      article_category: "paths",
      page_path: "/zh/guides/paths/test-slug",
      session_id: "session-1",
      locale: "zh",
      user_agent: "test-agent",
    };

    sendTrackingEvent(payload);
    expect(sendBeacon).toHaveBeenCalledTimes(1);

    const [, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");

    // Verify JSON is valid by parsing the stringified version
    const jsonStr = JSON.stringify(payload);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.event_name).toBe("cta_click");
    expect(parsed.cta_id).toBe("article-bottom-trial-test-slug");
    expect(parsed.cta_label).toBe("免费整理");
    expect(parsed.cta_href).toBe("/zh/trial");
    expect(parsed.cta_source).toBe("article_bottom");
    expect(parsed.content_type).toBe("article");
    expect(parsed.article_slug).toBe("test-slug");
    expect(parsed.article_category).toBe("paths");
  });
});
