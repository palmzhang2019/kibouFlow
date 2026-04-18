import { NextRequest, NextResponse } from "next/server";
import { geoPublishReviewSchema } from "@/lib/schemas";
import { assertRole, resolveRole, writeGeoAuditLog } from "@/lib/geo-ops";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await resolveRole(request.headers);
  if (!assertRole(actor.role, ["reviewer", "admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = geoPublishReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { data: before, error: loadError } = await supabase
      .from("geo_publish_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (loadError || !before) {
      return NextResponse.json({ error: "Publish request not found" }, { status: 404 });
    }

    const payload = {
      status: parsed.data.status,
      reviewed_by: actor.userId,
      review_comment: parsed.data.review_comment ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("geo_publish_requests")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to review publish request" }, { status: 500 });
    }

    await writeGeoAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "review",
      scope: "publish_requests",
      resourceKey: String(id),
      beforeJson: before as Record<string, unknown>,
      afterJson: data as Record<string, unknown>,
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
