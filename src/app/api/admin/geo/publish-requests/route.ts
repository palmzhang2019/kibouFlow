import { NextRequest, NextResponse } from "next/server";
import { geoPublishRequestSchema } from "@/lib/schemas";
import {
  assertRole,
  buildPublishResourceKey,
  resolveRole,
  writeGeoAuditLog,
} from "@/lib/geo-ops";
import { normalizeGeoPath } from "@/lib/geo-settings";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const actor = await resolveRole(request.headers);
  if (!assertRole(actor.role, ["admin", "reviewer", "editor"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ data: [] });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const locale = searchParams.get("locale");
  const scope = searchParams.get("scope");

  let query = supabase.from("geo_publish_requests").select("*").order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (locale) query = query.eq("locale", locale);
  if (scope) query = query.eq("scope", scope);
  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: "Failed to load publish requests" }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const actor = await resolveRole(request.headers);
  if (!assertRole(actor.role, ["admin", "editor"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = geoPublishRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const payload = {
      ...parsed.data,
      path: parsed.data.path ? normalizeGeoPath(parsed.data.path) : null,
      requested_by: actor.userId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("geo_publish_requests")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to create publish request" }, { status: 500 });
    }

    await writeGeoAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "request",
      scope: "publish_requests",
      resourceKey: buildPublishResourceKey(payload.scope, payload.locale, payload.path ?? undefined),
      afterJson: data as Record<string, unknown>,
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
