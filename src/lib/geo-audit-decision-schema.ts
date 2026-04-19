/** 与 `geo_audit_decisions.choice` check 及 IssueDecisionForm 枚举一致 */

export type GeoAuditDecisionChoice =
  | "ignore"
  | "template_track"
  | "content_track"
  | "recheck_later";

export const GEO_AUDIT_DECISION_CHOICES: readonly GeoAuditDecisionChoice[] = [
  "ignore",
  "template_track",
  "content_track",
  "recheck_later",
] as const;

export const GEO_AUDIT_DECISION_CHOICE_LABEL_ZH: Record<GeoAuditDecisionChoice, string> = {
  ignore: "忽略（暂不处理）",
  template_track: "走模板/站点级治理",
  content_track: "走内容/页面级补强",
  recheck_later: "先记录，待复检再判",
};

export function isValidGeoAuditDecisionChoice(v: unknown): v is GeoAuditDecisionChoice {
  return typeof v === "string" && (GEO_AUDIT_DECISION_CHOICES as readonly string[]).includes(v);
}
