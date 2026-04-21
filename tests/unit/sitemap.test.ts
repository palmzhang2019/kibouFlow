import sitemap from "@/app/sitemap";
import { getSiteUrl } from "@/lib/seo/site-url";

const BASE_URL = getSiteUrl();

describe("sitemap", () => {
  const entries = sitemap();

  it("is non-empty", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("every URL starts with BASE_URL", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith(BASE_URL)).toBe(true);
    }
  });

  it("contains home entries for both zh and ja locales", () => {
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${BASE_URL}/zh`);
    expect(urls).toContain(`${BASE_URL}/ja`);
  });

  it("every entry has x-default alternate", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages;
      expect(languages).toBeDefined();
      expect(languages).toHaveProperty("x-default");
      expect(languages).toHaveProperty("zh");
      expect(languages).toHaveProperty("ja");
    }
  });

  it("cluster articles have priority >= 0.9", () => {
    const clusterEntries = entries.filter(
      (e) => e.url.includes("/guides/") && e.url.includes("-cluster-entry"),
    );
    expect(clusterEntries.length).toBeGreaterThan(0);
    for (const entry of clusterEntries) {
      expect(entry.priority).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("article lastModified comes from frontmatter (spot-check, clock-independent)", () => {
    const faqUrl = `${BASE_URL}/zh/guides/boundaries/faq-japanese-path`;
    const entry = entries.find((e) => e.url === faqUrl);
    expect(entry?.lastModified).toBeDefined();
    const d = new Date(entry!.lastModified as Date);
    expect(d.toISOString().startsWith("2026-04-17")).toBe(true);
  });

  it("framework articles have priority 0.85", () => {
    const fwUrl = `${BASE_URL}/zh/guides/paths/framework-japanese-or-job-first`;
    const entry = entries.find((e) => e.url === fwUrl);
    expect(entry).toBeDefined();
    expect(entry!.priority).toBe(0.85);
  });

  it("faq articles have priority 0.8", () => {
    const faqUrl = `${BASE_URL}/zh/guides/boundaries/faq-japanese-path`;
    const entry = entries.find((e) => e.url === faqUrl);
    expect(entry).toBeDefined();
    expect(entry!.priority).toBe(0.8);
  });
});
