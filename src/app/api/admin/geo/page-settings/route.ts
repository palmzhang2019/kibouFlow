import { NextRequest, NextResponse } from "next/server";
import { geoPageSettingsSchema } from "@/lib/schemas";
import { normalizeGeoPath } from "@/lib/geo-settings";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const path = searchParams.get("path");
  if (!locale || !path) {
    return NextResponse.json({ error: "locale and path are required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ data: null, source: "none" });
  }

  const normalizedPath = normalizeGeoPath(path);
  const { data, error } = await supabase
    .from("geo_page_settings")
    .select("*")
    .eq("locale", locale)
    .eq("path", normalizedPath)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Failed to load page settings" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      data: {
        locale,
        path: normalizedPath,
        meta_title: null,
        meta_description: null,
        canonical_url: null,
        og_title: null,
        og_description: null,
        og_image: null,
        noindex: false,
        jsonld_overrides: null,
      },
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
    const parsed = geoPageSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = {
      ...parsed.data,
      path: normalizeGeoPath(parsed.data.path),
      updated_by: request.headers.get("x-admin-user") ?? "internal",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("geo_page_settings")
      .upsert(payload, { onConflict: "locale,path" })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to save page settings" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
