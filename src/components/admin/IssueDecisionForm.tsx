"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  GEO_AUDIT_DECISION_CHOICE_LABEL_ZH,
  type GeoAuditDecisionChoice,
} from "@/lib/geo-audit-decision-schema";

const CHOICES: { value: GeoAuditDecisionChoice; label: string }[] = [
  { value: "ignore", label: GEO_AUDIT_DECISION_CHOICE_LABEL_ZH.ignore },
  { value: "template_track", label: GEO_AUDIT_DECISION_CHOICE_LABEL_ZH.template_track },
  { value: "content_track", label: GEO_AUDIT_DECISION_CHOICE_LABEL_ZH.content_track },
  { value: "recheck_later", label: GEO_AUDIT_DECISION_CHOICE_LABEL_ZH.recheck_later },
];

export function IssueDecisionForm({
  issueId,
  defaultChoice,
}: {
  issueId: string;
  /** 最近一次决策；用于打开表单时预填，提交会追加新行而非覆盖 */
  defaultChoice?: GeoAuditDecisionChoice | null;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<GeoAuditDecisionChoice>(defaultChoice ?? "recheck_later");

  useEffect(() => {
    setChoice(defaultChoice ?? "recheck_later");
  }, [defaultChoice, issueId]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/geo-audit/decisions", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueId, choice }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? `失败（${res.status}）`);
        return;
      }
      router.refresh();
      setMsg("已保存决策记录。");
    } catch {
      setMsg("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
      <h4 className="text-sm font-medium">记录决策（枚举）</h4>
      <p className="text-xs text-muted-foreground">
        每次提交会<strong className="font-medium text-foreground">追加</strong>一条记录；若要「改主意」，选好选项后再次提交即可。
      </p>
      <div className="space-y-2">
        {CHOICES.map((c) => (
          <label key={c.value} className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="radio"
              name="decision"
              value={c.value}
              checked={choice === c.value}
              onChange={() => setChoice(c.value)}
              className="mt-1"
            />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {loading ? "提交中…" : "提交决策"}
      </button>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </form>
  );
}
