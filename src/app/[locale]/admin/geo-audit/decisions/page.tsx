import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { canPersistGeoAuditDecisions, listRecentGeoAuditDecisionsWithIssues } from "@/lib/geo-audit-decisions";
import {
  GEO_AUDIT_DECISION_CHOICE_LABEL_ZH,
  type GeoAuditDecisionChoice,
} from "@/lib/geo-audit-decision-schema";
import { remediationForIssueCode } from "@/lib/geo-audit-issue-remediation";
import { getMissingDatabaseEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 决策列固定约两行：优先在「/」处断行，其次在「（」前断行 */
function decisionLabelTwoLines(choice: GeoAuditDecisionChoice): ReactNode {
  const label = GEO_AUDIT_DECISION_CHOICE_LABEL_ZH[choice] ?? choice;
  const slash = label.indexOf("/");
  if (slash !== -1) {
    return (
      <>
        {label.slice(0, slash + 1)}
        <br />
        {label.slice(slash + 1)}
      </>
    );
  }
  const paren = label.indexOf("（");
  if (paren > 0) {
    return (
      <>
        {label.slice(0, paren)}
        <br />
        {label.slice(paren)}
      </>
    );
  }
  return label;
}

/** 表头与数据行共用同一套列宽，保证 head/body 及列间竖线对齐 */
const DECISION_TABLE_GRID =
  "grid min-w-[54rem] grid-cols-[11rem_7.5rem_14rem_minmax(16rem,32rem)_5.5rem] text-left text-sm";

/** 左侧列：右侧竖线；最右「处理」列不加 border-r，避免与表格外框重复 */
const CELL_L = "flex min-h-[2.75rem] items-center border-b border-r border-border px-3 py-2";
const CELL_R = "flex min-h-[2.75rem] items-center border-b border-border px-2 py-2";
const CELL_HEAD_L = `${CELL_L} bg-muted/50 font-medium`;
const CELL_HEAD_R = `${CELL_R} justify-center bg-muted/50 text-xs font-medium`;
const CELL_BODY_L = `${CELL_L} hover:bg-muted/10`;
const CELL_BODY_R = `${CELL_R} justify-center bg-muted/5 hover:bg-muted/15`;

export default async function GeoAuditDecisionsHubPage() {
  if (!canPersistGeoAuditDecisions()) {
    const missing = getMissingDatabaseEnv();
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">修复决策中心</h2>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">需要数据库以展示决策记录</p>
          <ul className="mt-2 list-inside list-disc">
            {missing.map((name) => (
              <li key={name}>
                <code className="rounded bg-amber-100 px-1">{name}</code>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/admin/geo-audit/issues" className="text-sm font-medium text-primary underline">
          前往问题中心
        </Link>
      </div>
    );
  }

  const rows = await listRecentGeoAuditDecisionsWithIssues(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">修复决策中心</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          下列记录在「问题详情」页提交后写入 <code className="rounded bg-muted px-1">geo_audit_decisions</code>，按时间倒序。
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/geo-audit/issues" className="text-primary underline">
          问题中心
        </Link>
        <Link href="/admin/geo-audit/history" className="text-primary underline">
          体检历史
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          尚无决策记录。请在{" "}
          <Link href="/admin/geo-audit/issues" className="font-medium text-primary underline">
            问题中心
          </Link>{" "}
          打开某条已落库问题，在详情页提交「记录决策」。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className={DECISION_TABLE_GRID}>
            <div className={`${CELL_HEAD_L} whitespace-nowrap`}>时间</div>
            <div className={`${CELL_HEAD_L} leading-snug`}>决策</div>
            <div className={`${CELL_HEAD_L}`}>问题代码</div>
            <div className={`${CELL_HEAD_L} min-w-0`}>
              <span className="block min-w-0 truncate">标题</span>
            </div>
            <div className={CELL_HEAD_R}>处理</div>

            {rows.map((r) => {
              const rem = remediationForIssueCode(r.issue_code);
              // 特殊问题代码跳转逻辑：不走通用的 fix/issues 路径
              let handleHref: string;
              if (r.issue_code === "SCORE_PRINCIPLE_BELOW_THRESHOLD") {
                // 跳转到本次体检的历史详情页，方便查看分数与根因
                handleHref = `/admin/geo-audit/history/${r.issue_run_id}`;
              } else if (r.issue_code === "CONTENT_TLDR_COVERAGE_ZERO") {
                // 跳转到本次体检的历史详情页，查看哪些 MDX 缺少 tldr
                handleHref = `/admin/geo-audit/history/${r.issue_run_id}`;
              } else if (rem) {
                handleHref = `/admin/geo-audit/fix/${rem.fileKey}`;
              } else {
                handleHref = `/admin/geo-audit/issues/${r.issue_id}`;
              }
              return (
                <Fragment key={r.id}>
                  <div className={`${CELL_BODY_L} whitespace-nowrap text-muted-foreground`}>
                    {new Date(r.created_at).toLocaleString("zh-CN")}
                  </div>
                  <div className={`${CELL_BODY_L} text-sm leading-snug`}>{decisionLabelTwoLines(r.choice)}</div>
                  <div className={`${CELL_BODY_L} min-w-0 font-mono text-xs`}>
                    <Link href={`/admin/geo-audit/issues/${r.issue_id}`} className="break-all text-primary underline">
                      {r.issue_code}
                    </Link>
                  </div>
                  <div className={`${CELL_BODY_L} min-w-0`}>
                    <div className="w-full min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:thin]">
                      {r.issue_title}
                    </div>
                  </div>
                  <div className={CELL_BODY_R}>
                    <Link
                      href={handleHref}
                      className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      title={
                        r.issue_code === "SCORE_PRINCIPLE_BELOW_THRESHOLD"
                          ? "查看体检历史详情（分数与根因）"
                          : r.issue_code === "CONTENT_TLDR_COVERAGE_ZERO"
                            ? "查看体检历史详情（MDX 覆盖）"
                            : rem
                              ? "打开对应源码文件编辑器"
                              : "暂无内置映射，前往问题详情"
                      }
                    >
                      处理
                    </Link>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
