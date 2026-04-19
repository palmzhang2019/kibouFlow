import { Link } from "@/i18n/navigation";
import {
  canPersistGeoAuditRuns,
  getGeoAuditRunById,
  listLatestSuccessfulGeoAuditRunSnippets,
  resolveGeoAuditReportPayload,
} from "@/lib/geo-audit-runs";
import { listGeoAuditIssuesByRunId, normalizeIssueInputs, type GeoAuditIssueRow } from "@/lib/geo-audit-issues";
import { getMissingDatabaseEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

function scoreCell(v: number | null) {
  return v == null ? "—" : String(v);
}

function aggregateSeverity(issues: GeoAuditIssueRow[]) {
  const m: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of issues) {
    m[i.severity] = (m[i.severity] ?? 0) + 1;
  }
  return m;
}

export default async function GeoAuditDashboardPage() {
  if (!canPersistGeoAuditRuns()) {
    const missing = getMissingDatabaseEnv();
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">总览台</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            未配置数据库时仍可运行体检脚本，但历史、问题落库与对比不可用。
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
            运行 GEO 体检
          </Link>
          <Link href="/admin/geo-audit/issues" className="rounded-md border border-border px-4 py-2 text-sm">
            问题中心
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
      const full = await getGeoAuditRunById(latest.id);
      const payload = full ? resolveGeoAuditReportPayload(full) : null;
      const raw = normalizeIssueInputs(payload?.issues);
      if (raw.length > 0) {
        issuesFromReportJsonOnly = true;
        const ts = full?.finished_at ?? full?.started_at ?? "";
        issues = raw.map((inp, i) => ({
          id: `json-preview-${latest.id}-${i}`,
          run_id: latest.id,
          code: inp.code,
          title: inp.title,
          severity: inp.severity,
          layer: inp.layer,
          status: "open" as const,
          evidence: inp.evidence ?? {},
          facts_snapshot: inp.facts_snapshot ?? null,
          created_at: ts,
        }));
      }
    }
  }
  const bySev = aggregateSeverity(issues);
  const openCount = issues.filter((i) => i.status === "open").length;
  const noNumericScores =
    !!latest &&
    [
      latest.overall_score,
      latest.retrievability_score,
      latest.chunkability_score,
      latest.extractability_score,
      latest.trust_score,
      latest.attributability_score,
    ].every((x) => x == null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">总览台</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          最近一次成功体检的分数与结构化问题摘要；详细报告与 Markdown 仍可在单次记录中查看。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/geo-audit/run"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          运行 GEO 体检
        </Link>
        {latest ? (
          <Link
            href={`/admin/geo-audit/history/${latest.id}`}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            最近一次体检详情
          </Link>
        ) : null}
        <Link href="/admin/geo-audit/issues" className="rounded-md border border-border px-4 py-2 text-sm">
          问题中心
        </Link>
        <Link href="/admin/geo-audit/history" className="rounded-md border border-border px-4 py-2 text-sm">
          历史记录
        </Link>
      </div>

      {!latest ? (
        <p className="text-sm text-muted-foreground">
          尚无成功入库的体检记录。请先
          <Link href="/admin/geo-audit/run" className="mx-1 font-medium text-primary underline">
            运行一次体检
          </Link>
          。
        </p>
      ) : (
        <>
          {noNumericScores ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">当前无法在报告中解析出五维分数</p>
              <p className="mt-2 text-muted-foreground">
                常见原因：<code className="rounded bg-amber-100 px-1">report_json</code> 里没有{" "}
                <code className="rounded bg-amber-100 px-1">scores</code>（例如 Python 未输出 JSON 段、JSON
                解析失败或被截断）。请确认进程环境里能执行 Python 脚本后重新「运行体检」，并打开
                <Link href={`/admin/geo-audit/history/${latest.id}`} className="mx-1 font-medium text-primary underline">
                  该次详情
                </Link>
                折叠区查看原始 Markdown / JSON。
              </p>
            </div>
          ) : null}
          {issuesFromReportJsonOnly ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-950">
              以下结构化问题来自 <code className="rounded bg-blue-100 px-1">report_json.issues</code>
              （尚未写入 <code className="rounded bg-blue-100 px-1">geo_audit_issues</code> 表时仍可在总览预览）。
            </div>
          ) : null}
          <section className="space-y-3">
            <h3 className="text-sm font-medium">五维分数（最近一次成功）</h3>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">总分（启发式）</dt>
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
                <dt className="text-xs text-muted-foreground">可信</dt>
                <dd className="text-xl font-medium">{scoreCell(latest.trust_score)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">可归因</dt>
                <dd className="text-xl font-medium">{scoreCell(latest.attributability_score)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              完成于 {new Date(latest.finished_at ?? latest.started_at).toLocaleString("zh-CN")} · 脚本{" "}
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
                      <th className="px-3 py-2 font-medium">差</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["总分", "overall_score"],
                        ["可召回", "retrievability_score"],
                        ["可切块", "chunkability_score"],
                        ["可抽取", "extractability_score"],
                        ["可信", "trust_score"],
                        ["可归因", "attributability_score"],
                      ] as const
                    ).map(([label, key]) => {
                      const a = latest[key] ?? null;
                      const b = previous[key] ?? null;
                      const diff =
                        a != null && b != null ? Math.round((a - b) * 10) / 10 : null;
                      return (
                        <tr key={key} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">{label}</td>
                          <td className="px-3 py-2 font-mono">{scoreCell(a)}</td>
                          <td className="px-3 py-2 font-mono">{scoreCell(b)}</td>
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
              <h3 className="text-sm font-medium">结构化问题（当前未关闭）</h3>
              <span className="text-xs text-muted-foreground">共 {openCount} 条</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {(["critical", "high", "medium", "low"] as const).map((k) => (
                <div key={k} className="rounded-lg border border-border bg-background px-3 py-2 text-center">
                  <div className="text-xs capitalize text-muted-foreground">{k}</div>
                  <div className="text-lg font-semibold">{bySev[k] ?? 0}</div>
                </div>
              ))}
            </div>
            {issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                本条记录尚无结构化问题（数据库无行且 <code className="rounded bg-muted px-1">report_json.issues</code>{" "}
                为空）。请重新运行体检（脚本 ≥2.1.0）并确认已执行{" "}
                <code className="rounded bg-muted px-1">006_geo_audit_issues.sql</code> 迁移。
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3 text-sm">
                {issues.slice(0, 12).map((i) => (
                  <li key={i.id} className="flex flex-wrap gap-2 border-b border-border/60 pb-2 last:border-0">
                    <span className="font-mono text-xs text-muted-foreground">{i.code}</span>
                    <span className="text-muted-foreground">[{i.severity}]</span>
                    <span>{i.title}</span>
                  </li>
                ))}
              </ul>
            )}
            {issues.length > 12 ? (
              <Link href="/admin/geo-audit/issues" className="text-sm text-primary underline">
                查看全部问题
              </Link>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
