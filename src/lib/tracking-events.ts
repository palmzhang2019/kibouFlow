/** Share event names — used by ShareBox components across the site. */
export const SHARE_EVENTS = {
  COPY_LINK: "share_copy_link",
  COPY_TEXT: "share_copy_text",
  X_CLICK: "share_x_click",
} as const;

export type ShareEventName = (typeof SHARE_EVENTS)[keyof typeof SHARE_EVENTS];

/** Share target values passed as share_target in tracking payload. */
export const SHARE_TARGETS = {
  COPY_LINK: "copy_link",
  COPY_TEXT: "copy_text",
  X: "x",
} as const;

/** Share source locations — indicates where in the page the ShareBox appears. */
export const SHARE_SOURCES = {
  ARTICLE_BOTTOM: "article_bottom",
  FAQ_BOTTOM: "faq_bottom",
  GUIDES_BOTTOM: "guides_bottom",
} as const;

export function resolveFormEventName(formType: string, phase: "started" | "submitted") {
  if (formType === "trial" || formType === "partner") {
    return `${formType}_form_${phase}`;
  }
  return phase === "started" ? "form_start" : "form_submit";
}

/** Page view event names for dedicated pages. */
export const PAGE_VIEW_EVENTS = {
  TRIAL_PAGE_VIEW: "trial_page_view",
  PARTNER_PAGE_VIEW: "partner_page_view",
} as const;
