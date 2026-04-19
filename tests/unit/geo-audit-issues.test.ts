import { describe, expect, it } from "vitest";
import { normalizeIssueInputs } from "@/lib/geo-audit-issues";

describe("normalizeIssueInputs", () => {
  it("filters invalid entries and keeps valid issues", () => {
    const out = normalizeIssueInputs([
      null,
      { code: "", title: "x", severity: "low", layer: "site" },
      { code: "OK", title: "  标题  ", severity: "high", layer: "template", evidence: { a: 1 } },
      { code: "BAD_SEV", title: "t", severity: "nope", layer: "site" },
      { code: "BAD_LAYER", title: "t", severity: "low", layer: "nope" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.code).toBe("OK");
    expect(out[0]?.title).toBe("标题");
    expect(out[0]?.severity).toBe("high");
    expect(out[0]?.evidence).toEqual({ a: 1 });
  });
});
