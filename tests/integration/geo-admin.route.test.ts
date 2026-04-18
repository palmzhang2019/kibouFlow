import { GET as getPageSettings, PUT as putPageSettings } from "@/app/api/admin/geo/page-settings/route";
import { GET as getSiteSettings, PUT as putSiteSettings } from "@/app/api/admin/geo/site-settings/route";

const { getServiceSupabaseMock } = vi.hoisted(() => ({
  getServiceSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: getServiceSupabaseMock,
}));

describe("geo admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when page settings GET misses query", async () => {
    const req = new Request("http://localhost/api/admin/geo/page-settings");
    const res = await getPageSettings(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 when site settings PUT without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/site-settings", {
      method: "PUT",
      body: JSON.stringify({
        site_name: "GEO",
        default_title_template: "%s | GEO",
        default_description: "desc",
        default_locale: "zh",
        site_url: "https://kibouflow.com",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await putSiteSettings(req as never);
    expect(res.status).toBe(503);
  });

  it("returns source none when GET without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const siteRes = await getSiteSettings();
    expect(siteRes.status).toBe(200);
    await expect(siteRes.json()).resolves.toMatchObject({ source: "none" });

    const pageReq = new Request(
      "http://localhost/api/admin/geo/page-settings?locale=zh&path=/zh",
    );
    const pageRes = await getPageSettings(pageReq as never);
    expect(pageRes.status).toBe(200);
    await expect(pageRes.json()).resolves.toMatchObject({ source: "none" });
  });

  it("returns 503 when page settings PUT without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/page-settings", {
      method: "PUT",
      body: JSON.stringify({
        locale: "zh",
        path: "/zh/guides",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await putPageSettings(req as never);
    expect(res.status).toBe(503);
  });
});
