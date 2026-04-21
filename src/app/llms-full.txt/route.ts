import { NextResponse } from "next/server";
import { getAllArticles, getArticleMarkdown } from "@/lib/content";
import { getSiteUrl } from "@/lib/seo/site-url";

export const dynamic = "force-static";
export const revalidate = 3600;

const SITE_URL = getSiteUrl();

const LOCALES = ["zh", "ja"] as const;

export async function GET() {
  const chunks: string[] = [];

  chunks.push(
    [
      "# GEO (kibouFlow) — Full Content",
      "",
      "> 本文件是 kibouFlow 全站 Markdown 正文拼接，供生成式引擎一次性摄入。",
      `> 索引见 ${SITE_URL}/llms.txt，网站地图见 ${SITE_URL}/sitemap.xml。`,
      "",
    ].join("\n"),
  );

  for (const locale of LOCALES) {
    chunks.push(`\n\n## Locale: ${locale}\n`);
    const articles = getAllArticles(locale);
    for (const a of articles) {
      const md = getArticleMarkdown(locale, a.category, a.slug, SITE_URL);
      if (!md) continue;
      chunks.push(md);
      chunks.push("\n\n---\n\n");
    }
  }

  return new NextResponse(chunks.join(""), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
