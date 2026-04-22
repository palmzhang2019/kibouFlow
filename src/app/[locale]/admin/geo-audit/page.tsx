import { Link } from "@/i18n/navigation";
import {
  canPersistGeoAuditRuns,
  getGeoAuditRunById,
  listLatestSuccessfulGeoAuditRunSnippets,
  resolveGeoAuditReportPayload,
} from "@/lib/geo-audit-runs";
import { getMissingDatabaseEnv } from "@/lib/db";
import { listGeoAuditIssuesByRunId, normalizeIssueInputs, type GeoAuditIssueRow } from "@/lib/geo-audit-issues";

export const dynamic = "force-dynamic";

function scoreCell(value: number | null) {
  return value == null ? "—" : String(value);
}

function aggregateSeverity(issues: GeoAuditIssueRow[]) {
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of issues) {
    counts[issue.severity] = (counts[issue.severity] ?? 0) + 1;
  }
  return counts;
}

export default async function GeoAuditDashboardPage() {
  if (!canPersistGeoAuditRuns()) {
    const missing = getMissingDatabaseEnv();
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">总览</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            未配置数据库时仍可运行体检脚本，但历史记录与总览数据无法落库。
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">未检测到 PostgreSQL 连接</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {missing.map((name) => (
              <li key={name}>
                <code className="rounded bg-amber-100 px-1">{name}</code>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/geo-audit/run"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            运行站点体检
          </Link>
          <Link href="/admin/geo-audit/history" className="rounded-md border border-border px-4 py-2 text-sm">
            历史记录
          </Link>
        </div>
      </div>
    );
  }

  const snippets = await listLatestSuccessfulGeoAuditRunSnippets(2);
  const latest = snippets[0];
  const previous = snippets[1];

  let issues: GeoAuditIssueRow[] = [];
  let issuesFromReportJsonOnly = false;

  if (latest) {
    issues = await listGeoAuditIssuesByRunId(latest.id);
    if (issues.length === 0) {
      const fullRun = await getGeoAuditRunById(latest.id);
      const payload = fullRun ? resolveGeoAuditReportPayload(fullRun) : null;
      const rawIssues = normalizeIssueInputs(payload?.issues);

      if (rawIssues.length > 0) {
        issuesFromReportJsonOnly = true;
        const timestamp = fullRun?.finished_at ?? fullRun?.started_at ?? "";
        issues = rawIssues.map((issue, index) => ({
          id: `json-preview-${latest.id}-${index}`,
          run_id: latest.id,
          code: issue.code,
          title: issue.title,
          severity: issue.severity,
          layer: issue.layer,
          status: "open",
          evidence: issue.evidence ?? {},
          facts_snapshot: issue.facts_snapshot ?? null,
          created_at: timestamp,
        }));
      }
    }
  }

  const severityCounts = aggregateSeverity(issues);
  const noNumericScores =
    !!latest &&
    [
      latest.overall_score,
      latest.retrievability_score,
      latest.chunkability_score,
      latest.extractability_score,
      latest.trust_score,
      latest.attributability_score,
    ].every((value) => value == null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">总览</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          这里只保留最近一次成功体检的核心结果、与上一次成功体检的分数对比，以及结构化问题概览。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/geo-audit/run"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          运行站点体检
        </Link>
        <Link href="/admin/geo-audit/history" className="rounded-md border border-border px-4 py-2 text-sm">
          历史记录
        </Link>
        {latest ? (
          <Link
            href={`/admin/geo-audit/history/${latest.id}`}
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            最近一次体检详情
          </Link>
        ) : null}
      </div>

      {!latest ? (
        <p className="text-sm text-muted-foreground">
          暂无成功入库的体检记录。请先前往
          <Link href="/admin/geo-audit/run" className="mx-1 font-medium text-primary underline">
            运行体检
          </Link>
          。
        </p>
      ) : (
        <>
          {noNumericScores ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">当前无法从报告中解析出五维分数</p>
              <p className="mt-2 text-muted-foreground">
                常见原因是 <code className="rounded bg-amber-100 px-1">report_json</code> 中缺少
                <code className="mx-1 rounded bg-amber-100 px-1">scores</code>
                字段，或脚本输出被截断。建议重新运行一次体检并查看最近一次记录详情。
              </p>
            </div>
          ) : null}

          {issuesFromReportJsonOnly ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-950">
              当前结构化问题来自 <code className="rounded bg-blue-100 px-1">report_json.issues</code>，
              尚未写入 <code className="rounded bg-blue-100 px-1">geo_audit_issues</code> 表。
            </div>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-medium">五维分数（最近一次成功）</h3>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">总分</dt>
                <dd className="text-2xl font-semibold">{scoreCell(latest.overall_score)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">可召回</dt>
                <dd className="text-xl font-medium">{scoreCell(latest.retrievability_score)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">可切块</dt>
                <dd className="text-xl font-medium">{scoreCell(latest.chunkability_score)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">可抽取</dt>
                <dd className="text-xl font-medium">{scoreCell(latest.extractability_score)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">可信度</dt>
                <dd className="text-xl font-medium">{scoreCell(latest.trust_score)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">可归因</dt>
                <dd className="text-xl font-medium">{scoreCell(latest.attributability_score)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              完成于 {new Date(latest.finished_at ?? latest.started_at).toLocaleString("zh-CN")}，脚本版本{" "}
              {latest.script_version ?? "—"}
            </p>
          </section>

          {previous ? (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">与上一次成功体检对比（分数差）</h3>
              <div className="overflow-x-auto rounded-lg border border-border text-sm">
                <table className="w-full min-w-[480px] text-left">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 font-medium">维度</th>
                      <th className="px-3 py-2 font-medium">本次</th>
                      <th className="px-3 py-2 font-medium">上次</th>
                      <th className="px-3 py-2 font-medium">差值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["总分", "overall_score"],
                        ["可召回", "retrievability_score"],
                        ["可切块", "chunkability_score"],
                        ["可抽取", "extractability_score"],
                        ["可信度", "trust_score"],
                        ["可归因", "attributability_score"],
                      ] as const
                    ).map(([label, key]) => {
                      const currentValue = latest[key] ?? null;
                      const previousValue = previous[key] ?? null;
                      const diff =
                        currentValue != null && previousValue != null
                          ? Math.round((currentValue - previousValue) * 10) / 10
                          : null;

                      return (
                        <tr key={key} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">{label}</td>
                          <td className="px-3 py-2 font-mono">{scoreCell(currentValue)}</td>
                          <td className="px-3 py-2 font-mono">{scoreCell(previousValue)}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {diff == null ? "—" : diff > 0 ? `+${diff}` : String(diff)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-sm font-medium">结构化问题（不考虑是否被关闭）</h3>
              <span className="text-xs text-muted-foreground">共 {issues.length} 条</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {(["critical", "high", "medium", "low"] as const).map((key) => (
                <div key={key} className="rounded-lg border border-border bg-background px-3 py-2 text-center">
                  <div className="text-xs capitalize text-muted-foreground">{key}</div>
                  <div className="text-lg font-semibold">{severityCounts[key] ?? 0}</div>
                </div>
              ))}
            </div>
            {issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">最近一次成功体检暂无结构化问题数据。</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3 text-sm">
                {issues.slice(0, 12).map((issue) => (
                  <li key={issue.id} className="flex flex-wrap gap-2 border-b border-border/60 pb-2 last:border-0">
                    <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>
                    <span className="text-muted-foreground">[{issue.severity}]</span>
                    <span>{issue.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
