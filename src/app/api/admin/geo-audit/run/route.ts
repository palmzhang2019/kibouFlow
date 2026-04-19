import { NextRequest, NextResponse } from "next/server";
import {
  coalesceAuditJsonForPersist,
  runGeoPrinciplesAuditScript,
  type PrinciplesAuditJson,
} from "@/lib/geo-principles-audit-runner";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  canPersistGeoAuditRuns,
  insertGeoAuditRunRunning,
  serializeReportJsonForDb,
  updateGeoAuditRun,
} from "@/lib/geo-audit-runs";
import { insertGeoAuditIssuesForRun, normalizeIssueInputs } from "@/lib/geo-audit-issues";
import { extractScoresFromAuditJson } from "@/lib/geo-audit-scores";
import { requireAdminApiAuth } from "@/lib/require-admin-api";
function readMeta(j: PrinciplesAuditJson | null) {
  if (!j) {
    return {
      used_llm: false,
      llm_model: null as string | null,
      script_version: null as string | null,
      target_path: process.cwd(),
    };
  }
  return {
    used_llm: Boolean(j.used_llm),
    llm_model: typeof j.llm_model === "string" ? j.llm_model : null,
    script_version: typeof j.script_version === "string" ? j.script_version : null,
    target_path: typeof j.target_path === "string" ? j.target_path : process.cwd(),
  };
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = checkRateLimit(`geo-audit-run:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = requireAdminApiAuth(request);
  if (!auth.ok) return auth.response;

  const runId = canPersistGeoAuditRuns() ? await insertGeoAuditRunRunning() : null;

  const result = await runGeoPrinciplesAuditScript();
  const merged = coalesceAuditJsonForPersist(result.json, result.markdown);
  const scores = extractScoresFromAuditJson(merged);
  const meta = readMeta(merged);
  const issuesPayload = normalizeIssueInputs(merged?.issues);
  const finishedAt = new Date().toISOString();

  const errMsg = result.ok
    ? null
    : [result.stderr, result.exitCode != null ? `exitCode=${result.exitCode}` : ""].filter(Boolean).join("\n") ||
      "audit_failed";

  let issues_inserted = 0;
  if (runId) {
    await updateGeoAuditRun(runId, {
      status: result.ok ? "success" : "failed",
      finished_at: finishedAt,
      ...scores,
      report_markdown: result.markdown,
      report_json: serializeReportJsonForDb(merged),
      error_message: errMsg,
      used_llm: meta.used_llm,
      llm_model: meta.llm_model,
      script_version: meta.script_version,
      target_path: meta.target_path,
    });
    if (result.ok && issuesPayload.length > 0) {
      issues_inserted = await insertGeoAuditIssuesForRun(runId, issuesPayload);
    }
  }

  return NextResponse.json(
    {
      ok: result.ok,
      id: runId,
      persisted: Boolean(runId),
      issues_inserted,
      exitCode: result.exitCode,
      markdown: result.markdown,
      json: merged ?? result.json,
      issues: issuesPayload,
      stderr: result.stderr,
      command: result.command,
      error: result.ok ? undefined : errMsg ?? undefined,
      used_llm: meta.used_llm,
      llm_model: meta.llm_model,
      script_version: meta.script_version,
      target_path: meta.target_path,
      ...scores,
    },
    { status: result.ok ? 200 : 500 },
  );
}
