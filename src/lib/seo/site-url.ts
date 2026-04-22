const DEFAULT_SITE_URL = "https://kibouflow.com";

function normalizeCandidateSiteUrl(value?: string): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getSiteUrl(): string {
  const normalized = normalizeCandidateSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (!normalized) return DEFAULT_SITE_URL;

  if (process.env.NODE_ENV === "production") {
    try {
      if (isLoopbackHost(new URL(normalized).hostname)) {
        return DEFAULT_SITE_URL;
      }
    } catch {
      return DEFAULT_SITE_URL;
    }
  }

  return normalized;
}

export function organizationId(siteUrl?: string): string {
  return `${(siteUrl ?? getSiteUrl()).replace(/\/$/, "")}/#organization`;
}

/** 与 Organization 区分，用于 Article.author 的 Person @id */
export function primaryPersonAuthorId(siteUrl?: string): string {
  return `${(siteUrl ?? getSiteUrl()).replace(/\/$/, "")}/#person`;
}

export function websiteIdForLocale(locale: string, siteUrl?: string): string {
  const base = (siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  return `${base}/${locale}/#website`;
}

export function localeToInLanguage(locale: string): string {
  if (locale === "zh") return "zh-CN";
  if (locale === "ja") return "ja-JP";
  return locale;
}

export function absoluteUrl(path: string, siteUrl?: string): string {
  const base = (siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function getDefaultOgImage(): string {
  return `${getSiteUrl()}/og-image.svg`;
}
