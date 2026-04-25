import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  canPersistGeoAuditRuns,
  serializeReportJsonForDb,
  resolveGeoAuditReportPayload,
  mergeGeoAuditRunMetaFromReportJson,
} from "@/lib/geo-audit-runs";

const mockIsPgConfigured = vi.hoisted(() => vi.fn());
const mockParseFn = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  isPgConfigured: mockIsPgConfigured,
  getPg: vi.fn(),
}));

vi.mock("@/lib/geo-principles-audit-runner", () => ({
  parsePrinciplesAuditJsonFromMarkdown: mockParseFn,
}));

describe("canPersistGeoAuditRuns", () => {
  it("returns true when isPgConfigured returns true", () => {
    mockIsPgConfigured.mockReturnValue(true);
    expect(canPersistGeoAuditRuns()).toBe(true);
  });

  it("returns false when isPgConfigured returns false", () => {
    mockIsPgConfigured.mockReturnValue(false);
    expect(canPersistGeoAuditRuns()).toBe(false);
  });
});

describe("serializeReportJsonForDb", () => {
  it("returns null for null input", () => {
    expect(serializeReportJsonForDb(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(serializeReportJsonForDb(undefined)).toBeNull();
  });

  it("returns input unchanged when under size limit", () => {
    const json = { scores: { 可召回性: 80 }, used_llm: true };
    expect(serializeReportJsonForDb(json)).toEqual(json);
  });

  it("truncates and returns placeholder when over 900KB", () => {
    // Need JSON.stringify output > 900_000 bytes
    // {"data":"xxx...xxx"} with 1_000_000 x's = ~1_000_011 bytes
    const hugeArray = Array(1_000_000).fill("x").join("");
    const json = { data: hugeArray };
    const result = serializeReportJsonForDb(json);
    expect(result).toHaveProperty("truncated", true);
    expect(result).toHaveProperty("original_length");
    expect(result!.original_length).toBeGreaterThan(900_000);
  });

  it("returns truncated placeholder on JSON stringify error", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    const result = serializeReportJsonForDb(circular);
    expect(result).toHaveProperty("truncated", true);
    expect(result).toHaveProperty("error", "json_stringify_failed");
  });
});

describe("resolveGeoAuditReportPayload", () => {
  beforeEach(() => {
    mockParseFn.mockClear();
  });

  it("uses markdown JSON when available", () => {
    mockParseFn.mockReturnValue({
      scores: { 可召回性: 80 },
      used_llm: true,
    });

    const row = {
      id: "1",
      status: "success" as const,
      started_at: "2026-01-01",
      finished_at: null,
      overall_score: null,
      retrievability_score: null,
      chunkability_score: null,
      extractability_score: null,
      trust_score: null,
      attributability_score: null,
      report_markdown: "# Report\n\n--- JSON ---\n{}",
      report_json: null,
      error_message: null,
      used_llm: false,
      llm_model: null,
      script_version: null,
      target_path: null,
      created_by: null,
    };
    expect(resolveGeoAuditReportPayload(row)).toEqual({ scores: { 可召回性: 80 }, used_llm: true });
  });

  it("falls back to report_json when markdown returns null", () => {
    mockParseFn.mockReturnValue(null);

    const rj = { scores: { 可切块性: 70 } };
    const row = {
      id: "1",
      status: "success" as const,
      started_at: "2026-01-01",
      finished_at: null,
      overall_score: null,
      retrievability_score: null,
      chunkability_score: null,
      extractability_score: null,
      trust_score: null,
      attributability_score: null,
      report_markdown: null,
      report_json: rj,
      error_message: null,
      used_llm: false,
      llm_model: null,
      script_version: null,
      target_path: null,
      created_by: null,
    };
    expect(resolveGeoAuditReportPayload(row)).toEqual(rj);
  });

  it("returns null when both unavailable", () => {
    mockParseFn.mockReturnValue(null);

    const row = {
      id: "1",
      status: "success" as const,
      started_at: "2026-01-01",
      finished_at: null,
      overall_score: null,
      retrievability_score: null,
      chunkability_score: null,
      extractability_score: null,
      trust_score: null,
      attributability_score: null,
      report_markdown: null,
      report_json: null,
      error_message: null,
      used_llm: false,
      llm_model: null,
      script_version: null,
      target_path: null,
      created_by: null,
    };
    expect(resolveGeoAuditReportPayload(row)).toBeNull();
  });

  it("returns null for truncated report_json placeholder", () => {
    mockParseFn.mockReturnValue(null);

    const row = {
      id: "1",
      status: "success" as const,
      started_at: "2026-01-01",
      finished_at: null,
      overall_score: null,
      retrievability_score: null,
      chunkability_score: null,
      extractability_score: null,
      trust_score: null,
      attributability_score: null,
      report_markdown: null,
      report_json: { truncated: true, original_length: 2_000_000 },
      error_message: null,
      used_llm: false,
      llm_model: null,
      script_version: null,
      target_path: null,
      created_by: null,
    };
    expect(resolveGeoAuditReportPayload(row)).toBeNull();
  });
});

describe("mergeGeoAuditRunMetaFromReportJson", () => {
  beforeEach(() => {
    mockIsPgConfigured.mockClear();
    mockParseFn.mockClear();
  });

  it("uses JSON fields when row fields are empty", () => {
    mockParseFn.mockReturnValue({
      used_llm: true,
      llm_model: "gpt-4",
      script_version: "1.2.0",
      target_path: "/zh/articles/test",
    });

    const row = {
      id: "1",
      status: "success" as const,
      started_at: "2026-01-01",
      finished_at: null,
      overall_score: null,
      retrievability_score: null,
      chunkability_score: null,
      extractability_score: null,
      trust_score: null,
      attributability_score: null,
      report_markdown: "# Report",
      report_json: null,
      error_message: null,
      used_llm: false,
      llm_model: null,
      script_version: null,
      target_path: null,
      created_by: null,
    };
    const result = mergeGeoAuditRunMetaFromReportJson(row);
    expect(result.used_llm).toBe(true);
    expect(result.llm_model).toBe("gpt-4");
    expect(result.script_version).toBe("1.2.0");
    expect(result.target_path).toBe("/zh/articles/test");
  });

  it("prefers row fields over JSON when non-empty", () => {
    mockParseFn.mockReturnValue({
      used_llm: true,
      llm_model: "claude",
      script_version: "2.0",
      target_path: "/ja/articles/other",
    });

    const row = {
      id: "1",
      status: "success" as const,
      started_at: "2026-01-01",
      finished_at: null,
      overall_score: null,
      retrievability_score: null,
      chunkability_score: null,
      extractability_score: null,
      trust_score: null,
      attributability_score: null,
      report_markdown: "# Report",
      report_json: null,
      error_message: null,
      used_llm: false,
      llm_model: "gpt-4o",
      script_version: "1.5.0",
      target_path: "/zh/articles/mine",
      created_by: null,
    };
    const result = mergeGeoAuditRunMetaFromReportJson(row);
    expect(result.used_llm).toBe(true);
    expect(result.llm_model).toBe("gpt-4o");
    expect(result.script_version).toBe("1.5.0");
    expect(result.target_path).toBe("/zh/articles/mine");
  });

  it("treats empty string JSON fields as missing", () => {
    mockParseFn.mockReturnValue({
      used_llm: false,
      llm_model: "",
      script_version: "",
      target_path: "",
    });

    const row = {
      id: "1",
      status: "success" as const,
      started_at: "2026-01-01",
      finished_at: null,
      overall_score: null,
      retrievability_score: null,
      chunkability_score: null,
      extractability_score: null,
      trust_score: null,
      attributability_score: null,
      report_markdown: "# Report",
      report_json: null,
      error_message: null,
      used_llm: true,
      llm_model: "gpt-4",
      script_version: "1.0",
      target_path: "/zh",
      created_by: null,
    };
    const result = mergeGeoAuditRunMetaFromReportJson(row);
    expect(result.used_llm).toBe(false);
    expect(result.llm_model).toBe("gpt-4");
    expect(result.script_version).toBe("1.0");
    expect(result.target_path).toBe("/zh");
  });
});
