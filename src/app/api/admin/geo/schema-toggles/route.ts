import { NextRequest, NextResponse } from "next/server";
import { geoSchemaTogglesSchema } from "@/lib/schemas";
import {
  DEFAULT_SCHEMA_TOGGLES,
  isProtectedTogglePath,
  writeGeoRuleLog,
} from "@/lib/geo-rules";
import { normalizeGeoPath } from "@/lib/geo-settings";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const path = searchParams.get("path");
  if ((locale !== "zh" && locale !== "ja") || !path) {
    return NextResponse.json({ error: "locale and path are required" }, { status: 400 });
  }

  const normalizedPath = normalizeGeoPath(path);
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      data: { locale, path: normalizedPath, ...DEFAULT_SCHEMA_TOGGLES },
      source: "none",
    });
  }

  const { data, error } = await supabase
    .from("geo_page_schema_toggles")
    .select("*")
    .eq("locale", locale)
    .eq("path", normalizedPath)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Failed to load schema toggles" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({
      data: { locale, path: normalizedPath, ...DEFAULT_SCHEMA_TOGGLES },
      source: "none",
    });
  }
  return NextResponse.json({ data, source: "db" });
}

export async function PUT(request: NextRequest) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = geoSchemaTogglesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const normalizedPath = normalizeGeoPath(parsed.data.path);
    if (isProtectedTogglePath(normalizedPath)) {
      const disableAny =
        !parsed.data.enable_article ||
        !parsed.data.enable_breadcrumb ||
        !parsed.data.enable_faqpage ||
        !parsed.data.enable_howto ||
        !parsed.data.enable_website;
      if (disableAny) {
        return NextResponse.json(
          { error: "Protected page cannot disable schema outputs" },
          { status: 403 },
        );
      }
    }

    const { data: before } = await supabase
      .from("geo_page_schema_toggles")
      .select("*")
      .eq("locale", parsed.data.locale)
      .eq("path", normalizedPath)
      .maybeSingle();

    const payload = {
      ...parsed.data,
      path: normalizedPath,
      updated_by: request.headers.get("x-admin-user") ?? "internal",
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("geo_page_schema_toggles")
      .upsert(payload, { onConflict: "locale,path" })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to save schema toggles" }, { status: 500 });
    }

    await writeGeoRuleLog({
      scope: "toggles",
      locale: parsed.data.locale,
      path: normalizedPath,
      before_json: (before as Record<string, unknown> | null) ?? null,
      after_json: (data as Record<string, unknown>) ?? null,
      changed_by: request.headers.get("x-admin-user"),
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
