import { GET as getLlms } from "@/app/llms.txt/route";
import { GET as getLlmsFull } from "@/app/llms-full.txt/route";

describe("/llms.txt", () => {
  it("returns plaintext index with known cluster entries", async () => {
    const res = await getLlms();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);

    const body = await res.text();
    expect(body).toContain("# GEO");
    expect(body).toContain("/zh/guides/paths/job-prep-cluster-entry");
    expect(body).toContain("/ja/guides/paths/job-prep-cluster-entry");
  });
});

describe("/llms-full.txt", () => {
  it("returns plaintext full corpus with zh and ja segments", async () => {
    const res = await getLlmsFull();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);

    const body = await res.text();
    expect(body).toContain("## Locale: zh");
    expect(body).toContain("## Locale: ja");
    expect(body).toContain("日语学习路径 FAQ");
    expect(body).toContain("关键不是证书等级");
    expect(body).toContain("日本語学習パス FAQ");
  });
});
