import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  canPersistGeoAuditRuns,
  getGeoAuditRunById,
  listLatestSuccessfulGeoAuditRunSnippets,
  resolveGeoAuditReportPayload,
} from "@/lib/geo-audit-runs";
import { listGeoAuditIssuesByRunIdWithDecisionStats, normalizeIssueInputs } from "@/lib/geo-audit-issues";
import { getMissingDatabaseEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GeoAuditIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ runId?: string }>;
}) {
  const { runId: runIdParam } = await searchParams;

  if (!canPersistGeoAuditRuns()) {
    const missing = getMissingDatabaseEnv();
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">问题中心</h2>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">需要数据库以查看已落库问题</p>
          <ul className="mt-2 list-inside list-disc">
            {missing.map((name) => (
              <li key={name}>
                <code className="rounded bg-amber-100 px-1">{name}</code>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/admin/geo-audit/run" className="text-sm text-primary underline">
          运行体检（结果仅返回 JSON，不入库）
        </Link>
      </div>
    );
  }

  let runId = runIdParam?.trim() || "";
  if (!runId) {
    const snip = await listLatestSuccessfulGeoAuditRunSnippets(1);
    runId = snip[0]?.id ?? "";
  }

  if (!runId) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">问题中心</h2>
        <p className="text-sm text-muted-foreground">暂无成功体检记录。请先运行体检。</p>
        <Link href="/admin/geo-audit/run" className="text-sm font-medium text-primary underline">
          运行 GEO 体检
        </Link>
      </div>
    );
  }

  const run = await getGeoAuditRunById(runId);
  if (!run) notFound();

  const dbIssues = await listGeoAuditIssuesByRunIdWithDecisionStats(runId);
  const payload = resolveGeoAuditReportPayload(run);
  const fallbackInputs =
    dbIssues.length === 0 && payload ? normalizeIssueInputs(payload.issues) : [];
  const issuesFromJsonOnly = dbIssues.length === 0 && fallbackInputs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">问题中心</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/geo-audit" className="text-primary underline">
            总览
          </Link>
          <Link href={`/admin/geo-audit/history/${runId}`} className="text-primary underline">
            本次体检详情
          </Link>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        体检记录 <span className="font-mono text-xs">{runId}</span> · {run.status} ·{" "}
        {new Date(run.started_at).toLocaleString("zh-CN")}
      </p>

      {issuesFromJsonOnly ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          以下条目来自 <code className="rounded bg-muted px-1">report_json.issues</code>
          （尚未写入 <code className="rounded bg-muted px-1">geo_audit_issues</code> 表；详情页「结构化问题」与此一致）。
        </p>
      ) : null}

      {dbIssues.length === 0 && fallbackInputs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          该记录没有问题行（可能为旧脚本或未写入）。可在详情页查看原始{" "}
          <code className="rounded bg-muted px-1">report_json.issues</code>。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium whitespace-nowrap">时间</th>
                <th className="px-3 py-2 font-medium">严重度</th>
                <th className="px-3 py-2 font-medium">层级</th>
                <th className="px-3 py-2 font-medium">代码</th>
                <th className="px-3 py-2 font-medium">决策</th>
                <th className="px-3 py-2 font-medium">标题</th>
              </tr>
            </thead>
            <tbody>
              {dbIssues.length > 0
                ? dbIssues.map((i) => (
                    <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 align-top whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(i.created_at).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-3 py-2 align-top">{i.severity}</td>
                      <td className="px-3 py-2 align-top">{i.layer}</td>
                      <td className="px-3 py-2 align-top font-mono text-xs">
                        <Link href={`/admin/geo-audit/issues/${i.id}`} className="text-primary underline">
                          {i.code}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {i.decision_count > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                              已决策 · {i.decision_count} 条
                            </span>
                            <Link href={`/admin/geo-audit/issues/${i.id}`} className="text-xs text-primary underline">
                              调整 / 追加
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">未决策</span>
                            <Link href={`/admin/geo-audit/issues/${i.id}`} className="text-xs text-primary underline">
                              去记录
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">{i.title}</td>
                    </tr>
                  ))
                : fallbackInputs.map((i, idx) => (
                    <tr key={`json-${runId}-${idx}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">—</td>
                      <td className="px-3 py-2 align-top">{i.severity}</td>
                      <td className="px-3 py-2 align-top">{i.layer}</td>
                      <td className="px-3 py-2 align-top font-mono text-xs">
                        <Link
                          href={`/admin/geo-audit/issues/by-code?runId=${encodeURIComponent(runId)}&code=${encodeURIComponent(i.code)}`}
                          className="text-primary underline"
                        >
                          {i.code}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">—</td>
                      <td className="px-3 py-2 align-top">{i.title}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
