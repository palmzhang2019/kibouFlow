import { NextRequest, NextResponse } from "next/server";
import { geoRulesSchema } from "@/lib/schemas";
import { getServiceSupabase } from "@/lib/supabase";
import { DEFAULT_GEO_RULES, writeGeoRuleLog } from "@/lib/geo-rules";

export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get("locale");
  if (locale !== "zh" && locale !== "ja") {
    return NextResponse.json({ error: "locale must be zh or ja" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ data: { ...DEFAULT_GEO_RULES, locale }, source: "none" });
  }

  const { data, error } = await supabase.from("geo_rules").select("*").eq("locale", locale).maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Failed to load rules" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ data: { ...DEFAULT_GEO_RULES, locale }, source: "none" });
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
    const parsed = geoRulesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const locale = parsed.data.locale;
    const { data: before } = await supabase
      .from("geo_rules")
      .select("*")
      .eq("locale", locale)
      .maybeSingle();

    const payload = {
      ...parsed.data,
      updated_by: request.headers.get("x-admin-user") ?? "internal",
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("geo_rules")
      .upsert(payload, { onConflict: "locale" })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to save rules" }, { status: 500 });
    }

    await writeGeoRuleLog({
      scope: "rules",
      locale,
      path: null,
      before_json: (before as Record<string, unknown> | null) ?? null,
      after_json: (data as Record<string, unknown>) ?? null,
      changed_by: request.headers.get("x-admin-user"),
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
