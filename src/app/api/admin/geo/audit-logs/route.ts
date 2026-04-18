import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ data: [] });

  const { searchParams } = new URL(request.url);
  const actor = searchParams.get("actor");
  const scope = searchParams.get("scope");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase.from("geo_audit_logs").select("*").order("created_at", { ascending: false });
  if (actor) query = query.eq("actor_id", actor);
  if (scope) query = query.eq("scope", scope);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
