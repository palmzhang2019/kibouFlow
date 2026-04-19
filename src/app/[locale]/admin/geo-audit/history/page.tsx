import { Link } from "@/i18n/navigation";
import { canPersistGeoAuditRuns, listGeoAuditRuns } from "@/lib/geo-audit-runs";
import { summaryFromMarkdown } from "@/lib/geo-audit-scores";
import { getMissingDatabaseEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

function scoreCell(value: number | null) {
  return value == null ? "—" : String(value);
}

export default async function GeoAuditHistoryPage() {
  if (!canPersistGeoAuditRuns()) {
    const missing = getMissingDatabaseEnv();
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">无法连接 Supabase 读写体检历史</p>
        <p className="mt-2">
          服务端通过 <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> 连接 PostgreSQL。当前缺少或未加载：
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {missing.map((name) => (
            <li key={name}>
              <code className="rounded bg-amber-100 px-1">{name}</code>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-muted-foreground">
          请把连接串写入 <code className="rounded bg-amber-100 px-1">.env.local</code> 后重启{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev</code> /{" "}
          <code className="rounded bg-amber-100 px-1">npm run start</code>，并确认已经执行
          <code className="mx-1 rounded bg-amber-100 px-1">supabase/migrations/</code>
          下的全部 SQL。
        </p>
      </div>
    );
  }

  const rows = await listGeoAuditRuns(50);

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">历史记录</h2>
        <p className="text-sm text-muted-foreground">暂无记录。请先在“运行体检”页执行一次 GEO 体检。</p>
        <Link href="/admin/geo-audit/run" className="text-sm font-medium text-primary underline">
          去运行体检
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">历史记录</h2>
        <Link href="/admin/geo-audit" className="text-sm text-primary underline">
          返回总览
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 py-2 font-medium">时间</th>
              <th className="px-3 py-2 font-medium">状态</th>
              <th className="px-3 py-2 font-medium">总分</th>
              <th className="px-3 py-2 font-medium">五项</th>
              <th className="px-3 py-2 font-medium">LLM</th>
              <th className="px-3 py-2 font-medium">问题数（未关闭）</th>
              <th className="px-3 py-2 font-medium">摘要</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 align-top">
                  <Link
                    href={`/admin/geo-audit/history/${row.id}`}
                    className="text-primary underline decoration-primary/40 underline-offset-2"
                  >
                    {new Date(row.started_at).toLocaleString("zh-CN")}
                  </Link>
                </td>
                <td className="px-3 py-2 align-top">{row.status}</td>
                <td className="px-3 py-2 align-top">{scoreCell(row.overall_score)}</td>
                <td className="px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  R {scoreCell(row.retrievability_score)} / C {scoreCell(row.chunkability_score)} / E{" "}
                  {scoreCell(row.extractability_score)} / T {scoreCell(row.trust_score)} / A{" "}
                  {scoreCell(row.attributability_score)}
                </td>
                <td className="px-3 py-2 align-top">{row.used_llm ? "是" : "否"}</td>
                <td className="px-3 py-2 align-top font-mono text-xs">{row.issue_open_count}</td>
                <td className="max-w-xs px-3 py-2 align-top text-muted-foreground">
                  {summaryFromMarkdown(row.report_markdown ?? "", 120)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
