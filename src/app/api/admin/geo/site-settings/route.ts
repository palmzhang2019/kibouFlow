import { NextRequest, NextResponse } from "next/server";
import { geoSiteSettingsSchema } from "@/lib/schemas";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        data: null,
        source: "none",
      },
      { status: 200 },
    );
  }

  const { data, error } = await supabase
    .from("geo_site_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load site settings" }, { status: 500 });
  }

  return NextResponse.json({ data, source: data ? "db" : "none" });
}

export async function PUT(request: NextRequest) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = geoSiteSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = {
      id: true,
      ...parsed.data,
      updated_by: request.headers.get("x-admin-user") ?? "internal",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("geo_site_settings")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to save site settings" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
