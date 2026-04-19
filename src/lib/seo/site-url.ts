export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com").replace(/\/$/, "");
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
