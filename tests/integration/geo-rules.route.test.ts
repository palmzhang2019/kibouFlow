import { GET as getRules, PUT as putRules } from "@/app/api/admin/geo/rules/route";
import { GET as getToggles, PUT as putToggles } from "@/app/api/admin/geo/schema-toggles/route";
import { POST as previewRules } from "@/app/api/admin/geo/rules/preview/route";

const { getServiceSupabaseMock } = vi.hoisted(() => ({
  getServiceSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: getServiceSupabaseMock,
}));

describe("geo rules routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing locale in rules GET", async () => {
    const req = new Request("http://localhost/api/admin/geo/rules");
    const res = await getRules(req as never);
    expect(res.status).toBe(400);
  });

  it("returns source none when rules GET without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/rules?locale=zh");
    const res = await getRules(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ source: "none" });
  });

  it("blocks protected toggle path when disabling schema", async () => {
    getServiceSupabaseMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) })),
          })),
        })),
        upsert: vi.fn(),
      })),
    });
    const req = new Request("http://localhost/api/admin/geo/schema-toggles", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locale: "zh",
        path: "/zh",
        enable_article: false,
        enable_faqpage: true,
        enable_howto: true,
        enable_breadcrumb: true,
        enable_website: true,
      }),
    });
    const res = await putToggles(req as never);
    expect(res.status).toBe(403);
  });

  it("returns preview result with valid payload", async () => {
    const req = new Request("http://localhost/api/admin/geo/rules/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locale: "zh",
        markdown: "## 问题\n答案\n\n## 判断框架\n1. A\n2. B",
        ruleOverrides: {
          locale: "zh",
          faq_min_items: 1,
          howto_min_steps: 2,
        },
      }),
    });
    const res = await previewRules(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.faq.count).toBeGreaterThanOrEqual(1);
  });

  it("returns default toggles on missing db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/schema-toggles?locale=zh&path=/zh/guides");
    const res = await getToggles(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ source: "none" });
  });

  it("returns 503 when rules PUT without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/rules", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locale: "zh",
        faq_exclude_heading_patterns: [],
        faq_min_items: 2,
        howto_section_patterns: [],
        howto_min_steps: 2,
        article_abstract_from_tldr: false,
      }),
    });
    const res = await putRules(req as never);
    expect(res.status).toBe(503);
  });
});
