import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdminApiAuth } from "@/lib/require-admin-api";
import { getGeoAuditIssueById } from "@/lib/geo-audit-issues";
import {
  canPersistGeoAuditDecisions,
  insertGeoAuditDecision,
  isValidDecisionChoice,
} from "@/lib/geo-audit-decisions";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = checkRateLimit(`geo-audit-decisions:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = requireAdminApiAuth(request);
  if (!auth.ok) return auth.response;

  if (!canPersistGeoAuditDecisions()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const issueId = typeof (body as { issueId?: unknown }).issueId === "string" ? (body as { issueId: string }).issueId.trim() : "";
  const choiceRaw = (body as { choice?: unknown }).choice;

  if (!issueId) {
    return NextResponse.json({ error: "issueId required" }, { status: 400 });
  }
  if (!isValidDecisionChoice(choiceRaw)) {
    return NextResponse.json({ error: "invalid choice" }, { status: 400 });
  }

  const issue = await getGeoAuditIssueById(issueId);
  if (!issue) {
    return NextResponse.json({ error: "issue not found" }, { status: 404 });
  }

  const decisionId = await insertGeoAuditDecision(issueId, choiceRaw);
  if (!decisionId) {
    return NextResponse.json({ error: "persist failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: decisionId, issue_id: issueId, choice: choiceRaw });
}
