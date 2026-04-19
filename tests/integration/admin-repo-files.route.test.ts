import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { GET as repoFileGet } from "@/app/api/admin/repo-files/[fileKey]/route";

describe("admin repo file API", () => {
  const origPwd = process.env.ADMIN_GEO_PASSWORD;
  const origSec = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.ADMIN_GEO_PASSWORD = "test-password-geo";
    process.env.ADMIN_SESSION_SECRET = "session-secret-key-32chars!!";
  });

  afterEach(() => {
    if (origPwd === undefined) delete process.env.ADMIN_GEO_PASSWORD;
    else process.env.ADMIN_GEO_PASSWORD = origPwd;
    if (origSec === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = origSec;
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

  it("GET returns an empty editable payload for a missing whitelisted file", async () => {
    const cookie = await sessionCookie();
    const res = await repoFileGet(
      new NextRequest("http://localhost/api/admin/repo-files/defined-term-jsonld", {
        headers: { cookie },
      }),
      {
        params: Promise.resolve({ fileKey: "defined-term-jsonld" }),
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      key: "defined-term-jsonld",
      content: "",
      writeEnabled: true,
    });
  });
});
