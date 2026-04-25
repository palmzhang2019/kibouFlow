import { getPg, isPgConfigured } from "@/lib/db";
import { isMissingRelationError } from "@/lib/pg-errors";
import { mergeScoreColumnsWithReportJson } from "@/lib/geo-audit-scores";
import { parsePrinciplesAuditJsonFromMarkdown } from "@/lib/geo-principles-audit-runner";

export type GeoAuditRunStatus = "running" | "success" | "failed";

export interface GeoAuditRunRow {
  id: string;
  status: GeoAuditRunStatus;
  started_at: string;
  finished_at: string | null;
  overall_score: number | null;
  retrievability_score: number | null;
  chunkability_score: number | null;
  extractability_score: number | null;
  trust_score: number | null;
  attributability_score: number | null;
  report_markdown: string | null;
  report_json: Record<string, unknown> | null;
  error_message: string | null;
  used_llm: boolean;
  llm_model: string | null;
  script_version: string | null;
  target_path: string | null;
  created_by: string | null;
}

/** 列表查询返回（不含大字段） */
export type GeoAuditRunSummary = Omit<GeoAuditRunRow, "report_json" | "error_message">;

/** 历史列表行：含未关闭问题数 */
export type GeoAuditRunListRow = GeoAuditRunSummary & { issue_open_count: number };

const MAX_REPORT_JSON_BYTES = 900_000;

export function canPersistGeoAuditRuns(): boolean {
  return isPgConfigured();
}

function truncateReportJson(input: unknown): Record<string, unknown> | null {
  if (input === null || input === undefined) return null;
  try {
    const s = JSON.stringify(input);
    if (s.length <= MAX_REPORT_JSON_BYTES) {
      return input as Record<string, unknown>;
    }
    return {
      truncated: true,
      original_length: s.length,
      preview: s.slice(0, 50_000),
    };
  } catch {
    return { truncated: true, error: "json_stringify_failed" };
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isTruncatedReportJsonPlaceholder(r: Record<string, unknown>): boolean {
  return r.truncated === true;
}

/**
 * 展示/API 用：优先从 `report_markdown` 尾部解析 JSON；否则使用未截断的 `report_json`。
 */
export function resolveGeoAuditReportPayload(row: GeoAuditRunRow): Record<string, unknown> | null {
  const fromMd = parsePrinciplesAuditJsonFromMarkdown(row.report_markdown);
  if (fromMd) return fromMd as Record<string, unknown>;
  const rj = row.report_json;
  if (rj && isRecord(rj) && !isTruncatedReportJsonPlaceholder(rj)) return rj;
  return null;
}

/**
 * 当表列与解析出的 JSON 根字段不一致（旧迁移、解析失败时列未更新、`report_json` 截断等）时，
 * 以有效载荷中的显式字段为准补全展示与 API。
 */
export function mergeGeoAuditRunMetaFromReportJson(row: GeoAuditRunRow): Pick<
  GeoAuditRunRow,
  "used_llm" | "llm_model" | "script_version" | "target_path"
> {
  const j = resolveGeoAuditReportPayload(row);
  const jsonUsed = j && typeof j.used_llm === "boolean" ? j.used_llm : null;
  const str = (k: "llm_model" | "script_version" | "target_path"): string | null => {
    const rowVal = row[k];
    const jsonVal = j?.[k];
    if (typeof rowVal === "string" && rowVal.length > 0) {
      return rowVal;
    }
    if (typeof jsonVal === "string" && jsonVal.length > 0) {
      return jsonVal;
    }
    return null;
  };
  return {
    used_llm: jsonUsed !== null ? jsonUsed : row.used_llm,
    llm_model: str("llm_model") ?? row.llm_model,
    script_version: str("script_version") ?? row.script_version,
    target_path: str("target_path") ?? row.target_path,
  };
}

function mapRunRow(r: Record<string, unknown>): GeoAuditRunRow {
  return {
    id: String(r.id),
    status: r.status as GeoAuditRunStatus,
    started_at: String(r.started_at),
    finished_at: r.finished_at != null ? String(r.finished_at) : null,
    overall_score: num(r.overall_score),
    retrievability_score: num(r.retrievability_score),
    chunkability_score: num(r.chunkability_score),
    extractability_score: num(r.extractability_score),
    trust_score: num(r.trust_score),
    attributability_score: num(r.attributability_score),
    report_markdown: r.report_markdown != null ? String(r.report_markdown) : null,
    report_json:
      r.report_json && typeof r.report_json === "object"
        ? (r.report_json as Record<string, unknown>)
        : null,
    error_message: r.error_message != null ? String(r.error_message) : null,
    used_llm: Boolean(r.used_llm),
    llm_model: r.llm_model != null ? String(r.llm_model) : null,
    script_version: r.script_version != null ? String(r.script_version) : null,
    target_path: r.target_path != null ? String(r.target_path) : null,
    created_by: r.created_by != null ? String(r.created_by) : null,
  };
}

export async function insertGeoAuditRunRunning(): Promise<string | null> {
  const sql = getPg();
  if (!sql) return null;
  try {
    const rows = await sql<{ id: string }[]>`
      insert into geo_audit_runs (status, started_at)
      values ('running', now())
      returning id::text as id
    `;
    return rows[0]?.id ?? null;
  } catch (e) {
    console.error("insertGeoAuditRunRunning", e);
    return null;
  }
}

export async function updateGeoAuditRun(
  id: string,
  patch: Partial<
    Pick<
      GeoAuditRunRow,
      | "status"
      | "finished_at"
      | "overall_score"
      | "retrievability_score"
      | "chunkability_score"
      | "extractability_score"
      | "trust_score"
      | "attributability_score"
      | "report_markdown"
      | "report_json"
      | "error_message"
      | "used_llm"
      | "llm_model"
      | "script_version"
      | "target_path"
    >
  >,
): Promise<boolean> {
  const sql = getPg();
  if (!sql) return false;
  try {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) payload[k] = v;
    }
    if (Object.keys(payload).length === 0) return true;
    await sql`
      update geo_audit_runs
      set ${sql(payload)}
      where id = ${id}::uuid
    `;
    return true;
  } catch (e) {
    console.error("updateGeoAuditRun", e);
    return false;
  }
}

