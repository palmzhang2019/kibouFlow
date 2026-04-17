"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { sendTrackingEvent } from "@/lib/tracking";
import { captureUTMParams, getStoredUTMParams, getOrCreateSessionId } from "@/lib/utm";

interface TrackingContextType {
  trackPageView: () => void;
  trackCTAClick: (ctaId: string, page: string) => void;
  trackFormStart: (formType: string) => void;
  trackFormSubmit: (formType: string) => void;
}

const TrackingContext = createContext<TrackingContextType>({
  trackPageView: () => {},
  trackCTAClick: () => {},
  trackFormStart: () => {},
  trackFormSubmit: () => {},
});

export function useTracking() {
  return useContext(TrackingContext);
}

function buildEvent(eventName: string, locale: string, extra?: Record<string, string>) {
  const utm = getStoredUTMParams();
  return {
    event_name: eventName,
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    session_id: getOrCreateSessionId(),
    locale,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    ...utm,
    ...extra,
  };
}

function resolveFormEventName(formType: string, phase: "started" | "submitted") {
  if (formType === "trial" || formType === "partner") {
    return `${formType}_form_${phase}`;
  }
  return phase === "started" ? "form_start" : "form_submit";
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    captureUTMParams();
  }, []);

  useEffect(() => {
    sendTrackingEvent(buildEvent("page_view", locale));
  }, [pathname, locale]);

  const trackPageView = useCallback(() => {
    sendTrackingEvent(buildEvent("page_view", locale));
  }, [locale]);

  const trackCTAClick = useCallback(
    (ctaId: string, page: string) => {
      sendTrackingEvent(buildEvent("cta_click", locale, { element_id: ctaId, page_path: page }));
    },
    [locale],
  );

  const trackFormStart = useCallback(
    (formType: string) => {
      sendTrackingEvent(
        buildEvent(resolveFormEventName(formType, "started"), locale, {
          element_id: formType,
        }),
      );
    },
    [locale],
  );

  const trackFormSubmit = useCallback(
    (formType: string) => {
      sendTrackingEvent(
        buildEvent(resolveFormEventName(formType, "submitted"), locale, {
          element_id: formType,
        }),
      );
    },
    [locale],
  );

  return (
    <TrackingContext.Provider value={{ trackPageView, trackCTAClick, trackFormStart, trackFormSubmit }}>
      {children}
    </TrackingContext.Provider>
  );
}
