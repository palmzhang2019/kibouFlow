import { afterEach, describe, expect, it, vi } from "vitest";
import {
  absoluteUrl,
  getSiteUrl,
  localeToInLanguage,
  organizationId,
  websiteIdForLocale,
} from "@/lib/seo/site-url";

describe("site-url helpers", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.unstubAllEnvs();
  });

  it("getSiteUrl trims trailing slash and respects env", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("ignores localhost origins in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000/");
    expect(getSiteUrl()).toBe("https://kibouflow.com");
  });

  it("organizationId and websiteIdForLocale are stable fragment URLs", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    expect(organizationId()).toBe("https://example.com/#organization");
    expect(websiteIdForLocale("zh")).toBe("https://example.com/zh/#website");
  });

  it("localeToInLanguage maps routing locales to BCP47", () => {
    expect(localeToInLanguage("zh")).toBe("zh-CN");
    expect(localeToInLanguage("ja")).toBe("ja-JP");
  });

  it("absoluteUrl joins base and path", () => {
    expect(absoluteUrl("/zh/guides", "https://example.com")).toBe(
      "https://example.com/zh/guides",
    );
  });
});
