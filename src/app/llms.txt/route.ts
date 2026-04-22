import { NextResponse } from "next/server";
import {
  getAllArticles,
  getArticlesByContentType,
  type ArticleMeta,
  type ContentType,
} from "@/lib/content";
import { getSiteUrl } from "@/lib/seo/site-url";

export const dynamic = "force-static";
export const revalidate = 3600;

const SITE_URL = getSiteUrl();

const LOCALES = [
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
] as const;

const SECTIONS: { heading: string; contentType: ContentType }[] = [
  { heading: "Cluster Entries", contentType: "cluster" },
  { heading: "Judgment Frameworks", contentType: "framework" },
  { heading: "Concepts", contentType: "concept" },
  { heading: "FAQ", contentType: "faq" },
  { heading: "Cases", contentType: "case" },
];

function renderItem(a: ArticleMeta, locale: string): string {
  return `- [${a.title}](${SITE_URL}/${locale}${a.href}): ${a.description}`;
}

function renderLocale(locale: string, label: string): string[] {
  const lines: string[] = [];
  lines.push(`## ${label} (${locale})`, "");
  lines.push("### Primary");
  lines.push(`- [Home](${SITE_URL}/${locale})`);
  lines.push(`- [Guides](${SITE_URL}/${locale}/guides)`);
  lines.push(`- [FAQ](${SITE_URL}/${locale}/faq)`);
  lines.push("");

  for (const { heading, contentType } of SECTIONS) {
    const items = getArticlesByContentType(locale, contentType);
    if (items.length === 0) continue;
    lines.push(`### ${heading}`);
    for (const a of items) lines.push(renderItem(a, locale));
    lines.push("");
  }

  const known = new Set(SECTIONS.map((s) => s.contentType));
  const rest = getAllArticles(locale).filter(
    (a) => !a.contentType || !known.has(a.contentType),
  );
  if (rest.length > 0) {
    lines.push("### Other Articles");
    for (const a of rest) lines.push(renderItem(a, locale));
    lines.push("");
  }

  return lines;
}

export async function GET() {
  const body = [
    "# kibouFlow",
    "",
    "> 面向“在日本发展”方向不清的人：先整理希望、再判断路径、再导向下一步。中日双语。",
    "",
    `- Site: ${SITE_URL}`,
    `- Full text: ${SITE_URL}/llms-full.txt`,
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
    ...LOCALES.flatMap(({ code, label }) => renderLocale(code, label)),
  ].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
