import postgres from "postgres";
import { getPg, isPgConfigured } from "@/lib/db";
import { isMissingRelationError } from "@/lib/pg-errors";

function recordAsPostgresJson(obj: Record<string, unknown>): postgres.JSONValue {
  return JSON.parse(JSON.stringify(obj)) as postgres.JSONValue;
}

let warnedGeoAuditIssuesTableMissing = false;

function warnGeoAuditIssuesMigrationOnce() {
  if (warnedGeoAuditIssuesTableMissing) return;
  warnedGeoAuditIssuesTableMissing = true;
  console.warn(
    "[geo_audit_issues] 表不存在：请在数据库执行 supabase/migrations/006_geo_audit_issues.sql（及后续迁移）。在此之前将不读写 issues。",
  );
}

export type GeoAuditIssueSeverity = "critical" | "high" | "medium" | "low";
export type GeoAuditIssueLayer = "site" | "template" | "page" | "locale_pair";
export type GeoAuditIssueStatus = "open" | "superseded";

export interface GeoAuditIssueRow {
  id: string;
  run_id: string;
  code: string;
  title: string;
  severity: GeoAuditIssueSeverity;
  layer: GeoAuditIssueLayer;
  status: GeoAuditIssueStatus;
  evidence: Record<string, unknown>;
  facts_snapshot: Record<string, unknown> | null;
  created_at: string;
}

/** 列表用：含 `geo_audit_decisions` 条数 */
export type GeoAuditIssueListRow = GeoAuditIssueRow & { decision_count: number };

export interface GeoAuditIssueInput {
  code: string;
  title: string;
  severity: GeoAuditIssueSeverity;
  layer: GeoAuditIssueLayer;
  evidence?: Record<string, unknown>;
  facts_snapshot?: Record<string, unknown> | null;
}

/** Python / API JSON 中的单条 issue 形态 */
export type GeoAuditIssueJsonPayload = Pick<GeoAuditIssueInput, "code" | "title" | "severity" | "layer"> & {
  evidence?: Record<string, unknown>;
  facts_snapshot?: Record<string, unknown> | null;
};

const SEVERITIES: GeoAuditIssueSeverity[] = ["critical", "high", "medium", "low"];
const LAYERS: GeoAuditIssueLayer[] = ["site", "template", "page", "locale_pair"];

const MAX_ISSUES_PER_RUN = 120;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function normalizeIssueInputs(raw: unknown): GeoAuditIssueInput[] {
  if (!Array.isArray(raw)) return [];
  const out: GeoAuditIssueInput[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const code = typeof item.code === "string" ? item.code.trim() : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!code || !title) continue;
    const sev = item.severity;
    const layer = item.layer;
    if (!SEVERITIES.includes(sev as GeoAuditIssueSeverity)) continue;
    if (!LAYERS.includes(layer as GeoAuditIssueLayer)) continue;
    const evidence = isRecord(item.evidence) ? item.evidence : {};
    const facts_snapshot =
      item.facts_snapshot === null || item.facts_snapshot === undefined
        ? null
        : isRecord(item.facts_snapshot)
          ? item.facts_snapshot
          : null;
    out.push({
      code,
      title,
      severity: sev as GeoAuditIssueSeverity,
      layer: layer as GeoAuditIssueLayer,
      evidence,
      facts_snapshot,
    });
    if (out.length >= MAX_ISSUES_PER_RUN) break;
  }
  return out;
}

export function canPersistGeoAuditIssues(): boolean {
  return isPgConfigured();
}

export async function insertGeoAuditIssuesForRun(
  runId: string,
  issues: GeoAuditIssueInput[],
): Promise<number> {
  const sql = getPg();
  if (!sql || issues.length === 0) return 0;
  let inserted = 0;
  for (const row of issues) {
    try {
      await sql`
        insert into geo_audit_issues (run_id, code, title, severity, layer, status, evidence, facts_snapshot)
        values (
          ${runId}::uuid,
          ${row.code},
          ${row.title},
          ${row.severity},
          ${row.layer},
          'open',
          ${sql.json(recordAsPostgresJson(row.evidence ?? {}))},
          ${row.facts_snapshot == null ? null : sql.json(recordAsPostgresJson(row.facts_snapshot))}
        )
      `;
      inserted += 1;
    } catch (e) {
      if (isMissingRelationError(e)) {
        warnGeoAuditIssuesMigrationOnce();
        return inserted;
      }
      console.error("insertGeoAuditIssuesForRun", row.code, e);
    }
  }
  return inserted;
}

