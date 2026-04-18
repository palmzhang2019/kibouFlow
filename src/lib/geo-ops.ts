import { getServiceSupabase } from "@/lib/supabase";
import { normalizeGeoPath } from "@/lib/geo-settings";

export type GeoRole = "admin" | "editor" | "reviewer";
export type GeoPublishStatus = "draft" | "pending" | "published" | "rejected";

export function getActorFromHeaders(headers: Headers): { userId: string; role: GeoRole } {
  const userId = headers.get("x-admin-user") ?? "internal";
  const role = (headers.get("x-admin-role") ?? "admin") as GeoRole;
  return { userId, role: ["admin", "editor", "reviewer"].includes(role) ? role : "admin" };
}

export function assertRole(role: GeoRole, allowed: GeoRole[]): boolean {
  return allowed.includes(role);
}

export async function getBoundRole(userId: string): Promise<GeoRole | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("geo_role_bindings")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as GeoRole | undefined) ?? null;
}

export async function resolveRole(headers: Headers): Promise<{ userId: string; role: GeoRole }> {
  const actor = getActorFromHeaders(headers);
  const bound = await getBoundRole(actor.userId);
  return { userId: actor.userId, role: bound ?? actor.role };
}

export async function writeGeoAuditLog(input: {
  actorId: string;
  actorRole: GeoRole;
  action: "create" | "update" | "request" | "review" | "publish" | "rollback" | "export";
  scope: string;
  resourceKey: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  isEmergency?: boolean;
}): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  await supabase.from("geo_audit_logs").insert({
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: input.action,
    scope: input.scope,
    resource_key: input.resourceKey,
    before_json: input.beforeJson ?? null,
    after_json: input.afterJson ?? null,
    is_emergency: input.isEmergency ?? false,
    created_at: new Date().toISOString(),
  });
}

export function buildPublishResourceKey(scope: string, locale: string, path?: string): string {
  return `${scope}:${locale}:${path ? normalizeGeoPath(path) : "-"}`;
}
