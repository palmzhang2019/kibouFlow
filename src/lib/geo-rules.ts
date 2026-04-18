import { getPg } from "@/lib/db";
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

function mapGeoRulesRow(row: Record<string, unknown>, locale: "zh" | "ja"): GeoRulesRow {
  const faq = row.faq_exclude_heading_patterns;
  const howto = row.howto_section_patterns;
  return {
    id: row.id as string | undefined,
    locale,
    faq_exclude_heading_patterns: Array.isArray(faq) ? (faq as string[]) : [],
    faq_min_items: Number(row.faq_min_items) || 2,
    howto_section_patterns: Array.isArray(howto) ? (howto as string[]) : [],
    howto_min_steps: Number(row.howto_min_steps) || 2,
    article_abstract_from_tldr: Boolean(row.article_abstract_from_tldr),
    updated_by: (row.updated_by as string) ?? null,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  };
}

function mapSchemaTogglesRow(row: Record<string, unknown>, locale: "zh" | "ja", path: string): GeoSchemaTogglesRow {
  return {
    locale,
    path,
    enable_article: Boolean(row.enable_article),
    enable_faqpage: Boolean(row.enable_faqpage),
    enable_howto: Boolean(row.enable_howto),
    enable_breadcrumb: Boolean(row.enable_breadcrumb),
    enable_website: Boolean(row.enable_website),
    updated_by: (row.updated_by as string) ?? null,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  };
}

export async function getGeoRules(locale: "zh" | "ja"): Promise<{
  data: GeoRulesRow;
  source: "db" | "none";
}> {
  const sql = getPg();
  if (!sql) {
    return { data: { ...DEFAULT_GEO_RULES, locale }, source: "none" };
  }
  const rows = await sql<Record<string, unknown>[]>`
    select * from geo_rules where locale = ${locale} limit 1
  `;
  const row = rows[0];
  if (!row) {
    return { data: { ...DEFAULT_GEO_RULES, locale }, source: "none" };
  }
  return { data: mapGeoRulesRow(row, locale), source: "db" };
}

export async function getGeoSchemaToggles(
  locale: "zh" | "ja",
  path: string,
): Promise<{ data: GeoSchemaTogglesRow; source: "db" | "none" }> {
  const sql = getPg();
  const normalizedPath = normalizeGeoPath(path);
  if (!sql) {
    return {
      data: { locale, path: normalizedPath, ...DEFAULT_SCHEMA_TOGGLES },
      source: "none",
    };
  }
  const rows = await sql<Record<string, unknown>[]>`
    select * from geo_page_schema_toggles
    where locale = ${locale} and path = ${normalizedPath}
    limit 1
  `;
  const row = rows[0];
  if (!row) {
    return {
      data: { locale, path: normalizedPath, ...DEFAULT_SCHEMA_TOGGLES },
      source: "none",
    };
  }
  return { data: mapSchemaTogglesRow(row, locale, normalizedPath), source: "db" };
}
