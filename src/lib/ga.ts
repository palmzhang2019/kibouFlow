/**
 * Lightweight GA4 event helper.
 *
 * Always dispatches via `window.gtag("event", ...)` — the standard GA4
 * front-end path. Never talks to `google-analytics.com/g/collect` or the
 * Measurement Protocol directly. Silently skips when `window.gtag` is not
 * available so SSR and ad-blocker scenarios cannot throw.
 *
 * Does not affect or depend on the custom /api/track endpoint.
 */

export type GaEventParams = Record<string, string | number | boolean | undefined>;

export interface TrackGaEventWhenReadyOptions {
  /** Maximum number of attempts (including the first). Defaults to 5. */
  maxRetries?: number;
  /** Delay in milliseconds between attempts. Defaults to 300. */
  intervalMs?: number;
}

const DEFAULT_MAX_RETRY = 5;
const DEFAULT_RETRY_INTERVAL_MS = 300;

function safeCallGtag(eventName: string, params?: GaEventParams): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.gtag !== "function") return false;
  try {
    window.gtag("event", eventName, params);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fire a GA4 custom event immediately if `window.gtag` is available.
 * No-op (and never throws) when running on the server or before gtag loads.
 */
export function trackGaEvent(eventName: string, params?: GaEventParams): void {
  safeCallGtag(eventName, params);
}

/**
 * Fire a GA4 custom event, retrying briefly when `window.gtag` is not yet
 * defined (e.g., page-view events queued from a `useEffect` that runs before
 * the `afterInteractive` GA script has executed).
 *
 * Defaults to 5 attempts spaced 300ms apart (~1.2s window). Pass `options`
 * to widen the window if you call this from a particularly hot mount path.
 */
export function trackGaEventWhenReady(
  eventName: string,
  params?: GaEventParams,
  options?: TrackGaEventWhenReadyOptions,
): void {
  if (typeof window === "undefined") return;

  const maxRetries =
    options?.maxRetries && options.maxRetries > 0 ? options.maxRetries : DEFAULT_MAX_RETRY;
  const intervalMs =
    options?.intervalMs && options.intervalMs > 0 ? options.intervalMs : DEFAULT_RETRY_INTERVAL_MS;

  function attempt(count: number): void {
    if (count >= maxRetries) return;
    if (safeCallGtag(eventName, params)) return;
    setTimeout(() => attempt(count + 1), intervalMs);
  }

  attempt(0);
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}
