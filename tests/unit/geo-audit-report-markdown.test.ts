import { describe, expect, it } from "vitest";
import {
  stripGeoAuditJsonAppendix,
  splitGeoAuditMarkdownBodyAndJsonTail,
  GEO_AUDIT_JSON_APPENDIX_SEP,
} from "@/lib/geo-audit-report-markdown";

describe("stripGeoAuditJsonAppendix", () => {
  it("returns markdown unchanged when no separator present", () => {
    const md = "# Report\n\nSome content here.";
    expect(stripGeoAuditJsonAppendix(md)).toBe(md);
  });

  it("strips JSON appendix with standard separator", () => {
    const body = "# Report\n\nContent here.";
    const json = '{"scores":{"可召回性":80}}';
    const md = `${body}\n${GEO_AUDIT_JSON_APPENDIX_SEP}${json}`;
    expect(stripGeoAuditJsonAppendix(md)).toBe(body);
  });

  it("strips JSON appendix with alternate separator (no leading newline)", () => {
    const body = "# Report\n\nContent here.";
    const json = '{"scores":{"可召回性":80}}';
    const md = `${body}\n--- JSON ---\n${json}`;
    expect(stripGeoAuditJsonAppendix(md)).toBe(body);
  });

  it("normalizes CRLF to LF before processing", () => {
    const body = "# Report\r\n\r\nContent here.";
    const json = '{"scores":{}}';
    const md = `${body}\r\n${GEO_AUDIT_JSON_APPENDIX_SEP}\r\n${json}`;
    const result = stripGeoAuditJsonAppendix(md);
    expect(result).not.toContain("\r");
  });

  it("returns input unchanged when separator not found", () => {
    const md = "Some text\n--- NOT JSON ---\nmore text";
    expect(stripGeoAuditJsonAppendix(md)).toBe(md);
  });

  it("uses lastIndexOf to find the rightmost separator", () => {
    const body = "# Report\n";
    const json = '{"x":1}';
    const md = `${body}\n${GEO_AUDIT_JSON_APPENDIX_SEP}${json}\n${GEO_AUDIT_JSON_APPENDIX_SEP}{"y":2}`;
    expect(stripGeoAuditJsonAppendix(md)).toBe(`${body}\n${GEO_AUDIT_JSON_APPENDIX_SEP}${json}`);
  });
});

describe("splitGeoAuditMarkdownBodyAndJsonTail", () => {
  it("returns null when no separator present", () => {
    const md = "# Report\n\nSome content.";
    expect(splitGeoAuditMarkdownBodyAndJsonTail(md)).toBeNull();
  });

  it("splits correctly with standard separator", () => {
    const body = "# Report\n\nContent";
    const json = '{"scores":{"可召回性":80}}';
    const md = `${body}\n${GEO_AUDIT_JSON_APPENDIX_SEP}${json}`;
    const result = splitGeoAuditMarkdownBodyAndJsonTail(md);
    expect(result).not.toBeNull();
    expect(result!.body).toBe(body);
    expect(result!.jsonPart).toBe(json);
    expect(result!.separator).toBe(GEO_AUDIT_JSON_APPENDIX_SEP);
  });

  it("returns first occurrence of separator when both variants present", () => {
    // The first separator in the string determines the split
    // GEO_AUDIT_JSON_APPENDIX_SEP = "\n--- JSON ---\n" (with leading \n)
    // appears first (after "# Report\n\n"), then alternate after "Content\n"
    const body = "# Report\n\nContent\n";
    const json = '{"scores":{}}';
    const sep = "--- JSON ---\n";
    const md = `${body}${sep}${json}`;
    const result = splitGeoAuditMarkdownBodyAndJsonTail(md);
    expect(result).not.toBeNull();
    // First occurrence is the embedded "\n--- JSON ---\n" in body, not the standalone sep
    expect(result!.separator).toBe(GEO_AUDIT_JSON_APPENDIX_SEP);
    expect(result!.jsonPart).toBe(json);
  });

  it("normalizes CRLF to LF", () => {
    const body = "# Report\r\n\r\nContent";
    const json = '{"x":1}';
    const md = `${body}\r\n${GEO_AUDIT_JSON_APPENDIX_SEP}${json}`;
    const result = splitGeoAuditMarkdownBodyAndJsonTail(md);
    expect(result).not.toBeNull();
    expect(result!.body).not.toContain("\r");
  });

  it("returns null for empty string", () => {
    expect(splitGeoAuditMarkdownBodyAndJsonTail("")).toBeNull();
  });

  it("body is trimmed end after split", () => {
    const body = "# Report   \n\n  Content  ";
    const json = '{"x":1}';
    const md = `${body}\n${GEO_AUDIT_JSON_APPENDIX_SEP}${json}`;
    const result = splitGeoAuditMarkdownBodyAndJsonTail(md);
    expect(result!.body).toBe("# Report   \n\n  Content");
  });
});
