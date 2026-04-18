import { getPg, isPgConfigured } from "@/lib/db";

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

export async function listGeoAuditRuns(limit = 50): Promise<GeoAuditRunSummary[]> {
  const sql = getPg();
  if (!sql) return [];
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select id, status, started_at, finished_at, overall_score, retrievability_score,
             chunkability_score, extractability_score, trust_score, attributability_score,
             report_markdown, used_llm, llm_model, script_version, target_path, created_by
      from geo_audit_runs
      order by started_at desc
      limit ${limit}
    `;
    return rows.map((r) => {
      const full = mapRunRow(r);
      const { report_json: _rj, error_message: _em, ...rest } = full;
      return rest;
    });
  } catch (e) {
    console.error("listGeoAuditRuns", e);
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
