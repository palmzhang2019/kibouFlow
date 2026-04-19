import { afterEach, describe, expect, it } from "vitest";
import { buildOrganizationSameAs } from "@/components/seo/OrganizationJsonLd";

describe("Organization JSON-LD sameAs", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ORGANIZATION_X_URL;
    delete process.env.NEXT_PUBLIC_ORGANIZATION_GITHUB_URL;
    delete process.env.NEXT_PUBLIC_ORGANIZATION_LINKEDIN_URL;
  });

  it("filters placeholder and root profile urls", () => {
    process.env.NEXT_PUBLIC_ORGANIZATION_X_URL = "https://x.com";
    process.env.NEXT_PUBLIC_ORGANIZATION_GITHUB_URL = "https://github.com";
    process.env.NEXT_PUBLIC_ORGANIZATION_LINKEDIN_URL = "https://www.linkedin.com";

    expect(buildOrganizationSameAs()).toEqual([]);
  });

  it("keeps only trusted public profile urls", () => {
    process.env.NEXT_PUBLIC_ORGANIZATION_X_URL = "https://x.com/kibouflow";
    process.env.NEXT_PUBLIC_ORGANIZATION_GITHUB_URL = "https://github.com/kibouflow";
    process.env.NEXT_PUBLIC_ORGANIZATION_LINKEDIN_URL =
      "https://www.linkedin.com/company/kibouflow";

    expect(buildOrganizationSameAs()).toEqual([
      "https://x.com/kibouflow",
      "https://github.com/kibouflow",
      "https://www.linkedin.com/company/kibouflow",
    ]);
  });
});
