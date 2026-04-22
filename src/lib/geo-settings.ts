import type { Metadata } from "next";
import { getPg } from "@/lib/db";
import { getSiteUrl, getDefaultOgImage } from "@/lib/seo/site-url";

export interface GeoSiteSettingsRow {
  site_name: string;
  default_title_template: string;
  default_description: string;
  default_locale: "zh" | "ja";
  site_url: string;
  robots_policy: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface GeoPageSettingsRow {
  locale: "zh" | "ja";
  path: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  jsonld_overrides: Record<string, unknown> | null;
  updated_by: string | null;
  updated_at: string;
}

export interface GeoMetadataInput {
  locale: "zh" | "ja";
  path: string;
  existingTitle?: string;
  existingDescription?: string;
  existingCanonical?: string;
  existingOpenGraph?: Metadata["openGraph"];
}

interface GeoMetadataResolved {
  title: string;
  description: string;
  canonical?: string;
  openGraph: Metadata["openGraph"];
  robots?: Metadata["robots"];
}

export interface GeoConfigBundle {
  site: GeoSiteSettingsRow | null;
  page: GeoPageSettingsRow | null;
  source: "db" | "none";
}

const DEFAULT_SITE_SETTINGS: Pick<
  GeoSiteSettingsRow,
  "site_name" | "default_title_template" | "default_description" | "default_locale" | "site_url"
> = {
  site_name: "kibouFlow",
  default_title_template: "%s | kibouFlow",
  default_description: "先整理希望，再判断路径，再导向下一步",
  default_locale: "zh",
  site_url: getSiteUrl(),
};

export function normalizeGeoPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed) return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}

export function mergeJsonLd(
  base: Record<string, unknown>,
  overrides?: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!overrides) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof out[key] === "object" &&
      out[key] !== null &&
      !Array.isArray(out[key])
    ) {
      out[key] = mergeJsonLd(
        out[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
      continue;
    }
    out[key] = value;
  }
  return out;
}

async function readSiteSettings(): Promise<GeoSiteSettingsRow | null> {
  const sql = getPg();
  if (!sql) return null;
  const rows = await sql<GeoSiteSettingsRow[]>`
    select site_name, default_title_template, default_description, default_locale,
           site_url, robots_policy, updated_by, updated_at::text as updated_at
    from geo_site_settings
    order by updated_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

async function readPageSettings(
  locale: string,
  path: string,
): Promise<GeoPageSettingsRow | null> {
  const sql = getPg();
  if (!sql) return null;
  const rows = await sql<GeoPageSettingsRow[]>`
    select locale, path, meta_title, meta_description, canonical_url,
           og_title, og_description, og_image, noindex, jsonld_overrides,
           updated_by, updated_at::text as updated_at
    from geo_page_settings
    where locale = ${locale} and path = ${path}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getGeoConfigBundle(
  locale: "zh" | "ja",
  path: string,
): Promise<GeoConfigBundle> {
  const normalizedPath = normalizeGeoPath(path);
  const sql = getPg();
  if (!sql) {
    return { site: null, page: null, source: "none" };
  }

  const [site, page] = await Promise.all([
    readSiteSettings(),
    readPageSettings(locale, normalizedPath),
  ]);
  return { site, page, source: site || page ? "db" : "none" };
}

export async function resolveGeoMetadata(
  input: GeoMetadataInput,
): Promise<GeoMetadataResolved> {
  const { site, page } = await getGeoConfigBundle(input.locale, input.path);
  const title =
    page?.meta_title ||
    input.existingTitle ||
    site?.default_title_template.replace("%s", DEFAULT_SITE_SETTINGS.site_name) ||
    DEFAULT_SITE_SETTINGS.site_name;
  const description =
    page?.meta_description ||
    input.existingDescription ||
    site?.default_description ||
    DEFAULT_SITE_SETTINGS.default_description;
  const canonical = page?.canonical_url || input.existingCanonical;
  const openGraph = {
    ...(input.existingOpenGraph ?? {}),
    title: page?.og_title || page?.meta_title || input.existingTitle || title,
    description:
      page?.og_description ||
      page?.meta_description ||
      input.existingDescription ||
      description,
    images:
      page?.og_image && page.og_image.length > 0
        ? [{ url: page.og_image }]
        : (input.existingOpenGraph?.images ?? [{ url: getDefaultOgImage() }]),
  };
  const robots = page?.noindex ? { index: false, follow: false } : undefined;

  return {
    title: title || DEFAULT_SITE_SETTINGS.site_name,
    description,
    canonical,
    openGraph,
    robots,
  };
}
