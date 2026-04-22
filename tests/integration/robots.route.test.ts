import robots from "@/app/robots";

describe("robots.txt generator", () => {
  it("allows crawlers and lists sitemap", () => {
    const r = robots();
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
    expect(r.rules).toBeDefined();

    const rules = r.rules ?? [];
    const gpt = rules.find(
      (x) => "userAgent" in x && x.userAgent === "GPTBot",
    ) as { userAgent: string; allow?: string; disallow?: string } | undefined;
    expect(gpt?.allow).toBe("/");

    const bytespider = rules.find(
      (x) => "userAgent" in x && x.userAgent === "Bytespider",
    ) as { userAgent: string; allow?: string; disallow?: string } | undefined;
    expect(bytespider?.disallow).toBe("/");
  });
});
