/** @vitest-environment jsdom */

import { captureUTMParams, getOrCreateSessionId, getStoredUTMParams } from "@/lib/utm";

describe("utm helpers", () => {
  it("captures utm params, referrer, and landing page", () => {
    window.history.pushState({}, "", "/zh?utm_source=google&utm_medium=cpc&utm_campaign=spring");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://ref.example.com",
    });

    const params = captureUTMParams();

    expect(params.utm_source).toBe("google");
    expect(params.utm_medium).toBe("cpc");
    expect(params.utm_campaign).toBe("spring");
    expect(params.referrer).toBe("https://ref.example.com");
    expect(params.landing_page).toBe("/zh");
  });

  it("reuses stored session id", () => {
    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();
    expect(first).toBe(second);
  });

  it("reads persisted utm params from sessionStorage", () => {
    sessionStorage.setItem("geo_utm_source", "newsletter");
    sessionStorage.setItem("geo_utm_medium", "email");
    sessionStorage.setItem("geo_landing_page", "/ja/trial");

    expect(getStoredUTMParams()).toMatchObject({
      utm_source: "newsletter",
      utm_medium: "email",
      landing_page: "/ja/trial",
    });
  });
});
