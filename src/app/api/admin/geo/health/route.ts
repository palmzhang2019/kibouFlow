import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      metrics: {
        metadataCompletenessRate: 0,
        jsonldCoverageRate: 0,
        extractionFailureCount: 0,
        noindexCount: 0,
        changeFrequency: 0,
      },
      highRiskPages: [],
    });
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const pathPrefix = searchParams.get("pathPrefix");
  const windowDays = Number(searchParams.get("window") ?? "7");
  const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  let pageQuery = supabase.from("geo_page_settings").select("*");
  if (locale) pageQuery = pageQuery.eq("locale", locale);
  if (pathPrefix) pageQuery = pageQuery.like("path", `${pathPrefix}%`);
  const { data: pageRows } = await pageQuery;

  let toggleQuery = supabase.from("geo_page_schema_toggles").select("*");
  if (locale) toggleQuery = toggleQuery.eq("locale", locale);
  if (pathPrefix) toggleQuery = toggleQuery.like("path", `${pathPrefix}%`);
  const { data: toggleRows } = await toggleQuery;

  const { data: changeRows } = await supabase
    .from("geo_audit_logs")
    .select("*")
    .gte("created_at", from);

  const pages = pageRows ?? [];
  const toggles = toggleRows ?? [];
  const total = Math.max(1, pages.length);
  const metadataOk = pages.filter((row) => row.meta_title && row.meta_description && row.canonical_url).length;
  const jsonldCovered = toggles.filter(
    (row) =>
      row.enable_article ||
      row.enable_faqpage ||
      row.enable_howto ||
      row.enable_breadcrumb ||
      row.enable_website,
  ).length;
  const extractionFailureCount = toggles.filter(
    (row) => !row.enable_faqpage || !row.enable_howto,
  ).length;
  const noindexCount = pages.filter((row) => row.noindex).length;
  const highRiskPages = pages
    .filter((row) => !row.meta_title || !row.meta_description || !row.canonical_url)
    .slice(0, 20)
    .map((row) => ({
      locale: row.locale,
      path: row.path,
      reason: "metadata_missing",
    }));

  return NextResponse.json({
    metrics: {
      metadataCompletenessRate: metadataOk / total,
      jsonldCoverageRate: Math.min(1, jsonldCovered / total),
      extractionFailureCount,
      noindexCount,
      changeFrequency: (changeRows ?? []).length,
    },
    highRiskPages,
  });
}
