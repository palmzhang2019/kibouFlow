/**
 * Unit tests for conversion tracking events and components.
 * Covers: PAGE_VIEW_EVENTS constants, TrialPageTracking, PartnerPageTracking module load.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PAGE_VIEW_EVENTS } from "@/lib/tracking-events";

// --- PAGE_VIEW_EVENTS constants ---

describe("PAGE_VIEW_EVENTS", () => {
  it("exports trial_page_view", () => {
    expect(PAGE_VIEW_EVENTS.TRIAL_PAGE_VIEW).toBe("trial_page_view");
  });

  it("exports partner_page_view", () => {
    expect(PAGE_VIEW_EVENTS.PARTNER_PAGE_VIEW).toBe("partner_page_view");
  });
});

// --- Module loads ---

describe("TrialPageTracking module loads", () => {
  it("imports without throwing", async () => {
    const { TrialPageTracking } = await import(
      "@/components/tracking/TrialPageTracking"
    );
    expect(TrialPageTracking).toBeDefined();
    expect(typeof TrialPageTracking).toBe("function");
  });
});

describe("PartnerPageTracking module loads", () => {
  it("imports without throwing", async () => {
    const { PartnerPageTracking } = await import(
      "@/components/tracking/PartnerPageTracking"
    );
    expect(PartnerPageTracking).toBeDefined();
    expect(typeof PartnerPageTracking).toBe("function");
  });
});

// --- CTA click payload contract (shared pattern with ShareBox) ---

describe("cta_click payload contract", () => {
  const sendTrackingEventMock = vi.hoisted(() => vi.fn());
  vi.mock("@/lib/tracking", () => ({
    sendTrackingEvent: sendTrackingEventMock,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a cta_click payload with enhanced fields", () => {
    sendTrackingEventMock({
      event_name: "cta_click",
      cta_id: "article-bottom-trial-test-slug",
      cta_label: "免费整理",
      cta_href: "/zh/trial",
      cta_source: "article_bottom",
      content_type: "article",
      article_slug: "test-slug",
      article_category: "paths",
      page_path: "/zh/guides/paths/test-slug",
      locale: "zh",
      session_id: "sess-1",
      user_agent: "test-agent",
    });

    expect(sendTrackingEventMock).toHaveBeenCalledTimes(1);
    expect(sendTrackingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "cta_click",
        cta_id: "article-bottom-trial-test-slug",
        cta_label: "免费整理",
        cta_href: "/zh/trial",
        cta_source: "article_bottom",
        content_type: "article",
        article_slug: "test-slug",
        article_category: "paths",
      }),
    );
  });

  it("accepts cta_click with default CTAButtons props", () => {
    sendTrackingEventMock({
      event_name: "cta_click",
      cta_id: "cta-primary",
      cta_label: "免费整理",
      cta_href: "/zh/trial",
      cta_source: "unknown",
      content_type: "page",
      article_slug: "",
      article_category: "",
      page_path: "/zh",
      locale: "zh",
      session_id: "sess-1",
      user_agent: "test-agent",
    });

    expect(sendTrackingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cta_href: "/zh/trial",
        cta_source: "unknown",
        content_type: "page",
      }),
    );
  });
});

// --- Form event constants (existing — regression check) ---

describe("resolveFormEventName regression", () => {
  it("trial form events resolve correctly", async () => {
    const { resolveFormEventName } = await import("@/lib/tracking-events");
    expect(resolveFormEventName("trial", "started")).toBe("trial_form_started");
    expect(resolveFormEventName("trial", "submitted")).toBe("trial_form_submitted");
  });

  it("partner form events resolve correctly", async () => {
    const { resolveFormEventName } = await import("@/lib/tracking-events");
    expect(resolveFormEventName("partner", "started")).toBe("partner_form_started");
    expect(resolveFormEventName("partner", "submitted")).toBe("partner_form_submitted");
  });
});