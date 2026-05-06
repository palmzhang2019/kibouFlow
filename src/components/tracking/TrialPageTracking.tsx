"use client";

import { useEffect } from "react";
import { sendTrackingEvent } from "@/lib/tracking";
import { trackGaEventWhenReady } from "@/lib/ga";
import { PAGE_VIEW_EVENTS } from "@/lib/tracking-events";
import { getOrCreateSessionId } from "@/lib/utm";

interface PageTrackingProps {
  locale: string;
}

function buildEvent(eventName: string, locale: string) {
  return {
    event_name: eventName,
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    session_id: getOrCreateSessionId(),
    locale,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}

export function TrialPageTracking({ locale }: PageTrackingProps) {
  useEffect(() => {
    const eventName = PAGE_VIEW_EVENTS.TRIAL_PAGE_VIEW;
    const event = buildEvent(eventName, locale);
    sendTrackingEvent(event);
    trackGaEventWhenReady(eventName, {
      page_path: event.page_path,
      locale,
      page_type: "trial",
    });
  }, [locale]);

  return null;
}