import type { PrinciplesAuditJson } from "@/lib/geo-principles-audit-runner";

function pickScore(scores: Record<string, number> | undefined, needle: string): number | null {
  if (!scores) return null;
  const key = Object.keys(scores).find((k) => k.includes(needle));
  if (!key) return null;
  const v = scores[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function extractScoresFromAuditJson(json: PrinciplesAuditJson | null): {
  overall_score: number | null;
  retrievability_score: number | null;
  chunkability_score: number | null;
  extractability_score: number | null;
  trust_score: number | null;
  attributability_score: number | null;
} {
  const scores = json?.scores as Record<string, number> | undefined;
  const retrievability_score = pickScore(scores, "可召回");
  const chunkability_score = pickScore(scores, "可切块");
  const extractability_score = pickScore(scores, "可抽取");
  const trust_score = pickScore(scores, "可信");
  const attributability_score = pickScore(scores, "可归因");
  const parts = [
    retrievability_score,
    chunkability_score,
    extractability_score,
    trust_score,
    attributability_score,
  ].filter((x): x is number => x !== null);
  const overall_score =
    parts.length === 0 ? null : Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;
  return {
    overall_score,
    retrievability_score,
    chunkability_score,
    extractability_score,
    trust_score,
    attributability_score,
  };
}

export function summaryFromMarkdown(md: string | null | undefined, maxLen = 160): string {
  if (!md) return "";
  const oneLine = md.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen)}…`;
}
