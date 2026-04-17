import { describe, expect, it } from "vitest";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";

describe("buildBreadcrumbItems", () => {
  it("prefixes site URL onto paths", () => {
    const items = buildBreadcrumbItems(
      [
        { path: "/zh", name: "首页" },
        { path: "/zh/guides", name: "路径判断" },
      ],
      "https://example.com",
    );
    expect(items).toEqual([
      { name: "首页", item: "https://example.com/zh" },
      { name: "路径判断", item: "https://example.com/zh/guides" },
    ]);
  });
});
