import { NextRequest, NextResponse } from "next/server";
import { geoPublishActionSchema } from "@/lib/schemas";
import { assertRole, resolveRole, writeGeoAuditLog } from "@/lib/geo-ops";
import { getServiceSupabase } from "@/lib/supabase";

async function applyPublishedConfig(
  supabase: ReturnType<typeof getServiceSupabase>,
  requestRow: Record<string, unknown>,
) {
  if (!supabase) return;
  const scope = String(requestRow.scope);
  const draft = (requestRow.draft_json ?? {}) as Record<string, unknown>;
  if (scope === "site") {
    await supabase.from("geo_site_settings").upsert({ id: true, ...draft }, { onConflict: "id" });
  } else if (scope === "page") {
    await supabase.from("geo_page_settings").upsert(draft, { onConflict: "locale,path" });
  } else if (scope === "rules") {
    await supabase.from("geo_rules").upsert(draft, { onConflict: "locale" });
  } else if (scope === "toggles") {
    await supabase.from("geo_page_schema_toggles").upsert(draft, {
      onConflict: "locale,path",
    });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await resolveRole(request.headers);
  if (!assertRole(actor.role, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = geoPublishActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (parsed.data.emergency && !parsed.data.reason) {
      return NextResponse.json({ error: "Emergency publish requires reason" }, { status: 400 });
    }

    const { data: before, error: loadError } = await supabase
      .from("geo_publish_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (loadError || !before) {
      return NextResponse.json({ error: "Publish request not found" }, { status: 404 });
    }

    await applyPublishedConfig(supabase, before as Record<string, unknown>);
    const { data, error } = await supabase
      .from("geo_publish_requests")
      .update({
        status: "published",
        published_json: before.draft_json,
        reviewed_by: actor.userId,
        review_comment: parsed.data.reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to publish request" }, { status: 500 });
    }

    await writeGeoAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "publish",
      scope: "publish_requests",
      resourceKey: String(id),
      beforeJson: before as Record<string, unknown>,
      afterJson: data as Record<string, unknown>,
      isEmergency: parsed.data.emergency,
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
