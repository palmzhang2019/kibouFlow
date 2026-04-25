import { describe, expect, it } from "vitest";
import {
  parsePrinciplesAuditJsonFromMarkdown,
  coalesceAuditJsonForPersist,
} from "@/lib/geo-principles-audit-runner";

const SEP = "\n--- JSON ---\n";

describe("parsePrinciplesAuditJsonFromMarkdown", () => {
  it("returns null for null", () => {
    expect(parsePrinciplesAuditJsonFromMarkdown(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parsePrinciplesAuditJsonFromMarkdown(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePrinciplesAuditJsonFromMarkdown("")).toBeNull();
  });

  it("returns null when no JSON separator present", () => {
    const md = "# GEO Audit Report\n\nSome content without JSON.";
    expect(parsePrinciplesAuditJsonFromMarkdown(md)).toBeNull();
  });

  it("parses valid JSON after separator", () => {
    const json = JSON.stringify({
      scores: { 可召回性: 80 },
      used_llm: true,
      llm_model: "gpt-4",
    });
    const md = "# Report\n\nContent here." + SEP + json;
    const result = parsePrinciplesAuditJsonFromMarkdown(md);
    expect(result).not.toBeNull();
    expect(result!.scores).toEqual({ 可召回性: 80 });
    expect(result!.used_llm).toBe(true);
    expect(result!.llm_model).toBe("gpt-4");
  });

  it("extracts JSON even with surrounding whitespace", () => {
    const json = JSON.stringify({ scores: { 可信性: 90 }, issues: [] });
    const md = "# Report" + SEP + "  " + json + "  ";
    const result = parsePrinciplesAuditJsonFromMarkdown(md);
    expect(result).not.toBeNull();
    expect(result!.scores).toEqual({ 可信性: 90 });
  });

  it("recovers partial JSON by finding first { and last }", () => {
    const md = "# Report" + SEP + '{"scores":{"可抽取性":85}}\n{"extra":"trailing';
    const result = parsePrinciplesAuditJsonFromMarkdown(md);
    expect(result).not.toBeNull();
    expect(result!.scores).toEqual({ 可抽取性: 85 });
  });

  it("returns null when JSON is completely unparseable", () => {
    const md = "# Report" + SEP + "not json at all {";
    expect(parsePrinciplesAuditJsonFromMarkdown(md)).toBeNull();
  });
});

describe("coalesceAuditJsonForPersist", () => {
  it("returns null when both inputs are null", () => {
    expect(coalesceAuditJsonForPersist(null, "")).toBeNull();
    expect(coalesceAuditJsonForPersist(null, "# Report")).toBeNull();
  });

  it("returns fromStdout when markdown has no JSON", () => {
    const stdout = { scores: { 可召回性: 80 }, used_llm: true };
    const result = coalesceAuditJsonForPersist(stdout, "# Report with no JSON section");
    expect(result).toEqual(stdout);
  });

  it("returns fromMd when stdout is null", () => {
    const md = "# Report" + SEP + JSON.stringify({ scores: { 可信性: 85 } });
    const result = coalesceAuditJsonForPersist(null, md);
    expect(result!.scores).toEqual({ 可信性: 85 });
  });

  it("merges stdout and markdown JSON with stdout taking precedence for top-level fields", () => {
    const stdout = {
      scores: { 可召回性: 80 },
      used_llm: true,
      llm_model: "gpt-4",
    };
    const md = "# Report" + SEP + JSON.stringify({
      scores: { 可召回性: 70, 可切块性: 90 },
      used_llm: false,
      llm_model: "claude",
      script_version: "1.0",
    });
    const result = coalesceAuditJsonForPersist(stdout, md);
    expect(result!.used_llm).toBe(true);
    expect(result!.llm_model).toBe("gpt-4");
    expect(result!.script_version).toBe("1.0");
  });

  it("merges issues by code with evidence combined", () => {
    const stdout = {
      issues: [
        { code: "GEO_001", title: "Issue 1", severity: "high", layer: "site", evidence: { a: 1 } },
        { code: "GEO_002", title: "Issue 2", severity: "low", layer: "template", evidence: { b: 2 } },
      ],
    };
    const md = "# Report" + SEP + JSON.stringify({
      issues: [
        { code: "GEO_001", title: "Issue 1 MD", severity: "medium", layer: "site", evidence: { c: 3 } },
        { code: "GEO_003", title: "Issue 3 only in MD", severity: "low", layer: "content", evidence: {} },
      ],
    });
    const result = coalesceAuditJsonForPersist(stdout, md);
    expect(result!.issues).toHaveLength(3);
    const geo001 = result!.issues!.find((i) => i.code === "GEO_001");
    expect(geo001!.title).toBe("Issue 1");
    expect(geo001!.evidence).toEqual({ c: 3, a: 1 });
    const geo002 = result!.issues!.find((i) => i.code === "GEO_002");
    expect(geo002).not.toBeUndefined();
    const geo003 = result!.issues!.find((i) => i.code === "GEO_003");
    expect(geo003!.title).toBe("Issue 3 only in MD");
  });

  it("returns undefined for issues when both lists are empty", () => {
    const stdout = { issues: [] };
    const md = "# Report" + SEP + JSON.stringify({ issues: [] });
    const result = coalesceAuditJsonForPersist(stdout, md);
    expect(result!.issues).toBeUndefined();
  });
});
