# 任务：为 kibouFlow 项目补写缺失的单元测试

## 你的角色

你是一位熟悉 Next.js + TypeScript + Vitest 的高级测试工程师。你的任务是为以下 7 个源文件编写单元测试，补齐项目的测试覆盖面。

## 项目背景

- 技术栈：Next.js 16 App Router、React 19、TypeScript 5、Vitest
- 路径别名：`@/*` → `./src/*`
- 测试目录：`tests/unit/`
- 测试配置：环境 `node`，全局 `globals: true`（`describe/it/expect/vi` 无需导入即可使用，但显式 import 也可以）
- Setup 文件 `tests/setup.ts`：每个测试后自动清理 `sessionStorage`

## 现有测试风格（你必须严格遵循）

1. 使用 `import { describe, expect, it } from "vitest"` 开头
2. 导入被测模块使用 `@/lib/xxx` 路径别名
3. 测试结构：`describe("模块名或函数名", () => { it("行为描述", () => { ... }) })`
4. 断言使用 Vitest 原生：`expect(...).toBe()`, `.toEqual()`, `.toHaveLength()`, `.toBeTypeOf()`, `.toContain()`, `.toBeGreaterThan()` 等
5. 需要 mock 时使用 `vi.mock("@/lib/xxx", () => ({ ... }))`，需要定时器时使用 `vi.useFakeTimers()` / `vi.useRealTimers()`
6. 不要使用 jest 语法。这是 Vitest 项目。
7. 保持测试简洁，不要写多余的注释

### 风格示例 A — 纯函数测试

```typescript
import { describe, expect, it } from "vitest";
import { normalizeIssueInputs } from "@/lib/geo-audit-issues";

describe("normalizeIssueInputs", () => {
  it("filters invalid entries and keeps valid issues", () => {
    const out = normalizeIssueInputs([
      null,
      { code: "", title: "x", severity: "low", layer: "site" },
      { code: "OK", title: "  标题  ", severity: "high", layer: "template", evidence: { a: 1 } },
      { code: "BAD_SEV", title: "t", severity: "nope", layer: "site" },
      { code: "BAD_LAYER", title: "t", severity: "low", layer: "nope" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.code).toBe("OK");
    expect(out[0]?.title).toBe("标题");
    expect(out[0]?.severity).toBe("high");
    expect(out[0]?.evidence).toEqual({ a: 1 });
  });
});
```

### 风格示例 B — 带 mock 的测试

```typescript
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows first three requests and blocks the fourth", () => {
    const ip = `ip-${Date.now()}`;
    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);
    const blocked = checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeTypeOf("number");
  });

  it("resets after time window", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(now);
    const ip = "window-reset-ip";
    checkRateLimit(ip); checkRateLimit(ip); checkRateLimit(ip);
    expect(checkRateLimit(ip).allowed).toBe(false);
    vi.setSystemTime(new Date(now.getTime() + 10 * 60 * 1000 + 1));
    expect(checkRateLimit(ip).allowed).toBe(true);
    vi.useRealTimers();
  });
});
```

### 风格示例 C — HMAC / 安全相关

```typescript
import { describe, expect, it } from "vitest";
import { signAdminSession, verifyAdminSession } from "@/lib/admin-session";

describe("admin-session", () => {
  const secret = "test-secret-key-at-least-16";

  it("signs and verifies a valid token", () => {
    const token = signAdminSession(secret, 60_000);
    expect(verifyAdminSession(secret, token)).toBe(true);
  });

  it("rejects wrong secret", () => {
    const token = signAdminSession(secret, 60_000);
    expect(verifyAdminSession("other-secret-other-16", token)).toBe(false);
  });

  it("rejects expired token", () => {
    const token = signAdminSession(secret, -1);
    expect(verifyAdminSession(secret, token)).toBe(false);
  });
});
```

---

## 需要你编写测试的 7 个源文件

请为每个文件生成一个独立的测试文件，放在 `tests/unit/` 目录下。

---

### 文件 1: `src/lib/require-admin-api.ts`

**测试文件名**: `tests/unit/require-admin-api.test.ts`

```typescript
import { type NextRequest, NextResponse } from "next/server";
import {
  GEO_ADMIN_SESSION_COOKIE,
  getAdminSecrets,
  verifyAdminSession,
} from "@/lib/admin-session";

export type AdminApiContext =
  | { ok: true }
  | { ok: false; response: NextResponse };

export function requireAdminApiAuth(request: NextRequest): AdminApiContext {
  const secrets = getAdminSecrets();
  if (!secrets) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin is not configured (set ADMIN_GEO_PASSWORD and ADMIN_SESSION_SECRET)" },
        { status: 503 },
      ),
    };
  }
  const token = request.cookies.get(GEO_ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(secrets.sessionSecret, token)) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}
```

