import { describe, expect, it } from "vitest";
import { remediationForIssueCode } from "@/lib/geo-audit-issue-remediation";
import { resolveAdminRepoFilePath } from "@/lib/admin-repo-files";

describe("geo audit issue remediation", () => {
  it("maps TEMPLATE_DEFINED_TERM_MISSING to the DefinedTerm editor target", () => {
    const remediation = remediationForIssueCode("TEMPLATE_DEFINED_TERM_MISSING");
    expect(remediation).toBeTruthy();
    expect(remediation?.fileKey).toBe("defined-term-jsonld");
    expect(resolveAdminRepoFilePath(remediation!.fileKey)).toMatch(/src[\\/]+components[\\/]+seo[\\/]+DefinedTermJsonLd\.tsx$/);
  });
});
