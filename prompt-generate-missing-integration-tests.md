# 任务：为 kibouFlow 项目补写缺失的集成测试

## 你的角色

你是一位熟悉 Next.js App Router + TypeScript + Vitest 的高级测试工程师。你的任务是：
1. 为 2 个完全没有集成测试的 API 路由编写测试
2. 为 7 个已有测试但覆盖不完整的路由补充缺失的测试用例

## 项目背景

- 技术栈：Next.js 16 App Router、React 19、TypeScript 5、Vitest
- 路径别名：`@/*` → `./src/*`
- 测试目录：`tests/integration/`
- 测试环境：`node`，`globals: true`
- 集成测试风格：直接导入 route handler 函数（如 `import { POST } from "@/app/api/xxx/route"`），构造 `Request` 或 `NextRequest`，调用 handler 并断言响应

## 现有集成测试风格（你必须严格遵循）

### 风格 A — 表单提交路由（mock 依赖，测试 handler）

```typescript
import { POST } from "@/app/api/trial/route";

const { checkRateLimitMock, insertTrialSubmissionMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  insertTrialSubmissionMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/pg-data", () => ({
  insertTrialSubmission: insertTrialSubmissionMock,
}));

describe("POST /api/trial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({ allowed: true });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, retryAfterMs: 1000 });
    const req = new Request("http://localhost/api/trial", { method: "POST" });
    const res = await POST(req as never);
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid payload", async () => {
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 when database is not configured", async () => {
    insertTrialSubmissionMock.mockResolvedValue({ ok: false, reason: "not_configured" });
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", contact: "alice@example.com" }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });

  it("returns success for valid payload", async () => {
    insertTrialSubmissionMock.mockResolvedValue({ ok: true });
    const req = new Request("http://localhost/api/trial", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", contact: "alice@example.com" }),
      headers: { "content-type": "application/json", "x-real-ip": "2.2.2.2" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(insertTrialSubmissionMock).toHaveBeenCalledWith(
      "2.2.2.2",
      expect.objectContaining({ name: "Alice", contact: "alice@example.com" }),
    );
  });
});
```

### 风格 B — Admin 路由（环境变量 + session cookie）

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { GET as sessionGet } from "@/app/api/admin/session/route";
import { NextRequest } from "next/server";

describe("admin login + session routes", () => {
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

  it("GET session returns configured false when secrets missing", async () => {
    delete process.env.ADMIN_GEO_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    const res = await sessionGet();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ authenticated: false, configured: false });
  });

  it("POST login returns 401 for wrong password", async () => {
    const req = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(401);
  });

  it("POST login returns 200 and sets cookie for correct password", async () => {
    const req = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "test-password-geo" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("geo_admin_session=");
  });
});
```

### 风格 C — Tracking 路由（简单 mock）

```typescript
import { POST } from "@/app/api/track/route";

const { insertTrackingEventMock } = vi.hoisted(() => ({
  insertTrackingEventMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/pg-data", () => ({
  insertTrackingEvent: insertTrackingEventMock,
}));

