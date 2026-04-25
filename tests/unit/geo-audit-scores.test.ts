import { describe, expect, it } from "vitest";
import {
  extractScoresFromAuditJson,
  mergeScoreColumnsWithReportJson,
  summaryFromMarkdown,
} from "@/lib/geo-audit-scores";

describe("extractScoresFromAuditJson", () => {
  it("returns all nulls for null input", () => {
    const result = extractScoresFromAuditJson(null);
    expect(result.overall_score).toBeNull();
    expect(result.retrievability_score).toBeNull();
    expect(result.chunkability_score).toBeNull();
    expect(result.extractability_score).toBeNull();
    expect(result.trust_score).toBeNull();
    expect(result.attributability_score).toBeNull();
  });

  it("extracts all five dimensions from scores object with Chinese keys", () => {
    const json = {
      scores: {
        可召回性: 80,
        可切块性: 70,
        可抽取性: 90,
        可信性: 85,
        可归因性: 75,
      },
    };
    const result = extractScoresFromAuditJson(json);
    expect(result.retrievability_score).toBe(80);
    expect(result.chunkability_score).toBe(70);
    expect(result.extractability_score).toBe(90);
    expect(result.trust_score).toBe(85);
    expect(result.attributability_score).toBe(75);
    expect(result.overall_score).toBe(80);
  });

  it("calculates overall_score as average of available dimensions", () => {
    const json = {
      scores: {
        可召回性: 60,
        可切块性: 80,
      },
    };
    const result = extractScoresFromAuditJson(json);
    expect(result.retrievability_score).toBe(60);
    expect(result.chunkability_score).toBe(80);
    expect(result.overall_score).toBe(70);
  });

  it("handles partial dimensions (missing some scores)", () => {
    const json = {
      scores: {
        可召回性: 100,
        可信性: 100,
      },
    };
    const result = extractScoresFromAuditJson(json);
    expect(result.retrievability_score).toBe(100);
    expect(result.trust_score).toBe(100);
    expect(result.overall_score).toBe(100);
  });

  it("skips non-finite values in scores", () => {
    const json = {
      scores: {
        可召回性: 80,
        可切块性: Infinity,
        可抽取性: NaN,
        可信性: 70,
        可归因性: 60,
      },
    };
    const result = extractScoresFromAuditJson(json);
    expect(result.retrievability_score).toBe(80);
    expect(result.chunkability_score).toBeNull();
    expect(result.extractability_score).toBeNull();
    expect(result.trust_score).toBe(70);
    expect(result.attributability_score).toBe(60);
    expect(result.overall_score).toBe(70);
  });
});

describe("mergeScoreColumnsWithReportJson", () => {
  it("prefers non-null DB value over JSON value", () => {
    const db = { overall_score: 85, retrievability_score: null, chunkability_score: null, extractability_score: null, trust_score: null, attributability_score: null };
    const report_json = { scores: { 可召回性: 70 } };
    const result = mergeScoreColumnsWithReportJson(db, report_json);
    expect(result.overall_score).toBe(85);
    expect(result.retrievability_score).toBe(70);
  });

  it("falls back to JSON when DB value is null", () => {
    const db = { overall_score: null, retrievability_score: null, chunkability_score: null, extractability_score: null, trust_score: null, attributability_score: null };
    const report_json = { scores: { 可召回性: 75, 可切块性: 65 } };
    const result = mergeScoreColumnsWithReportJson(db, report_json);
    expect(result.retrievability_score).toBe(75);
    expect(result.chunkability_score).toBe(65);
  });

  it("returns DB values when JSON is null", () => {
    const db = { overall_score: 90, retrievability_score: 88, chunkability_score: 92, extractability_score: 85, trust_score: 87, attributability_score: 83 };
    const result = mergeScoreColumnsWithReportJson(db, null);
    expect(result).toEqual(db);
  });

  it("returns DB values as-is when report_json is undefined", () => {
    const db = { overall_score: 90, retrievability_score: 88, chunkability_score: null, extractability_score: null, trust_score: null, attributability_score: null };
    const result = mergeScoreColumnsWithReportJson(db, undefined);
    expect(result.overall_score).toBe(90);
    expect(result.retrievability_score).toBe(88);
  });
});

describe("summaryFromMarkdown", () => {
  it("returns empty string for null", () => {
    expect(summaryFromMarkdown(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(summaryFromMarkdown(undefined)).toBe("");
  });

  it("returns short text unchanged", () => {
    const short = "This is a short summary.";
    expect(summaryFromMarkdown(short)).toBe(short);
  });

  it("truncates long text and appends ellipsis", () => {
    const long = "a".repeat(200);
    const result = summaryFromMarkdown(long);
    expect(result.length).toBe(161);
    expect(result.startsWith("a".repeat(160))).toBe(true);
    expect(result.endsWith("…")).toBe(true);
  });

  it("normalizes whitespace to single line", () => {
    const multi = "Line one   \n\n  Line two  ";
    const result = summaryFromMarkdown(multi);
    expect(result).toBe("Line one Line two");
  });

  it("respects custom maxLen", () => {
    const text = "a".repeat(100);
    const result = summaryFromMarkdown(text, 50);
    expect(result.length).toBe(51);
    expect(result.startsWith("a".repeat(50))).toBe(true);
    expect(result.endsWith("…")).toBe(true);
  });

  it("returns exactly maxLen when text equals maxLen", () => {
    const text = "a".repeat(160);
    expect(summaryFromMarkdown(text, 160)).toBe(text);
  });
});
