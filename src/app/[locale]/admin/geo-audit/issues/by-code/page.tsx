import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import {
  canPersistGeoAuditRuns,
  getGeoAuditRunById,
  resolveGeoAuditReportPayload,
} from "@/lib/geo-audit-runs";
import { listGeoAuditIssuesByRunId, normalizeIssueInputs } from "@/lib/geo-audit-issues";
import { getMissingDatabaseEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GeoAuditIssueByCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ runId?: string; code?: string }>;
}) {
  const { locale } = await params;
  const { runId: runIdRaw, code: codeRaw } = await searchParams;
  const runId = runIdRaw?.trim() ?? "";
  const code = codeRaw?.trim() ?? "";
  if (!runId || !code) notFound();

  if (!canPersistGeoAuditRuns()) {
    const missing = getMissingDatabaseEnv();
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">问题详情</h2>
        <p className="text-sm text-muted-foreground">需要数据库连接。</p>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          {missing.map((n) => (
            <li key={n}>
              <code className="rounded bg-muted px-1">{n}</code>
            </li>
          ))}
        </ul>
        <Link href="/admin/geo-audit/issues" className="text-sm text-primary underline">
          返回问题中心
        </Link>
      </div>
    );
  }

  const run = await getGeoAuditRunById(runId);
  if (!run) notFound();

  const dbIssues = await listGeoAuditIssuesByRunId(runId);
  const dbHit = dbIssues.find((i) => i.code === code);
  if (dbHit) {
    redirect(`/${locale}/admin/geo-audit/issues/${dbHit.id}`);
  }

  const payload = resolveGeoAuditReportPayload(run);
  const normalized = payload ? normalizeIssueInputs(payload.issues) : [];
  const issue = normalized.find((i) => i.code === code);
  if (!issue) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">问题详情</h2>
        <Link href={`/admin/geo-audit/issues?runId=${runId}`} className="text-sm text-primary underline">
          返回列表
        </Link>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        本条来自报告内嵌 JSON，尚未写入 <code className="rounded bg-amber-100 px-1">geo_audit_issues</code>
        表；无法在此提交「决策」记录。重新体检且 issues 落库后，同一 <code className="rounded bg-amber-100 px-1">code</code>{" "}
        将跳转到已落库详情页。
      </p>

      <dl className="grid gap-2 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">代码</dt>
          <dd className="font-mono text-xs">{issue.code}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">严重度 / 层级</dt>
          <dd>
            {issue.severity} · {issue.layer}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">标题</dt>
          <dd>{issue.title}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">证据（JSON）</dt>
          <dd>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/50 p-2 text-xs">
              {JSON.stringify(issue.evidence ?? {}, null, 2)}
            </pre>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">状态</dt>
          <dd>报告内嵌（未落库）</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">体检 run</dt>
          <dd>
            <Link href={`/admin/geo-audit/history/${runId}`} className="text-primary underline">
              {runId}
            </Link>
          </dd>
        </div>
      </dl>
    </div>
  );
}
