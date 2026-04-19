import { getPg, isPgConfigured } from "@/lib/db";
import { isMissingRelationError } from "@/lib/pg-errors";
import type { GeoAuditDecisionChoice } from "@/lib/geo-audit-decision-schema";
import {
  GEO_AUDIT_DECISION_CHOICE_LABEL_ZH,
  isValidGeoAuditDecisionChoice,
} from "@/lib/geo-audit-decision-schema";

export type { GeoAuditDecisionChoice };
export { GEO_AUDIT_DECISION_CHOICE_LABEL_ZH };

export interface GeoAuditDecisionRow {
  id: string;
  issue_id: string;
  choice: GeoAuditDecisionChoice;
  created_at: string;
}

export function canPersistGeoAuditDecisions(): boolean {
  return isPgConfigured();
}

export function isValidDecisionChoice(v: unknown): v is GeoAuditDecisionChoice {
  return isValidGeoAuditDecisionChoice(v);
}

export async function insertGeoAuditDecision(
  issueId: string,
  choice: GeoAuditDecisionChoice,
): Promise<string | null> {
  const sql = getPg();
  if (!sql) return null;
  try {
    const rows = await sql<{ id: string }[]>`
      insert into geo_audit_decisions (issue_id, choice)
      values (${issueId}::uuid, ${choice})
      returning id::text as id
    `;
    return rows[0]?.id ?? null;
  } catch (e) {
    if (isMissingRelationError(e)) {
      return null;
    }
    console.error("insertGeoAuditDecision", e);
    return null;
  }
}

export type GeoAuditDecisionListRow = GeoAuditDecisionRow & {
  issue_code: string;
  issue_title: string;
  issue_run_id: string;
};

export async function listRecentGeoAuditDecisionsWithIssues(limit = 100): Promise<GeoAuditDecisionListRow[]> {
  const sql = getPg();
  if (!sql) return [];
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select d.id, d.issue_id, d.choice, d.created_at,
             i.code as issue_code, i.title as issue_title, i.run_id::text as issue_run_id
      from geo_audit_decisions d
      inner join geo_audit_issues i on i.id = d.issue_id
      order by d.created_at desc
      limit ${limit}
    `;
    return rows.map((r) => ({
      id: String(r.id),
      issue_id: String(r.issue_id),
      choice: r.choice as GeoAuditDecisionChoice,
      created_at: String(r.created_at),
      issue_code: String(r.issue_code),
      issue_title: String(r.issue_title),
      issue_run_id: String(r.issue_run_id),
    }));
  } catch (e) {
    if (isMissingRelationError(e)) {
      return [];
    }
    console.error("listRecentGeoAuditDecisionsWithIssues", e);
    return [];
  }
}

export async function listGeoAuditDecisionsByIssueId(issueId: string): Promise<GeoAuditDecisionRow[]> {
  const sql = getPg();
  if (!sql) return [];
  try {
    const rows = await sql<Record<string, unknown>[]>`
      select id, issue_id, choice, created_at
      from geo_audit_decisions
      where issue_id = ${issueId}::uuid
      order by created_at desc
    `;
    return rows.map((r) => ({
      id: String(r.id),
      issue_id: String(r.issue_id),
      choice: r.choice as GeoAuditDecisionChoice,
      created_at: String(r.created_at),
    }));
  } catch (e) {
    if (isMissingRelationError(e)) {
      return [];
    }
    console.error("listGeoAuditDecisionsByIssueId", e);
    return [];
  }
}