describe("POST /api/track", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns ok when database is not configured", async () => {
    const req = new Request("http://localhost/api/track", {
      method: "POST",
      body: JSON.stringify({ event_name: "view", page_path: "/zh" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
```

### 获取 session cookie 的通用辅助函数

在需要认证的测试中，通过实际调用 login handler 来获取合法 cookie：

```typescript
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
```

---

## 第一部分：2 个完全未覆盖的路由

### 路由 1: POST /api/admin/logout

**测试文件名**: `tests/integration/admin-logout.route.test.ts`

**源文件**:
```typescript
import { NextResponse } from "next/server";
import { GEO_ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GEO_ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
```

**需要测试的场景**:
- POST 返回 200 且 body 为 `{ ok: true }`
- 响应中 set-cookie 包含 `geo_admin_session=`（清除 cookie）
- set-cookie 包含 `Max-Age=0`（立即过期）
- set-cookie 包含 `HttpOnly`
- set-cookie 包含 `Path=/`
- 不需要 request body 也能正常工作
- 无论有无现有 session 都应正常返回

---

### 路由 2: GET /api/admin/geo-audit/history/[id]

**测试文件名**: `tests/integration/geo-audit-history-detail.route.test.ts`

**源文件**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getGeoAuditRunById, mergeGeoAuditRunMetaFromReportJson, resolveGeoAuditReportPayload } from "@/lib/geo-audit-runs";
import { mergeScoreColumnsWithReportJson } from "@/lib/geo-audit-scores";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdminApiAuth } from "@/lib/require-admin-api";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Params) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = checkRateLimit(`geo-audit-history-id:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = requireAdminApiAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = await getGeoAuditRunById(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta = mergeGeoAuditRunMetaFromReportJson(row);
  const payload = resolveGeoAuditReportPayload(row);
  const scores = mergeScoreColumnsWithReportJson(
    {
      overall_score: row.overall_score,
      retrievability_score: row.retrievability_score,
      chunkability_score: row.chunkability_score,
      extractability_score: row.extractability_score,
      trust_score: row.trust_score,
      attributability_score: row.attributability_score,
    },
    payload,
  );

  return NextResponse.json({
    id: row.id,
    status: row.status,
    started_at: row.started_at,
    finished_at: row.finished_at,
    overall_score: scores.overall_score,
    retrievability_score: scores.retrievability_score,
    chunkability_score: scores.chunkability_score,
    extractability_score: scores.extractability_score,
    trust_score: scores.trust_score,
    attributability_score: scores.attributability_score,
    report_markdown: row.report_markdown ?? "",
    report_json: row.report_json,
    error_message: row.error_message,
    used_llm: meta.used_llm,
    llm_model: meta.llm_model,
    script_version: meta.script_version,
    target_path: meta.target_path,
  });
}
```

**需要测试的场景**:
- 无 session cookie → 401
- 有 session cookie + 空 id → 400
- 有 session cookie + id 超过 80 字符 → 400
- 有 session cookie + 合法 id + `getGeoAuditRunById` 返回 null → 404
- 有 session cookie + 合法 id + `getGeoAuditRunById` 返回完整行 → 200，验证响应字段
- 限流触发 → 429

**mock 策略**:
- mock `@/lib/rate-limit` 的 `checkRateLimit`
- mock `@/lib/geo-audit-runs` 的 `getGeoAuditRunById`、`mergeGeoAuditRunMetaFromReportJson`、`resolveGeoAuditReportPayload`
- mock `@/lib/geo-audit-scores` 的 `mergeScoreColumnsWithReportJson`
- Admin 鉴权：通过环境变量配置 + 实际调用 login handler 获取 cookie（与现有测试风格一致）

**构造带路径参数的请求**:
handler 签名是 `GET(request: NextRequest, ctx: { params: Promise<{ id: string }> })`，测试中需要手动构造 ctx：
```typescript
const ctx = { params: Promise.resolve({ id: "some-uuid" }) };
const res = await GET(req, ctx);
```

---

## 第二部分：7 个已有测试需要补充的场景

以下是每个已有测试文件需要新增的测试用例。**请把新用例追加到对应测试文件的 describe 块中**，不要创建新文件。

### 2.1 `tests/integration/geo-admin-login.route.test.ts`

新增测试用例：

```
it("GET session returns authenticated true with valid cookie")
→ 先调用 loginPost 获取 cookie，再带 cookie 调用 sessionGet
→ 断言 { authenticated: true, configured: true }

it("GET session returns authenticated false with invalid token")
→ 构造带 geo_admin_session=invalid-garbage 的请求
→ 断言 { authenticated: false }

it("POST login returns 503 when admin is not configured")
→ 删除 ADMIN_GEO_PASSWORD 和 ADMIN_SESSION_SECRET
→ 断言 status 503 或 { configured: false }（视 login route 实现而定）
```

### 2.2 `tests/integration/geo-audit-admin.route.test.ts`

新增测试用例：

```
it("POST run returns 401 without session")
→ 不带 cookie 调用 runPost
→ 断言 status 401

it("POST run handles script failure gracefully")
→ mock runGeoPrinciplesAuditScript 返回 { ok: false, exitCode: 1, markdown: "error", json: null, stderr: "script crashed", command: ["python", "mock"] }
→ 断言 status 200 且 body.ok 为 true（handler 不会因脚本失败而返回 500）
→ 断言 body.markdown 包含错误信息
```

### 2.3 `tests/integration/trial.route.test.ts`

新增测试用例：

```
it("returns 500 or error status when database insert fails")
→ insertTrialSubmissionMock.mockResolvedValue({ ok: false, reason: "insert_failed", detail: "connection refused" })
→ 断言 status 不是 200（具体看 route handler 对 insert_failed 的处理）

it("extracts IP from x-forwarded-for with multiple IPs")
→ headers: { "x-forwarded-for": "3.3.3.3, 4.4.4.4" }
→ 断言 insertTrialSubmissionMock 被调用时第一个参数是 "3.3.3.3"
```

### 2.4 `tests/integration/partner.route.test.ts`

新增测试用例（与 trial 对称）：

```
it("returns error status when database insert fails")
→ 同 trial 的 insert_failed 场景

it("extracts IP from x-forwarded-for with multiple IPs")
→ 同 trial
```

### 2.5 `tests/integration/track.route.test.ts`

新增测试用例：

```
it("handles missing event_name gracefully")
→ body: { page_path: "/zh" }（缺少 event_name）
→ 断言 status 200（track 路由通常不校验，但要确认行为）

it("handles empty request body gracefully")
→ body: {}
→ 断言 status 200 且不抛异常
```

### 2.6 `tests/integration/llms.route.test.ts`

新增测试用例：

```
it("/llms.txt sets cache-control header")
→ 检查 res.headers.get("cache-control") 包含 "s-maxage" 或 "max-age"

it("/llms-full.txt sets cache-control header")
→ 同上
```

### 2.7 `tests/integration/robots.route.test.ts`

新增测试用例：

```
it("includes default allow rule for * user-agent")
→ 检查 rules 中是否有 userAgent 为 "*" 或通配规则

it("blocks known harmful bots")
→ 检查 Bytespider 之外的其他被拦截 bot（如 AhrefsBot, SemrushBot 等，具体看 robots.ts 实现）
```

---

## 输出格式

请按以下格式输出：

**对于第一部分（2 个新文件）**，每个文件用 markdown 代码块包裹，标注文件路径：

```
### tests/integration/xxx.route.test.ts

\`\`\`typescript
// 完整测试代码
\`\`\`
```

**对于第二部分（7 个追加用例）**，每个文件输出需要追加的代码片段，明确说明插入位置（在哪个 describe 块的末尾追加）：

```
### 追加到 tests/integration/xxx.route.test.ts

在 describe("...") 块末尾追加以下用例：

\`\`\`typescript
// 追加的测试代码
\`\`\`
```

## 质量要求

1. 每个测试文件必须能在 `npx vitest run tests/integration/xxx.test.ts` 下独立运行
2. 严格遵循现有的 mock 方式：使用 `vi.hoisted()` + `vi.mock()`
3. Admin 鉴权测试必须通过环境变量 + 实际调用 login handler 来获取 cookie
4. 环境变量必须在 `beforeEach` 中设置、`afterEach` 中恢复
5. 不要引入项目中不存在的依赖
6. 断言要具体（状态码 + body 内容），不要只断言"不抛错"
7. 不要写快照测试
8. 测试用例描述用英文
