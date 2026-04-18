import {
  mergeJsonLd,
  normalizeGeoPath,
  resolveGeoMetadata,
} from "@/lib/geo-settings";

const { getPgMock } = vi.hoisted(() => ({
  getPgMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getPg: getPgMock,
}));

describe("geo settings utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes paths with leading slash and duplicates", () => {
    expect(normalizeGeoPath("zh//guides/")).toBe("/zh/guides");
    expect(normalizeGeoPath("/")).toBe("/");
  });

  it("merges jsonld deeply", () => {
    const base = {
      "@type": "Article",
      publisher: { name: "GEO", "@type": "Organization" },
    };
    const merged = mergeJsonLd(base, {
      publisher: { name: "GEO Lab" },
      headline: "hello",
    });
    expect(merged).toEqual({
      "@type": "Article",
      publisher: { name: "GEO Lab", "@type": "Organization" },
      headline: "hello",
    });
  });

  it("falls back to existing metadata when db is unavailable", async () => {
    getPgMock.mockReturnValue(null);
    const resolved = await resolveGeoMetadata({
      locale: "zh",
      path: "/zh",
      existingTitle: "Home",
      existingDescription: "Desc",
      existingCanonical: "/zh",
    });

    expect(resolved.title).toBe("Home");
    expect(resolved.description).toBe("Desc");
    expect(resolved.canonical).toBe("/zh");
  });
});
