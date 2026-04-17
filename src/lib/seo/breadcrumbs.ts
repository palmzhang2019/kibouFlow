import { absoluteUrl } from "@/lib/seo/site-url";

export interface BreadcrumbSegment {
  /** URL path from site root, e.g. `/zh/guides` */
  path: string;
  name: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export function buildBreadcrumbItems(
  segments: BreadcrumbSegment[],
  siteUrl?: string,
): BreadcrumbItem[] {
  return segments.map((s) => ({
    name: s.name,
    item: absoluteUrl(s.path, siteUrl),
  }));
}