**测试要点**:
- mock `@/lib/admin-session` 的 `getAdminSecrets` 和 `verifyAdminSession`
- 当 `getAdminSecrets()` 返回 `null` 时，结果应为 `{ ok: false }` 且 response status 503
- 当 cookie 不存在或 token 验证失败时，结果应为 `{ ok: false }` 且 response status 401
- 当一切正常时，结果应为 `{ ok: true }`
- 构造 NextRequest 时使用 `new NextRequest("http://localhost/api/test", { ... })`，通过 `headers` 传递 cookie

---

### 文件 2: `src/lib/pg-data.ts`

**测试文件名**: `tests/unit/pg-data.test.ts`

```typescript
import { getPg } from "@/lib/db";
import type { PartnerFormData, TrialFormData } from "@/lib/schemas";

export type InsertOk = { ok: true };
export type InsertNotConfigured = { ok: false; reason: "not_configured" };
export type InsertFailed = { ok: false; reason: "insert_failed"; detail?: string };
export type TrialInsertResult = InsertOk | InsertNotConfigured | InsertFailed;

export async function insertTrialSubmission(ip: string, data: TrialFormData): Promise<TrialInsertResult> {
  const sql = getPg();
  if (!sql) return { ok: false, reason: "not_configured" };
  try {
    const row = { ...data, ip_address: ip };
    await sql`insert into trial_submissions ${sql(row)}`;
    return { ok: true };
  } catch (e) {
    console.error("insertTrialSubmission", e);
    return { ok: false, reason: "insert_failed", detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function insertPartnerSubmission(ip: string, data: PartnerFormData): Promise<TrialInsertResult> {
  const sql = getPg();
  if (!sql) return { ok: false, reason: "not_configured" };
  try {
    const row = { ...data, ip_address: ip };
    await sql`insert into partner_submissions ${sql(row)}`;
    return { ok: true };
  } catch (e) {
    console.error("insertPartnerSubmission", e);
    return { ok: false, reason: "insert_failed", detail: e instanceof Error ? e.message : String(e) };
  }
}

export type TrackingEventRow = {
  event_name: string;
  page_path: string;
  element_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  session_id: string | null;
  locale: string | null;
  user_agent: string | null;
};

export async function insertTrackingEvent(event: TrackingEventRow): Promise<void> {
  const sql = getPg();
  if (!sql) return;
  try {
    await sql`insert into tracking_events ${sql(event)}`;
  } catch {
    // 埋点失败不抛给客户端
  }
}
```

**测试要点**:
- mock `@/lib/db` 的 `getPg`
- `getPg()` 返回 `null` 时，`insertTrialSubmission` / `insertPartnerSubmission` 应返回 `{ ok: false, reason: "not_configured" }`
- `getPg()` 返回一个 mock tagged template function 时，成功应返回 `{ ok: true }`
- mock 的 sql 抛出 Error 时，应返回 `{ ok: false, reason: "insert_failed", detail: "..." }`
- `insertTrackingEvent` 在 `getPg()` 返回 `null` 时应静默返回
- `insertTrackingEvent` 在 sql 抛错时不应抛出异常

**mock tagged template 函数的写法提示**:
```typescript
const mockSql = Object.assign(
  async (_strings: TemplateStringsArray, ..._values: unknown[]) => [{ id: "1" }],
  { (columns: Record<string, unknown>) { return columns; } }  // sql(row) 调用
);
// 更简洁的做法：
const mockSql: any = async () => [];
mockSql[Symbol.for("sql")] = true; // 不一定需要，视实现而定
```
实际上，最简单的 mock 方式是让 `mockSql` 既能被当作 tagged template 调用、也能被当作普通函数 `sql(row)` 调用：
```typescript
const mockSql: any = Object.assign(
  async () => [],
  { __proto__: Function.prototype },
);
```

---

### 文件 3: `src/lib/geo-audit-scores.ts`

**测试文件名**: `tests/unit/geo-audit-scores.test.ts`

