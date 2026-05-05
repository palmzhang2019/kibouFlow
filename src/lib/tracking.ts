export interface TrackingEvent {
  event_name: string;
  page_path: string;
  element_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  session_id: string;
  locale: string;
  user_agent: string;
  [key: string]: unknown;
}

export function sendTrackingEvent(event: TrackingEvent) {
  const url = "/api/track";
  const body = JSON.stringify(event);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}
