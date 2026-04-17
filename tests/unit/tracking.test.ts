/** @vitest-environment jsdom */

import { sendTrackingEvent } from "@/lib/tracking";

describe("sendTrackingEvent", () => {
  const payload = {
    event_name: "cta_click",
    page_path: "/zh",
    session_id: "session-1",
    locale: "zh",
    user_agent: "test-agent",
  };

  it("uses sendBeacon when available", () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });

    sendTrackingEvent(payload);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it("falls back to fetch when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    sendTrackingEvent(payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/track",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
