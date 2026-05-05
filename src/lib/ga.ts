/**
 * Lightweight GA4 event helper.
 * Silently skips when window.gtag is not available.
 * Does not affect or depend on the custom /api/track endpoint.
 */

export type GaEventParams = Record<string, string | number | boolean | undefined>;

export function trackGaEvent(eventName: string, params?: GaEventParams): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}
