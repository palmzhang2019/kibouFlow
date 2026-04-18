import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { GeoAuditMarkdown } from "@/components/admin/GeoAuditMarkdown";
import { getGeoAuditRunById } from "@/lib/geo-audit-runs";

export const dynamic = "force-dynamic";

export default async function GeoAuditHistoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const row = await getGeoAuditRunById(id);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">报告详情</h2>
        <Link href="/admin/geo-audit/history" className="text-sm text-primary underline">
          返回列表
        </Link>
      </div>

      <dl className="grid gap-2 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">创建时间</dt>
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
          <dd className="break-all font-mono text-xs">{row.target_path ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">脚本版本</dt>
          <dd>{row.script_version ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">调用 LLM</dt>
          <dd>
            {row.used_llm ? `是（${row.llm_model ?? "未知模型"}）` : "否"}
          </dd>
        </div>
      </dl>

      {row.error_message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          <strong>错误信息：</strong>
          <pre className="mt-1 whitespace-pre-wrap font-sans">{row.error_message}</pre>
        </div>
      ) : null}

      <section>
        <h3 className="mb-3 text-sm font-medium">报告（渲染）</h3>
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
