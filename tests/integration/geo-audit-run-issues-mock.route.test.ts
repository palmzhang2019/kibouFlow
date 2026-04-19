import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginPost } from "@/app/api/admin/login/route";

const { runScriptMock } = vi.hoisted(() => ({
  runScriptMock: vi.fn(async () => ({
    ok: true,
    exitCode: 0,
    markdown: "# mock audit",
    json: {
      scores: { "可召回 Retrievability": 9.0 },
      facts: {},
      issues: [
        {
          code: "MOCK_TEST_ISSUE",
          title: "集成测试占位问题",
          severity: "low",
          layer: "site",
          evidence: { fromMock: true },
        },
      ],
      used_llm: false,
      script_version: "test-mock",
      target_path: "/tmp/repo",
    },
    stderr: "",
    command: ["python", "mock"],
  })),
}));

vi.mock("@/lib/geo-principles-audit-runner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/geo-principles-audit-runner")>();
  return {
    ...actual,
    runGeoPrinciplesAuditScript: runScriptMock,
  };
});

import { POST as runPost } from "@/app/api/admin/geo-audit/run/route";

describe("admin geo-audit run with mocked script", () => {
  const origPwd = process.env.ADMIN_GEO_PASSWORD;
  const origSec = process.env.ADMIN_SESSION_SECRET;
  const origDb = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.ADMIN_GEO_PASSWORD = "test-password-geo";
    process.env.ADMIN_SESSION_SECRET = "session-secret-key-32chars!!";
    delete process.env.DATABASE_URL;
    runScriptMock.mockClear();
  });

  afterEach(() => {
    if (origPwd === undefined) delete process.env.ADMIN_GEO_PASSWORD;
    else process.env.ADMIN_GEO_PASSWORD = origPwd;
    if (origSec === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = origSec;
    if (origDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = origDb;
  });

  async function sessionCookie(): Promise<string> {
    const loginReq = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "test-password-geo" }),
    });
    const loginRes = await loginPost(loginReq);
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    const m = setCookie.match(/geo_admin_session=([^;]+)/);
    expect(m).toBeTruthy();
    return `geo_admin_session=${m![1]}`;
  }

  it("POST run returns normalized issues array without DATABASE_URL", async () => {
    const cookie = await sessionCookie();
    const res = await runPost(
      new NextRequest("http://localhost/api/admin/geo-audit/run", {
        method: "POST",
        headers: { cookie },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      persisted: boolean;
      issues: { code: string; title: string; severity: string; layer: string }[];
    };
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(false);
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues).toHaveLength(1);
    expect(body.issues[0]?.code).toBe("MOCK_TEST_ISSUE");
    expect(runScriptMock).toHaveBeenCalledTimes(1);
  });
});
