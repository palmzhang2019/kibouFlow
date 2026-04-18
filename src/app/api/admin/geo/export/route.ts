import { NextRequest, NextResponse } from "next/server";
import { resolveRole, writeGeoAuditLog } from "@/lib/geo-ops";
import { getServiceSupabase } from "@/lib/supabase";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => {
    const s = String(value ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join(
    "\n",
  );
}

export async function GET(request: NextRequest) {
  const actor = await resolveRole(request.headers);
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const days = Number(searchParams.get("days") ?? "90");
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [site, pages, rules, toggles, audits] = await Promise.all([
    supabase.from("geo_site_settings").select("*"),
    supabase.from("geo_page_settings").select("*"),
    supabase.from("geo_rules").select("*"),
    supabase.from("geo_page_schema_toggles").select("*"),
    supabase.from("geo_audit_logs").select("*").gte("created_at", from),
  ]);

  const payload = {
    site_settings: site.data ?? [],
    page_settings: pages.data ?? [],
    rules: rules.data ?? [],
    schema_toggles: toggles.data ?? [],
    audit_logs: audits.data ?? [],
    exported_at: new Date().toISOString(),
  };

  await writeGeoAuditLog({
    actorId: actor.userId,
    actorRole: actor.role,
    action: "export",
    scope: "export",
    resourceKey: `geo_export_${format}`,
  });

  if (format === "csv") {
    const csv = [
      "# site_settings",
      toCsv(payload.site_settings as Record<string, unknown>[]),
      "# page_settings",
      toCsv(payload.page_settings as Record<string, unknown>[]),
      "# rules",
      toCsv(payload.rules as Record<string, unknown>[]),
      "# schema_toggles",
      toCsv(payload.schema_toggles as Record<string, unknown>[]),
      "# audit_logs",
      toCsv(payload.audit_logs as Record<string, unknown>[]),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="geo-export.csv"',
      },
    });
  }

  return NextResponse.json(payload);
}
