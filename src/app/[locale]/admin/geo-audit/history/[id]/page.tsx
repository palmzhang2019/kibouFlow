import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { GeoAuditMarkdown } from "@/components/admin/GeoAuditMarkdown";
import {
  getGeoAuditRunById,
  mergeGeoAuditRunMetaFromReportJson,
  resolveGeoAuditReportPayload,
} from "@/lib/geo-audit-runs";
import { mergeScoreColumnsWithReportJson } from "@/lib/geo-audit-scores";
import { listGeoAuditIssuesByRunId, normalizeIssueInputs, type GeoAuditIssueInput } from "@/lib/geo-audit-issues";

export const dynamic = "force-dynamic";

function scoreCell(value: number | null) {
  return value == null ? "—" : String(value);
}

export default async function GeoAuditHistoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const row = await getGeoAuditRunById(id);
  if (!row) notFound();

  const meta = mergeGeoAuditRunMetaFromReportJson(row);
  const reportPayload = resolveGeoAuditReportPayload(row);

  const scores = mergeScoreColumnsWithReportJson(
    {
      overall_score: row.overall_score,
      retrievability_score: row.retrievability_score,
      chunkability_score: row.chunkability_score,
      extractability_score: row.extractability_score,
      trust_score: row.trust_score,
      attributability_score: row.attributability_score,
    },
    reportPayload,
  );

  const dbIssues = await listGeoAuditIssuesByRunId(id);
  let fallbackIssues: GeoAuditIssueInput[] = [];
  if (dbIssues.length === 0 && reportPayload) {
    fallbackIssues = normalizeIssueInputs(reportPayload.issues);
  }

  const issueRows =
    dbIssues.length > 0
      ? dbIssues.map((issue) => ({
          key: issue.id,
          severity: issue.severity,
          layer: issue.layer,
          code: issue.code,
          title: issue.title,
        }))
      : fallbackIssues.map((issue, index) => ({
          key: `json-${index}`,
          severity: issue.severity,
          layer: issue.layer,
          code: issue.code,
          title: issue.title,
        }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">报告详情</h2>
        <Link href="/admin/geo-audit/history" className="text-sm text-primary underline">
          返回列表
        </Link>
      </div>

      <section className="rounded-lg border border-border bg-muted/10 p-4">
        <h3 className="mb-3 text-sm font-medium">分数摘要</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">总分</dt>
            <dd className="font-semibold">{scoreCell(scores.overall_score)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">可召回</dt>
            <dd>{scoreCell(scores.retrievability_score)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">可切块</dt>
            <dd>{scoreCell(scores.chunkability_score)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">可抽取</dt>
            <dd>{scoreCell(scores.extractability_score)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">可信度</dt>
            <dd>{scoreCell(scores.trust_score)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">可归因</dt>
            <dd>{scoreCell(scores.attributability_score)}</dd>
          </div>
        </dl>
      </section>

      <dl className="grid gap-2 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">开始时间</dt>
          <dd>{new Date(row.started_at).toLocaleString("zh-CN")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">结束时间</dt>
          <dd>{row.finished_at ? new Date(row.finished_at).toLocaleString("zh-CN") : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">状态</dt>
          <dd>{row.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">检查目标</dt>
          <dd className="break-all font-mono text-xs">{meta.target_path ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">脚本版本</dt>
          <dd>{meta.script_version ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">调用 LLM</dt>
          <dd>{meta.used_llm ? `是（${meta.llm_model ?? "未知模型"}）` : "否"}</dd>
        </div>
      </dl>

      {row.error_message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          <strong>错误信息：</strong>
          <pre className="mt-1 whitespace-pre-wrap font-sans">{row.error_message}</pre>
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">结构化问题快照</h3>
          {dbIssues.length === 0 && fallbackIssues.length > 0 ? (
            <span className="text-xs text-amber-800 dark:text-amber-200">
              当前展示的数据来自报告内嵌 JSON，尚未写入问题表。
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">这里仅作为报告附带快照展示，不再继续扩展成独立的问题流转入口。</p>
        {issueRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">本条记录没有结构化问题数据。</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-3 py-2 font-medium">严重度</th>
                  <th className="px-3 py-2 font-medium">层级</th>
                  <th className="px-3 py-2 font-medium">代码</th>
                  <th className="px-3 py-2 font-medium">标题</th>
                </tr>
              </thead>
              <tbody>
                {issueRows.map((issue) => (
                  <tr key={issue.key} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 align-top">{issue.severity}</td>
                    <td className="px-3 py-2 align-top">{issue.layer}</td>
                    <td className="px-3 py-2 align-top font-mono text-xs">{issue.code}</td>
                    <td className="px-3 py-2 align-top">{issue.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium">报告预览</h3>
        <div className="rounded-lg border border-border bg-background p-4">
          <GeoAuditMarkdown markdown={row.report_markdown ?? ""} />
        </div>
      </section>

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium">原始 Markdown</summary>
        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap border-t border-border p-4 text-xs leading-relaxed">
          {row.report_markdown ?? ""}
        </pre>
      </details>
    </div>
  );
}
