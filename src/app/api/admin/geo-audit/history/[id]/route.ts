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