```typescript
import type { PrinciplesAuditJson } from "@/lib/geo-principles-audit-runner";

function pickScore(scores: Record<string, number> | undefined, needle: string): number | null {
  if (!scores) return null;
  const key = Object.keys(scores).find((k) => k.includes(needle));
  if (!key) return null;
  const v = scores[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export type GeoAuditScoreColumns = {
  overall_score: number | null;
  retrievability_score: number | null;
  chunkability_score: number | null;
  extractability_score: number | null;
  trust_score: number | null;
  attributability_score: number | null;
};

export function mergeScoreColumnsWithReportJson(
  db: GeoAuditScoreColumns,
  report_json: Record<string, unknown> | null | undefined,
): GeoAuditScoreColumns {
  const fromJson = extractScoresFromAuditJson(report_json as PrinciplesAuditJson | null);
  return {
    overall_score: db.overall_score ?? fromJson.overall_score,
    retrievability_score: db.retrievability_score ?? fromJson.retrievability_score,
    chunkability_score: db.chunkability_score ?? fromJson.chunkability_score,
    extractability_score: db.extractability_score ?? fromJson.extractability_score,
    trust_score: db.trust_score ?? fromJson.trust_score,
    attributability_score: db.attributability_score ?? fromJson.attributability_score,
  };
}

export function extractScoresFromAuditJson(json: PrinciplesAuditJson | null): {
  overall_score: number | null;
  retrievability_score: number | null;
  chunkability_score: number | null;
  extractability_score: number | null;
  trust_score: number | null;
  attributability_score: number | null;
} {
  const scores = json?.scores as Record<string, number> | undefined;
  const retrievability_score = pickScore(scores, "可召回");
  const chunkability_score = pickScore(scores, "可切块");
  const extractability_score = pickScore(scores, "可抽取");
  const trust_score = pickScore(scores, "可信");
  const attributability_score = pickScore(scores, "可归因");
  const parts = [
    retrievability_score, chunkability_score, extractability_score, trust_score, attributability_score,
  ].filter((x): x is number => x !== null);
  const overall_score =
    parts.length === 0 ? null : Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;
  return {
    overall_score, retrievability_score, chunkability_score,
    extractability_score, trust_score, attributability_score,
  };
}

export function summaryFromMarkdown(md: string | null | undefined, maxLen = 160): string {
  if (!md) return "";
  const oneLine = md.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen)}…`;
}
```

**测试要点**:
- `extractScoresFromAuditJson(null)` → 所有字段为 null
- 传入含中文 key 的 scores（如 `{"可召回性": 85, "可切块性": 70, ...}`）→ 正确提取各维度分数
- `overall_score` 应为各维度平均值（保留一位小数）
- 部分维度缺失时，`overall_score` 只基于有值的维度计算
- `mergeScoreColumnsWithReportJson`：DB 有值时优先使用 DB 的值；DB 为 null 时 fallback 到 JSON 中的值
- `summaryFromMarkdown`：null/undefined → 空字符串；短文本原样返回；长文本截断并加 `…`

---

### 文件 4: `src/lib/geo-audit-report-markdown.ts`

**测试文件名**: `tests/unit/geo-audit-report-markdown.test.ts`

```typescript
export const GEO_AUDIT_JSON_APPENDIX_SEP = "\n--- JSON ---\n";
const GEO_AUDIT_JSON_APPENDIX_SEP_ALT = "--- JSON ---\n";
const SEP_VARIANTS = [GEO_AUDIT_JSON_APPENDIX_SEP, GEO_AUDIT_JSON_APPENDIX_SEP_ALT] as const;

export function stripGeoAuditJsonAppendix(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n");
  let bestIdx = -1;
  let bestLen = 0;
  for (const sep of SEP_VARIANTS) {
    const idx = normalized.lastIndexOf(sep);
    if (idx > bestIdx) { bestIdx = idx; bestLen = sep.length; }
  }
  if (bestIdx === -1) return markdown;
  return normalized.slice(0, bestIdx).trimEnd();
}

export function splitGeoAuditMarkdownBodyAndJsonTail(markdown: string): {
  body: string; jsonPart: string; separator: string;
} | null {
  const normalized = markdown.replace(/\r\n/g, "\n");
  for (const sep of SEP_VARIANTS) {
    const idx = normalized.indexOf(sep);
    if (idx !== -1) {
      return {
        body: normalized.slice(0, idx).trimEnd(),
        jsonPart: normalized.slice(idx + sep.length),
        separator: sep,
      };
    }
  }
  return null;
}
```

**测试要点**:
- `stripGeoAuditJsonAppendix`：无分隔符 → 原样返回；有 `\n--- JSON ---\n` → 只保留正文部分；有 `\r\n` → 正确规范化
- `splitGeoAuditMarkdownBodyAndJsonTail`：无分隔符 → 返回 null；有分隔符 → body/jsonPart/separator 正确分割
- 测试备选分隔符 `--- JSON ---\n`（顶格、无前导换行）也能正确处理

---

### 文件 5: `src/lib/geo-principles-audit-runner.ts`

**测试文件名**: `tests/unit/geo-principles-audit-runner.test.ts`

这个文件比较复杂，包含子进程执行和多个辅助函数。**请只测试以下纯函数/可单元测试的部分**，不要测试 `runGeoPrinciplesAuditScript`（那是集成测试的范畴）：

```typescript
// 只测这两个导出函数：
export function parsePrinciplesAuditJsonFromMarkdown(
  markdown: string | null | undefined,
): PrinciplesAuditJson | null;

