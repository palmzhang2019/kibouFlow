import { NextRequest, NextResponse } from "next/server";
import { geoRulesRollbackSchema } from "@/lib/schemas";
import { writeGeoRuleLog } from "@/lib/geo-rules";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = geoRulesRollbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data: log, error: loadError } = await supabase
      .from("geo_rule_change_logs")
      .select("*")
      .eq("id", parsed.data.log_id)
      .single();
    if (loadError || !log) {
      return NextResponse.json({ error: "Rollback log not found" }, { status: 404 });
    }

    const before = log.before_json as Record<string, unknown> | null;
    if (!before) {
      return NextResponse.json({ error: "Rollback source is empty" }, { status: 400 });
    }

    if (log.scope === "rules") {
      await supabase.from("geo_rules").upsert(before, { onConflict: "locale" });
    } else {
      await supabase.from("geo_page_schema_toggles").upsert(before, {
        onConflict: "locale,path",
      });
    }

    await writeGeoRuleLog({
      scope: log.scope,
      locale: log.locale,
      path: log.path,
      before_json: log.after_json,
      after_json: before,
      changed_by: request.headers.get("x-admin-user"),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
