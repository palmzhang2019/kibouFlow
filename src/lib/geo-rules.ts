import { getServiceSupabase } from "@/lib/supabase";
import { normalizeGeoPath } from "@/lib/geo-settings";

export interface GeoRulesRow {
  id?: string;
  locale: "zh" | "ja";
  faq_exclude_heading_patterns: string[];
  faq_min_items: number;
  howto_section_patterns: string[];
  howto_min_steps: number;
  article_abstract_from_tldr: boolean;
  updated_by?: string | null;
  updated_at?: string;
}

export interface GeoSchemaTogglesRow {
  locale: "zh" | "ja";
  path: string;
  enable_article: boolean;
  enable_faqpage: boolean;
  enable_howto: boolean;
  enable_breadcrumb: boolean;
  enable_website: boolean;
  updated_by?: string | null;
  updated_at?: string;
}

export interface GeoRuleLogRow {
  id?: string;
  scope: "rules" | "toggles";
  locale: "zh" | "ja";
  path?: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  changed_by: string | null;
}

export const DEFAULT_GEO_RULES: Omit<GeoRulesRow, "updated_by" | "updated_at" | "id"> = {
  locale: "zh",
  faq_exclude_heading_patterns: [],
  faq_min_items: 2,
  howto_section_patterns: [],
  howto_min_steps: 2,
  article_abstract_from_tldr: false,
};

export const DEFAULT_SCHEMA_TOGGLES: Omit<
  GeoSchemaTogglesRow,
  "locale" | "path" | "updated_by" | "updated_at"
> = {
  enable_article: true,
  enable_faqpage: true,
  enable_howto: true,
  enable_breadcrumb: true,
  enable_website: true,
};

const PROTECTED_TOGGLE_PATHS = new Set(["/zh", "/ja"]);

export function isProtectedTogglePath(path: string): boolean {
  const normalized = normalizeGeoPath(path);
  if (PROTECTED_TOGGLE_PATHS.has(normalized)) return true;
  return /\/(zh|ja)\/guides\/[^/]+\/[^/]+$/.test(normalized);
}

export function compilePatterns(patterns: string[]): RegExp[] {
  return patterns.map((item) => new RegExp(item, "i"));
}

export async function getGeoRules(locale: "zh" | "ja"): Promise<{
  data: GeoRulesRow;
  source: "db" | "none";
}> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { data: { ...DEFAULT_GEO_RULES, locale }, source: "none" };
  }
  const { data } = await supabase.from("geo_rules").select("*").eq("locale", locale).maybeSingle();
  if (!data) {
    return { data: { ...DEFAULT_GEO_RULES, locale }, source: "none" };
  }
  return { data: data as GeoRulesRow, source: "db" };
}

export async function getGeoSchemaToggles(
  locale: "zh" | "ja",
  path: string,
): Promise<{ data: GeoSchemaTogglesRow; source: "db" | "none" }> {
  const supabase = getServiceSupabase();
  const normalizedPath = normalizeGeoPath(path);
  if (!supabase) {
    return {
      data: { locale, path: normalizedPath, ...DEFAULT_SCHEMA_TOGGLES },
      source: "none",
    };
  }
  const { data } = await supabase
    .from("geo_page_schema_toggles")
    .select("*")
    .eq("locale", locale)
    .eq("path", normalizedPath)
    .maybeSingle();
  if (!data) {
    return {
      data: { locale, path: normalizedPath, ...DEFAULT_SCHEMA_TOGGLES },
      source: "none",
    };
  }
  return { data: data as GeoSchemaTogglesRow, source: "db" };
}

export async function writeGeoRuleLog(input: GeoRuleLogRow): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  await supabase.from("geo_rule_change_logs").insert({
    ...input,
    created_at: new Date().toISOString(),
  });
}

export async function listGeoRuleLogs(limit = 20): Promise<GeoRuleLogRow[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("geo_rule_change_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as GeoRuleLogRow[] | null) ?? [];
}
