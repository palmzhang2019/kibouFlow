import { assertRole, buildPublishResourceKey, getActorFromHeaders } from "@/lib/geo-ops";

describe("geo ops", () => {
  it("parses actor from headers", () => {
    const headers = new Headers({
      "x-admin-user": "u1",
      "x-admin-role": "reviewer",
    });
    expect(getActorFromHeaders(headers)).toEqual({ userId: "u1", role: "reviewer" });
  });

  it("checks role permission", () => {
    expect(assertRole("admin", ["admin"])).toBe(true);
    expect(assertRole("editor", ["admin"])).toBe(false);
  });

  it("builds publish resource key", () => {
    expect(buildPublishResourceKey("rules", "zh")).toBe("rules:zh:-");
    expect(buildPublishResourceKey("page", "zh", "/zh/guides")).toBe("page:zh:/zh/guides");
  });
});
