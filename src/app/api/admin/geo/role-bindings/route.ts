import { NextRequest, NextResponse } from "next/server";
import { geoRoleBindingSchema } from "@/lib/schemas";
import { assertRole, resolveRole, writeGeoAuditLog } from "@/lib/geo-ops";
import { getServiceSupabase } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  const actor = await resolveRole(request.headers);
  if (!assertRole(actor.role, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = geoRoleBindingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data: before } = await supabase
      .from("geo_role_bindings")
      .select("*")
      .eq("user_id", parsed.data.user_id)
      .maybeSingle();

    const payload = {
      ...parsed.data,
      updated_by: actor.userId,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("geo_role_bindings")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to save role binding" }, { status: 500 });
    }

    await writeGeoAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "update",
      scope: "roles",
      resourceKey: parsed.data.user_id,
      beforeJson: (before as Record<string, unknown> | null) ?? null,
      afterJson: (data as Record<string, unknown>) ?? null,
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
