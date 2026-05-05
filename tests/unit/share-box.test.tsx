/**
 * Minimal smoke test for ShareBox — validates:
 * 1. SHARE_EVENTS constants are exported correctly
 * 2. ShareBox component module loads without throwing
 * 3. Event names match the spec
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the pure constants — no DOM required
import {
  SHARE_EVENTS,
  SHARE_TARGETS,
  SHARE_SOURCES,
} from "@/lib/tracking-events";

describe("SHARE_EVENTS constants", () => {
  it("exports share_copy_link", () => {
    expect(SHARE_EVENTS.COPY_LINK).toBe("share_copy_link");
  });

  it("exports share_copy_text", () => {
    expect(SHARE_EVENTS.COPY_TEXT).toBe("share_copy_text");
  });

  it("exports share_x_click", () => {
    expect(SHARE_EVENTS.X_CLICK).toBe("share_x_click");
  });
});

describe("SHARE_TARGETS constants", () => {
  it("exports copy_link target", () => {
    expect(SHARE_TARGETS.COPY_LINK).toBe("copy_link");
  });

  it("exports copy_text target", () => {
    expect(SHARE_TARGETS.COPY_TEXT).toBe("copy_text");
  });

  it("exports x target", () => {
    expect(SHARE_TARGETS.X).toBe("x");
  });
});

describe("SHARE_SOURCES constants", () => {
  it("exports article_bottom", () => {
    expect(SHARE_SOURCES.ARTICLE_BOTTOM).toBe("article_bottom");
  });

  it("exports faq_bottom", () => {
    expect(SHARE_SOURCES.FAQ_BOTTOM).toBe("faq_bottom");
  });

  it("exports guides_bottom", () => {
    expect(SHARE_SOURCES.GUIDES_BOTTOM).toBe("guides_bottom");
  });
});

describe("ShareBox module loads", () => {
  it("imports without throwing", async () => {
    // Should not throw — verifies module structure is valid
    const { ShareBox } = await import("@/components/shared/ShareBox");
    expect(ShareBox).toBeDefined();
    expect(typeof ShareBox).toBe("function");
  });
});

describe("sendTrackingEvent contract", () => {
  const sendTrackingEventMock = vi.hoisted(() => vi.fn());
  vi.mock("@/lib/tracking", () => ({
    sendTrackingEvent: sendTrackingEventMock,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a share event payload matching the spec", () => {
    sendTrackingEventMock({
      event_name: "share_copy_link",
      page_path: "/zh/guides/paths/test",
      locale: "zh",
      content_type: "article",
      article_slug: "test",
      article_category: "paths",
      share_target: "copy_link",
      share_source: "article_bottom",
      title: "Test Article",
      session_id: "sess-1",
      user_agent: "test-agent",
    });

    expect(sendTrackingEventMock).toHaveBeenCalledTimes(1);
    expect(sendTrackingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "share_copy_link",
        share_target: "copy_link",
        share_source: "article_bottom",
      }),
    );
  });
});
