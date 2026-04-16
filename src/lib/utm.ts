const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "ref"] as const;
const STORAGE_PREFIX = "geo_";

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  landing_page?: string;
}

export function captureUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const url = new URL(window.location.href);
  const params: UTMParams = {};

  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) {
      const storeKey = key === "ref" ? "utm_source" : key;
      (params as Record<string, string>)[storeKey] = value;
      try {
        sessionStorage.setItem(`${STORAGE_PREFIX}${storeKey}`, value);
      } catch {}
    }
  }

  if (document.referrer) {
    params.referrer = document.referrer;
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}referrer`, document.referrer);
    } catch {}
  }

  const landingPage = window.location.pathname;
  try {
    if (!sessionStorage.getItem(`${STORAGE_PREFIX}landing_page`)) {
      sessionStorage.setItem(`${STORAGE_PREFIX}landing_page`, landingPage);
    }
  } catch {}
  params.landing_page = landingPage;

  return params;
}

export function getStoredUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const params: UTMParams = {};
  const keys = ["utm_source", "utm_medium", "utm_campaign", "referrer", "landing_page"];

  for (const key of keys) {
    try {
      const val = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (val) {
        (params as Record<string, string>)[key] = val;
      }
    } catch {}
  }

  return params;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = `${STORAGE_PREFIX}session_id`;
  try {
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  } catch {
    return crypto.randomUUID();
  }
}
