import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST as runPost } from "@/app/api/admin/geo-audit/run/route";
import { GET as historyGet } from "@/app/api/admin/geo-audit/history/route";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { NextRequest } from "next/server";

const { runScriptMock } = vi.hoisted(() => ({
  runScriptMock: vi.fn(async () => ({
    ok: true,
    exitCode: 0,
    markdown: "（mock：不执行真实 Python）",
    json: {
      scores: {},
      facts: {},
      issues: [] as unknown[],
      used_llm: false,
      script_version: "test-skip-env",
      target_path: process.cwd(),
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

describe("admin geo-audit API routes", () => {
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

  it("GET history returns 401 without session", async () => {
    const res = await historyGet(new NextRequest("http://localhost/api/admin/geo-audit/history"));
    expect(res.status).toBe(401);
  });

  it("GET history returns items array when authenticated", async () => {
    const cookie = await sessionCookie();
    const res = await historyGet(
      new NextRequest("http://localhost/api/admin/geo-audit/history", {
        headers: { cookie },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("POST run returns ok with mocked script and persisted false without DATABASE_URL", async () => {
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
      markdown: string;
      issues: unknown[];
      script_version: string | null;
    };
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(false);
    expect(body.script_version).toBe("test-skip-env");
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues).toEqual([]);
    expect(runScriptMock).toHaveBeenCalledTimes(1);
  });

  it("POST run returns 401 without session", async () => {
    const res = await runPost(
      new NextRequest("http://localhost/api/admin/geo-audit/run", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("POST run handles script failure gracefully", async () => {
    runScriptMock.mockResolvedValue({
      ok: false,
      exitCode: 1,
      markdown: "script crashed: internal error",
      json: null,
      stderr: "Traceback (most recent call last):\n  File 'audit.py', line 42\n",
      command: ["python", "geo_audit.py"],
    });
    const cookie = await sessionCookie();
    const res = await runPost(
      new NextRequest("http://localhost/api/admin/geo-audit/run", {
        method: "POST",
        headers: { cookie },
      }),
    );
    // handler returns 500 when result.ok is false
    expect(res.status).toBe(500);
    const body = (await res.json()) as { ok: boolean; markdown: string };
    expect(body.ok).toBe(false);
    expect(body.markdown).toContain("script crashed");
  });
});
