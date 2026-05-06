/** @vitest-environment jsdom */

/**
 * GA4 helper unit tests.
 *
 * Verifies:
 * 1. trackGaEventWhenReady calls window.gtag immediately when it is already a function.
 * 2. trackGaEventWhenReady retries when window.gtag is initially missing and later appears.
 * 3. trackGaEventWhenReady silently gives up after maxRetries without throwing.
 * 4. trackGaEvent does not throw when window.gtag is unavailable.
 * 5. The module never imports/exports a "Keepalive" variant or talks to GA collect / Measurement Protocol directly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as gaModule from "@/lib/ga";
import { trackGaEvent, trackGaEventWhenReady } from "@/lib/ga";

beforeEach(() => {
  vi.useFakeTimers();
  // Ensure each test starts with no gtag installed.
  delete (window as unknown as { gtag?: unknown }).gtag;
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe("trackGaEventWhenReady", () => {
  it("calls window.gtag synchronously when gtag is already a function", () => {
    const gtagSpy = vi.fn();
    (window as unknown as { gtag: typeof gtagSpy }).gtag = gtagSpy;

    trackGaEventWhenReady("trial_page_view", { page_path: "/zh/trial", locale: "zh" });

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    expect(gtagSpy).toHaveBeenCalledWith("event", "trial_page_view", {
      page_path: "/zh/trial",
      locale: "zh",
    });
  });

  it("retries with setTimeout until gtag becomes available", () => {
    const gtagSpy = vi.fn();

    trackGaEventWhenReady("partner_page_view", { page_path: "/ja/partner", locale: "ja" });

    // First attempt: gtag missing, no call yet.
    expect(gtagSpy).not.toHaveBeenCalled();

    // Install gtag after one interval — second attempt should fire.
    (window as unknown as { gtag: typeof gtagSpy }).gtag = gtagSpy;
    vi.advanceTimersByTime(300);

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    expect(gtagSpy).toHaveBeenCalledWith("event", "partner_page_view", {
      page_path: "/ja/partner",
      locale: "ja",
    });
  });

  it("gives up silently after maxRetries without throwing", () => {
    expect(() => {
      trackGaEventWhenReady("never_ready", { foo: "bar" });
      // Default 5 attempts × 300ms ≈ 1500ms — push well past the window.
      vi.advanceTimersByTime(5000);
    }).not.toThrow();

    // gtag was never installed, so no global call should have been made.
    expect((window as unknown as { gtag?: unknown }).gtag).toBeUndefined();
  });

  it("respects custom maxRetries / intervalMs from options", () => {
    const gtagSpy = vi.fn();

    trackGaEventWhenReady(
      "custom_window_event",
      { locale: "zh" },
      { maxRetries: 2, intervalMs: 100 },
    );

    expect(gtagSpy).not.toHaveBeenCalled();

    // First retry tick — still nothing.
    vi.advanceTimersByTime(100);
    expect(gtagSpy).not.toHaveBeenCalled();

    // Install gtag, but past maxRetries the helper should have given up.
    (window as unknown as { gtag: typeof gtagSpy }).gtag = gtagSpy;
    vi.advanceTimersByTime(1000);

    expect(gtagSpy).not.toHaveBeenCalled();
  });
});

describe("trackGaEvent", () => {
  it("does not throw when window.gtag is missing", () => {
    expect(() => {
      trackGaEvent("cta_click", { cta_id: "x", locale: "zh" });
    }).not.toThrow();
  });

  it("calls window.gtag once when available", () => {
    const gtagSpy = vi.fn();
    (window as unknown as { gtag: typeof gtagSpy }).gtag = gtagSpy;

    trackGaEvent("share_copy_link", {
      page_path: "/zh/guides/paths/x",
      locale: "zh",
      content_type: "article",
      share_target: "copy_link",
      share_source: "article_bottom",
      article_slug: "x",
      article_category: "paths",
      title: "t",
    });

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    expect(gtagSpy.mock.calls[0][0]).toBe("event");
    expect(gtagSpy.mock.calls[0][1]).toBe("share_copy_link");
  });

  it("does not throw when gtag itself throws (defensive try/catch)", () => {
    (window as unknown as { gtag: () => void }).gtag = () => {
      throw new Error("boom");
    };

    expect(() => trackGaEvent("cta_click", { cta_id: "x" })).not.toThrow();
  });
});

describe("module surface — no Measurement Protocol / collect detour", () => {
  it("does not export trackGaEventKeepalive or any keepalive variant", () => {
    const exportNames = Object.keys(gaModule);
    expect(exportNames).not.toContain("trackGaEventKeepalive");
    for (const name of exportNames) {
      expect(name.toLowerCase()).not.toContain("keepalive");
    }
  });

  it("non-comment source code never references google-analytics.com/g/collect or Measurement Protocol", () => {
    const gaSource = readFileSync(resolve(process.cwd(), "src/lib/ga.ts"), "utf8");
    // Strip block + line comments before scanning so the file's own "we never use X"
    // documentation is not flagged.
    const code = gaSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

    expect(code).not.toMatch(/google-analytics\.com\/g\/collect/i);
    expect(code).not.toMatch(/google-analytics\.com\/mp\/collect/i);
    expect(code).not.toMatch(/measurement[_-]?protocol/i);
    expect(code.toLowerCase()).not.toContain("keepalive");
  });
});