function parseJsonbObject(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

function intFromUnknown(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return 0;
}

function mapIssueRow(r: Record<string, unknown>): GeoAuditIssueRow {
  const ev = parseJsonbObject(r.evidence);
  const fs = parseJsonbObject(r.facts_snapshot);
  return {
    id: String(r.id),
    run_id: String(r.run_id),
    code: String(r.code),
    title: String(r.title),
    severity: r.severity as GeoAuditIssueSeverity,
    layer: r.layer as GeoAuditIssueLayer,
    status: r.status as GeoAuditIssueStatus,
    evidence: ev ?? {},
    facts_snapshot: fs,
    created_at: String(r.created_at),
  };
}

export async function getGeoAuditIssueById(issueId: string): Promise<GeoAuditIssueRow | null> {
  const sql = getPg();
  if (!sql) return null;
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select * from geo_audit_issues where id = ${issueId}::uuid limit 1
    `;
    const r = rows[0];
    return r ? mapIssueRow(r) : null;
  } catch (e) {
    if (isMissingRelationError(e)) {
      warnGeoAuditIssuesMigrationOnce();
      return null;
    }
    console.error("getGeoAuditIssueById", e);
    return null;
  }
}

export async function listGeoAuditIssuesByRunId(runId: string): Promise<GeoAuditIssueRow[]> {
  const sql = getPg();
  if (!sql) return [];
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select * from geo_audit_issues
      where run_id = ${runId}::uuid
      order by
        case severity
          when 'critical' then 1
          when 'high' then 2
          when 'medium' then 3
          when 'low' then 4
          else 5
        end,
        code asc
    `;
    return rows.map(mapIssueRow);
  } catch (e) {
    if (isMissingRelationError(e)) {
      warnGeoAuditIssuesMigrationOnce();
      return [];
    }
    console.error("listGeoAuditIssuesByRunId", e);
    return [];
  }
}

/** 问题中心列表：附带每条已提交的决策条数（`geo_audit_decisions`）。 */
export async function listGeoAuditIssuesByRunIdWithDecisionStats(runId: string): Promise<GeoAuditIssueListRow[]> {
  const sql = getPg();
  if (!sql) return [];
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select i.*, coalesce(dc.cnt, 0)::int as decision_count
      from geo_audit_issues i
      left join (
        select issue_id, count(*)::int as cnt from geo_audit_decisions group by issue_id
      ) dc on dc.issue_id = i.id
      where i.run_id = ${runId}::uuid
      order by
        case i.severity
          when 'critical' then 1
          when 'high' then 2
          when 'medium' then 3
          when 'low' then 4
          else 5
        end,
        i.code asc
    `;
    return rows.map((r) => ({
      ...mapIssueRow(r),
      decision_count: intFromUnknown(r.decision_count),
    }));
  } catch (e) {
    if (isMissingRelationError(e)) {
      const base = await listGeoAuditIssuesByRunId(runId);
      return base.map((i) => ({ ...i, decision_count: 0 }));
    }
    console.error("listGeoAuditIssuesByRunIdWithDecisionStats", e);
    return [];
  }
}

export async function countOpenGeoAuditIssuesByRunId(runId: string): Promise<number> {
  const sql = getPg();
  if (!sql) return 0;
  try {
    const rows = await sql<{ n: string }[]>`
      select count(*)::text as n from geo_audit_issues
      where run_id = ${runId}::uuid and status = 'open'
    `;
    const n = rows[0]?.n;
    return n ? parseInt(n, 10) || 0 : 0;
  } catch (e) {
    if (isMissingRelationError(e)) {
      warnGeoAuditIssuesMigrationOnce();
      return 0;
    }
    console.error("countOpenGeoAuditIssuesByRunId", e);
    return 0;
  }
}
