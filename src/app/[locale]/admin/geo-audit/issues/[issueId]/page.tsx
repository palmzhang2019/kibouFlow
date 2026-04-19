import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { IssueDecisionForm } from "@/components/admin/IssueDecisionForm";
import { IssueRemediationPanel } from "@/components/admin/IssueRemediationPanel";
import { getGeoAuditIssueById } from "@/lib/geo-audit-issues";
import { listGeoAuditDecisionsByIssueId } from "@/lib/geo-audit-decisions";
import { GEO_AUDIT_DECISION_CHOICE_LABEL_ZH } from "@/lib/geo-audit-decision-schema";
import { canPersistGeoAuditRuns } from "@/lib/geo-audit-runs";

export const dynamic = "force-dynamic";

export default async function GeoAuditIssueDetailPage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId } = await params;
  if (!canPersistGeoAuditRuns()) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">问题详情</h2>
        <p className="text-sm text-muted-foreground">需要数据库连接。</p>
        <Link href="/admin/geo-audit/issues" className="text-sm text-primary underline">
          返回问题列表
        </Link>
      </div>
    );
  }

  const issue = await getGeoAuditIssueById(issueId);
  if (!issue) notFound();

  const decisions = await listGeoAuditDecisionsByIssueId(issueId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">问题详情</h2>
        <Link href="/admin/geo-audit/issues" className="text-sm text-primary underline">
          返回列表
        </Link>
      </div>

      <IssueRemediationPanel issueCode={issue.code} />

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
              {JSON.stringify(issue.evidence, null, 2)}
            </pre>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">状态</dt>
          <dd>{issue.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">体检 run</dt>
          <dd>
            <Link href={`/admin/geo-audit/history/${issue.run_id}`} className="text-primary underline">
              {issue.run_id}
            </Link>
          </dd>
        </div>
      </dl>

      {decisions.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-medium">决策历史</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {decisions.map((d) => (
              <li key={d.id}>
                {new Date(d.created_at).toLocaleString("zh-CN")} —{" "}
                {GEO_AUDIT_DECISION_CHOICE_LABEL_ZH[d.choice] ?? d.choice}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <IssueDecisionForm issueId={issue.id} defaultChoice={decisions[0]?.choice ?? null} />
    </div>
  );
}