export function coalesceAuditJsonForPersist(
  fromStdout: PrinciplesAuditJson | null,
  markdown: string,
): PrinciplesAuditJson | null;
```

**测试要点**:
- `parsePrinciplesAuditJsonFromMarkdown(null)` → null
- `parsePrinciplesAuditJsonFromMarkdown("")` → null
- 传入含 `--- JSON ---` 分隔符和有效 JSON 尾的 markdown → 正确解析出 PrinciplesAuditJson
- JSON 格式不合法但可截取到 `{...}` → 仍然尝试解析
- `coalesceAuditJsonForPersist`：两个都为空 → null；只有一个有值 → 使用有值的；两个都有值 → 合并，stdout 优先，issues 按 code 合并 evidence

---

### 文件 6: `src/lib/article-anchors.ts`

**测试文件名**: `tests/unit/article-anchors.test.ts`

```typescript
import type { ReactNode } from "react";
import { isValidElement } from "react";

export function slugifyHeading(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => getNodeText(child)).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return "";
}

export function resolveHeadingId(children: ReactNode, id?: string): string | undefined {
  if (id) return id;
  const text = getNodeText(children);
  const slug = slugifyHeading(text);
  return slug.length > 0 ? slug : undefined;
}
```

**测试要点**:
- `slugifyHeading`：
  - 英文正常 slug：`"Hello World"` → `"hello-world"`
  - 中文保留：`"下一步建议"` → `"下一步建议"`
  - 日文平假名/片假名保留：`"はじめに"` → `"はじめに"`
  - Markdown 格式符号去除：`` "`code` and *bold*" `` → `"code-and-bold"`
  - 多余空格和连字符合并
  - 特殊字符去除（如 `?`、`!`、`#`）
  - 空字符串 → 空字符串
- `getNodeText`：字符串 → 原文；数字 → 字符串化；数组 → 拼接
- `resolveHeadingId`：传入 id 时直接返回 id；无 id 时从 children 生成 slug

---

### 文件 7: `src/lib/geo-audit-runs.ts`

**测试文件名**: `tests/unit/geo-audit-runs.test.ts`

这个文件主要是数据库操作，但有几个纯函数值得测试：

```typescript
export function canPersistGeoAuditRuns(): boolean;
export function resolveGeoAuditReportPayload(row: GeoAuditRunRow): Record<string, unknown> | null;
export function mergeGeoAuditRunMetaFromReportJson(row: GeoAuditRunRow): Pick<GeoAuditRunRow, "used_llm" | "llm_model" | "script_version" | "target_path">;
export function serializeReportJsonForDb(json: unknown): Record<string, unknown> | null;
```

**测试要点**:
- mock `@/lib/db` 的 `isPgConfigured`
- `canPersistGeoAuditRuns`：依赖 `isPgConfigured()` 返回值
- `serializeReportJsonForDb`：null → null；正常对象 → 原样返回；超大 JSON（>900KB）→ 返回 truncated 占位对象
- `resolveGeoAuditReportPayload`：优先从 markdown 尾部解析；fallback 到非 truncated 的 report_json
- `mergeGeoAuditRunMetaFromReportJson`：JSON payload 中的字段覆盖行中的空值

注意：这个文件依赖 `@/lib/geo-principles-audit-runner` 的 `parsePrinciplesAuditJsonFromMarkdown`，你需要 mock 它（或者因为它内部又依赖 `geo-audit-report-markdown`，可以选择不 mock 而让它正常执行，取决于哪种方式更简单）。

---

## 输出要求

请按以下格式输出 **7 个完整的测试文件**，每个文件用 markdown 代码块包裹，标注文件路径：

```
### tests/unit/xxx.test.ts

\`\`\`typescript
// 完整测试代码
\`\`\`
```

## 质量要求

1. 每个测试文件必须能在 `npx vitest run tests/unit/xxx.test.ts` 下独立运行
2. 不要引入项目中不存在的依赖
3. mock 要最小化——只 mock 外部依赖（db、admin-session），纯函数直接测试
4. 每个被测函数至少覆盖：正常路径、边界情况、错误/空值路径
5. 不要写快照测试（snapshot）
6. 断言要具体，不要只断言"不抛错"
7. 测试用例的描述用英文（与现有测试风格一致）
