import { GET as getMeRole } from "@/app/api/admin/geo/me-role/route";
import { PUT as putRoleBinding } from "@/app/api/admin/geo/role-bindings/route";
import { GET as getHealth } from "@/app/api/admin/geo/health/route";
import { GET as getAudit } from "@/app/api/admin/geo/audit-logs/route";
import { GET as getExport } from "@/app/api/admin/geo/export/route";

const { getServiceSupabaseMock } = vi.hoisted(() => ({
  getServiceSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: getServiceSupabaseMock,
}));

describe("geo phase3 routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns role and permissions", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/me-role", {
      headers: { "x-admin-user": "u1", "x-admin-role": "editor" },
    });
    const res = await getMeRole(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("editor");
  });

  it("returns 403 when non-admin updates role binding", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/role-bindings", {
      method: "PUT",
      headers: { "content-type": "application/json", "x-admin-role": "editor" },
      body: JSON.stringify({ user_id: "u2", role: "reviewer" }),
    });
    const res = await putRoleBinding(req as never);
    expect(res.status).toBe(403);
  });

  it("returns health defaults without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/health");
    const res = await getHealth(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metrics.metadataCompletenessRate).toBe(0);
  });

  it("returns empty audit list without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/audit-logs");
    const res = await getAudit(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ data: [] });
  });

  it("returns 503 on export without db", async () => {
    getServiceSupabaseMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/admin/geo/export?format=json");
    const res = await getExport(req as never);
    expect(res.status).toBe(503);
  });
});
