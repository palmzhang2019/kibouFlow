import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { GeoAuditIssueJsonPayload } from "@/lib/geo-audit-issues";
import { splitGeoAuditMarkdownBodyAndJsonTail } from "@/lib/geo-audit-report-markdown";

const execFileAsync = promisify(execFile);

export interface PrinciplesAuditJson {
  scores?: Record<string, number>;
  facts?: Record<string, unknown>;
  issues?: GeoAuditIssueJsonPayload[];
  used_llm?: boolean;
  llm_model?: string | null;
  script_version?: string | null;
  target_path?: string | null;
}

export interface PrinciplesAuditResult {
  ok: boolean;
  exitCode: number | null;
  markdown: string;
  json: PrinciplesAuditJson | null;
  stderr: string;
  command: string[];
}

function pickPythonBinary(): string {
  if (process.env.GEO_AUDIT_PYTHON?.trim()) return process.env.GEO_AUDIT_PYTHON.trim();
  return process.platform === "win32" ? "python" : "python3";
}

function tryParseAuditJson(jsonPart: string): PrinciplesAuditJson | null {
  const trimmed = jsonPart.trim();
  try {
    return JSON.parse(trimmed) as PrinciplesAuditJson;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as PrinciplesAuditJson;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 从已落库的 Markdown 报告尾部解析 `--- JSON ---` 段（与脚本 stdout 格式一致）。
 * 当 `report_json` 为空或被截断占位时，仍可从正文恢复分数 / issues / 元数据。
 */
export function parsePrinciplesAuditJsonFromMarkdown(
  markdown: string | null | undefined,
): PrinciplesAuditJson | null {
  if (!markdown) return null;
  const split = splitGeoAuditMarkdownBodyAndJsonTail(markdown);
  if (!split) return null;
  return tryParseAuditJson(split.jsonPart);
}

function isIssueEvidenceRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 按 code 对齐：字段以 stdout 为准，evidence 合并（避免「stdout 有条目但 evidence 空」盖住 Markdown 里的证据）。 */
function mergeIssueListsForPersist(
  primary: GeoAuditIssueJsonPayload[] | undefined,
  fallback: GeoAuditIssueJsonPayload[] | undefined,
): GeoAuditIssueJsonPayload[] | undefined {
  const p = Array.isArray(primary) ? primary : [];
  const m = Array.isArray(fallback) ? fallback : [];
  if (p.length === 0 && m.length === 0) return undefined;
  if (p.length === 0) return m;
  if (m.length === 0) return p;

  const mByCode = new Map<string, GeoAuditIssueJsonPayload>();
  for (const x of m) {
    if (x && typeof x.code === "string" && x.code) mByCode.set(x.code, x);
  }

  const seen = new Set<string>();
  const out: GeoAuditIssueJsonPayload[] = [];

  for (const pi of p) {
    if (!pi || typeof pi.code !== "string" || !pi.code) continue;
    seen.add(pi.code);
    const fi = mByCode.get(pi.code);
    const pEv = isIssueEvidenceRecord(pi.evidence) ? pi.evidence : {};
    const fEv = fi && isIssueEvidenceRecord(fi.evidence) ? fi.evidence : {};
    const evidence = { ...fEv, ...pEv } as Record<string, unknown>;
    out.push({
      ...(fi ?? {}),
      ...pi,
      evidence,
    } as GeoAuditIssueJsonPayload);
  }

  for (const mi of m) {
    if (mi && typeof mi.code === "string" && mi.code && !seen.has(mi.code)) out.push(mi);
  }

  return out.length > 0 ? out : undefined;
}

/**
 * 入库与分数计算用：stdout 与 Markdown 尾部 JSON 合并；`issues` 按 code 对齐并合并 `evidence`。
 */
export function coalesceAuditJsonForPersist(
  fromStdout: PrinciplesAuditJson | null,
  markdown: string,
): PrinciplesAuditJson | null {
  const fromMd = parsePrinciplesAuditJsonFromMarkdown(markdown);
  if (!fromStdout && !fromMd) return null;
  if (!fromStdout) return fromMd;
  if (!fromMd) return fromStdout;
  const issues = mergeIssueListsForPersist(fromStdout.issues, fromMd.issues);
  return {
    ...fromMd,
    ...fromStdout,
    ...(issues !== undefined ? { issues } : {}),
  };
}

function splitStdout(stdout: string): { markdown: string; json: PrinciplesAuditResult["json"] } {
  const norm = stdout.replace(/\r\n/g, "\n");
  const split = splitGeoAuditMarkdownBodyAndJsonTail(norm);
  if (!split) {
    return { markdown: stdout.trimEnd(), json: null };
  }
  const parsed = tryParseAuditJson(split.jsonPart);
  const rawTail = split.jsonPart.trim();
  /** 落库 / coalesce 需保留附录（含与脚本一致的分隔符） */
  const markdown = rawTail ? `${split.body}${split.separator}${rawTail}` : split.body;
  return { markdown, json: parsed };
}

/**
 * 在进程 cwd（应为仓库根）下执行 `scripts/geo_principles_audit.py --json`。
 */
export async function runGeoPrinciplesAuditScript(): Promise<PrinciplesAuditResult> {
  const root = process.cwd();
  const script = path.join(root, "scripts", "geo_principles_audit.py");
  const py = pickPythonBinary();
  const args = [script, "--json"];

  try {
    const { stdout, stderr } = await execFileAsync(py, args, {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024,
      timeout: 90_000,
      windowsHide: true,
      encoding: "utf8",
    });
    const { markdown, json } = splitStdout(stdout);
    return {
      ok: true,
      exitCode: 0,
      markdown,
      json,
      stderr: stderr ?? "",
      command: [py, ...args],
    };
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException & {
      code?: string;
      status?: number;
      stdout?: string;
      stderr?: string;
    };
    const stdout = typeof err.stdout === "string" ? err.stdout : "";
    const { markdown, json } = splitStdout(stdout);
    return {
      ok: false,
      exitCode: typeof err.status === "number" ? err.status : null,
      markdown: markdown || stdout || "(无输出)",
      json,
      stderr: [err.stderr, err.message].filter(Boolean).join("\n"),
      command: [py, ...args],
    };
  }
}