export async function listGeoAuditRuns(limit = 50): Promise<GeoAuditRunListRow[]> {
  const sql = getPg();
  if (!sql) return [];
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select r.id, r.status, r.started_at, r.finished_at, r.overall_score, r.retrievability_score,
             r.chunkability_score, r.extractability_score, r.trust_score, r.attributability_score,
             r.report_markdown, r.report_json, r.used_llm, r.llm_model, r.script_version, r.target_path, r.created_by,
             coalesce(ic.cnt, 0)::int as issue_open_count
      from geo_audit_runs r
      left join (
        select run_id, count(*)::int as cnt
        from geo_audit_issues
        where status = 'open'
        group by run_id
      ) ic on ic.run_id = r.id
      order by r.started_at desc
      limit ${limit}
    `;
    return rows.map((r) => {
      const full = mapRunRow(r);
      const merged = mergeScoreColumnsWithReportJson(
        {
          overall_score: full.overall_score,
          retrievability_score: full.retrievability_score,
          chunkability_score: full.chunkability_score,
          extractability_score: full.extractability_score,
          trust_score: full.trust_score,
          attributability_score: full.attributability_score,
        },
        resolveGeoAuditReportPayload(full),
      );
      const meta = mergeGeoAuditRunMetaFromReportJson(full);
      const { report_json: _rj, error_message: _em, ...rest } = full;
      const cnt = r.issue_open_count;
      const issue_open_count =
        typeof cnt === "number" && Number.isFinite(cnt)
          ? cnt
          : typeof cnt === "string"
            ? parseInt(cnt, 10) || 0
            : 0;
      return { ...rest, ...merged, ...meta, issue_open_count };
    });
  } catch (e) {
    if (isMissingRelationError(e)) {
      try {
        const rows = await sql<Record<string, unknown>[]>`
          select id, status, started_at, finished_at, overall_score, retrievability_score,
                 chunkability_score, extractability_score, trust_score, attributability_score,
                 report_markdown, report_json, used_llm, llm_model, script_version, target_path, created_by
          from geo_audit_runs
          order by started_at desc
          limit ${limit}
        `;
        return rows.map((r) => {
          const full = mapRunRow(r);
          const merged = mergeScoreColumnsWithReportJson(
            {
              overall_score: full.overall_score,
              retrievability_score: full.retrievability_score,
              chunkability_score: full.chunkability_score,
              extractability_score: full.extractability_score,
              trust_score: full.trust_score,
              attributability_score: full.attributability_score,
            },
            resolveGeoAuditReportPayload(full),
          );
          const meta = mergeGeoAuditRunMetaFromReportJson(full);
          const { report_json: _rj, error_message: _em, ...rest } = full;
          return { ...rest, ...merged, ...meta, issue_open_count: 0 };
        });
      } catch (e2) {
        console.error("listGeoAuditRuns", e2);
        return [];
      }
    }
    console.error("listGeoAuditRuns", e);
    return [];
  }
}

/** 总览/对比用：不含 report_markdown / report_json */
export type GeoAuditRunScoreSnippet = Pick<
  GeoAuditRunRow,
  | "id"
  | "status"
  | "started_at"
  | "finished_at"
  | "overall_score"
  | "retrievability_score"
  | "chunkability_score"
  | "extractability_score"
  | "trust_score"
  | "attributability_score"
  | "used_llm"
  | "llm_model"
  | "script_version"
  | "target_path"
>;

export async function listLatestSuccessfulGeoAuditRunSnippets(limit = 2): Promise<GeoAuditRunScoreSnippet[]> {
  const sql = getPg();
  if (!sql) return [];
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select id, status, started_at, finished_at, overall_score, retrievability_score,
             chunkability_score, extractability_score, trust_score, attributability_score,
             used_llm, llm_model, script_version, target_path, report_json, report_markdown
      from geo_audit_runs
      where status = 'success'
      order by started_at desc
      limit ${limit}
    `;
    return rows.map((r) => {
      const full = mapRunRow(r);
      const merged = mergeScoreColumnsWithReportJson(
        {
          overall_score: full.overall_score,
          retrievability_score: full.retrievability_score,
          chunkability_score: full.chunkability_score,
          extractability_score: full.extractability_score,
          trust_score: full.trust_score,
          attributability_score: full.attributability_score,
        },
        resolveGeoAuditReportPayload(full),
      );
      const meta = mergeGeoAuditRunMetaFromReportJson(full);
      return {
        id: full.id,
        status: full.status,
        started_at: full.started_at,
        finished_at: full.finished_at,
        overall_score: merged.overall_score,
        retrievability_score: merged.retrievability_score,
        chunkability_score: merged.chunkability_score,
        extractability_score: merged.extractability_score,
        trust_score: merged.trust_score,
        attributability_score: merged.attributability_score,
        used_llm: meta.used_llm,
        llm_model: meta.llm_model,
        script_version: meta.script_version,
        target_path: meta.target_path,
      };
    });
  } catch (e) {
    console.error("listLatestSuccessfulGeoAuditRunSnippets", e);
    return [];
  }
}

export async function getGeoAuditRunById(id: string): Promise<GeoAuditRunRow | null> {
  const sql = getPg();
  if (!sql) return null;
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select * from geo_audit_runs where id = ${id}::uuid limit 1
    `;
    const r = rows[0];
    return r ? mapRunRow(r) : null;
  } catch (e) {
    console.error("getGeoAuditRunById", e);
    return null;
  }
}

export function serializeReportJsonForDb(json: unknown): Record<string, unknown> | null {
  return truncateReportJson(json);
}
