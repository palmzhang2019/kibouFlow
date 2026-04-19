import { Link } from "@/i18n/navigation";
import { remediationForIssueCode } from "@/lib/geo-audit-issue-remediation";
import { adminRepoFileLabel } from "@/lib/admin-repo-files";

export function IssueRemediationPanel({ issueCode }: { issueCode: string }) {
  const r = remediationForIssueCode(issueCode);
  if (!r) {
    return (
      <section className="rounded-lg border border-border bg-muted/10 p-4 text-sm text-muted-foreground">
        <h3 className="mb-1 font-medium text-foreground">后台处理</h3>
        <p>该问题代码暂无内置「打开对应源码文件」入口；请在仓库内搜索相关实现或扩展{" "}
          <code className="rounded bg-muted px-1">geo-audit-issue-remediation.ts</code> 白名单映射。</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-muted/10 p-4 text-sm">
      <h3 className="mb-2 font-medium">后台处理</h3>
      <p className="text-muted-foreground">{r.hint}</p>
      <div className="mt-3">
        <Link
          href={`/admin/geo-audit/fix/${r.fileKey}`}
          className="inline-flex rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          打开 {adminRepoFileLabel(r.fileKey)}
        </Link>
      </div>
    </section>
  );
}
