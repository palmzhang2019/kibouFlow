import { NextRequest, NextResponse } from "next/server";
import { listGeoAuditRuns } from "@/lib/geo-audit-runs";
import { summaryFromMarkdown } from "@/lib/geo-audit-scores";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdminApiAuth } from "@/lib/require-admin-api";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = checkRateLimit(`geo-audit-history:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = requireAdminApiAuth(request);
  if (!auth.ok) return auth.response;

  const rows = await listGeoAuditRuns(50);
  const items = rows.map((r) => ({
    id: r.id,
    status: r.status,
    started_at: r.started_at,
    finished_at: r.finished_at,
    overall_score: r.overall_score,
    retrievability_score: r.retrievability_score,
    chunkability_score: r.chunkability_score,
    extractability_score: r.extractability_score,
    trust_score: r.trust_score,
    attributability_score: r.attributability_score,
    summary: summaryFromMarkdown(r.report_markdown ?? ""),
    used_llm: r.used_llm,
    script_version: r.script_version,
  }));

  return NextResponse.json({ items });
}
