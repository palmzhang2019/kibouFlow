"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { sendTrackingEvent } from "@/lib/tracking";
import { trackGaEvent } from "@/lib/ga";
import { SHARE_EVENTS, SHARE_TARGETS, type ShareEventName } from "@/lib/tracking-events";
import { getOrCreateSessionId } from "@/lib/utm";

interface ShareBoxProps {
  locale: string;
  contentType: string;
  title: string;
  shareSource: "article_bottom" | "faq_bottom" | "guides_bottom";
  articleSlug?: string;
  articleCategory?: string;
}

type ToastState = {
  visible: boolean;
  message: string;
};

export function ShareBox({
  locale,
  contentType,
  title,
  shareSource,
  articleSlug,
  articleCategory,
}: ShareBoxProps) {
  const t = useTranslations("shareBox");
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "" });

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2000);
  }, []);

  const getPagePath = () =>
    typeof window !== "undefined" ? window.location.pathname : "";

  const dispatchShareEvent = useCallback(
    (eventName: ShareEventName, target: string) => {
      const payload = {
        event_name: eventName,
        page_path: getPagePath(),
        session_id: getOrCreateSessionId(),
        locale,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        content_type: contentType,
        article_slug: articleSlug ?? "",
        article_category: articleCategory ?? "",
        share_target: target,
        share_source: shareSource,
        title,
      };
      sendTrackingEvent(payload);
      trackGaEvent(eventName, {
        page_path: getPagePath(),
        locale,
        content_type: contentType,
        share_target: target,
        share_source: shareSource,
        article_slug: articleSlug ?? "",
        article_category: articleCategory ?? "",
        title,
      });
    },
    [locale, contentType, articleSlug, articleCategory, shareSource, title],
  );

  const handleCopyLink = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      dispatchShareEvent(SHARE_EVENTS.COPY_LINK, SHARE_TARGETS.COPY_LINK);
      showToast(t("toast.copied"));
    } catch {
      showToast(t("toast.copyFailed"));
    }
  }, [dispatchShareEvent, showToast, t]);

  const handleCopyText = useCallback(async () => {
    const text = `${title} ${typeof window !== "undefined" ? window.location.href : ""}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      dispatchShareEvent(SHARE_EVENTS.COPY_TEXT, SHARE_TARGETS.COPY_TEXT);
      showToast(t("toast.copied"));
    } catch {
      showToast(t("toast.copyFailed"));
    }
  }, [title, dispatchShareEvent, showToast, t]);

  const handleXShare = useCallback(() => {
    const url = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
    const text = encodeURIComponent(title);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400",
    );
    dispatchShareEvent(SHARE_EVENTS.X_CLICK, SHARE_TARGETS.X);
  }, [title, dispatchShareEvent]);

  return (
    <section
      aria-label={t("label")}
      className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6"
    >
      <h2 className="text-base font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("description")}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
        >
          <LinkIcon />
          {t("buttons.copyLink")}
        </button>

        <button
          onClick={handleXShare}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
        >
          <XIcon />
          {t("buttons.shareX")}
        </button>

        <button
          onClick={handleCopyText}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
        >
          <CopyIcon />
          {t("buttons.copyText")}
        </button>
      </div>

      {toast.visible && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M6.5 9.5a3.53 3.53 0 0 0 5-.5l1-1a3.54 3.54 0 0 0-5-5l-.5.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 6.5a3.53 3.53 0 0 0-5 .5l-1 1a3.54 3.54 0 0 0 5 5l.5-.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12.6 1h2.4L9.8 7.1 16 15h-4.7L7.5 10.5 3.2 15H.8l5.7-6.3L0 1h4.8l3.6 4.8L12.6 1zm-.8 12.6h1.3L4.3 2.4H2.9l8.9 11.2z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="5" y="5" width="9" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3 11V3a1 1 0 0 1 1-1h8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
