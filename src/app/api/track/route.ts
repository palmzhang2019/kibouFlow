import { NextRequest, NextResponse } from "next/server";
import { insertTrackingEvent } from "@/lib/pg-data";

const FIXED_FIELDS = new Set<string>([
  "event_name",
  "page_path",
  "element_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "referrer",
  "session_id",
  "locale",
  "user_agent",
]);

const STRING_MAX_LEN = 500;
const EXTRA_SIZE_LIMIT = 100; // max number of extra entries

function sanitizeExtraField(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value.slice(0, STRING_MAX_LEN);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const event: Record<string, unknown> = {
      event_name: String(body.event_name || "unknown"),
      page_path: String(body.page_path || ""),
      element_id: body.element_id ? String(body.element_id) : null,
      utm_source: body.utm_source ? String(body.utm_source) : null,
      utm_medium: body.utm_medium ? String(body.utm_medium) : null,
      utm_campaign: body.utm_campaign ? String(body.utm_campaign) : null,
      referrer: body.referrer ? String(body.referrer) : null,
      session_id: body.session_id ? String(body.session_id) : null,
      locale: body.locale ? String(body.locale) : null,
      user_agent: body.user_agent ? String(body.user_agent).slice(0, STRING_MAX_LEN) : null,
    };

    // Collect remaining fields into extra
    const extra: Record<string, unknown> = {};
    let count = 0;
    for (const [key, value] of Object.entries(body)) {
      if (FIXED_FIELDS.has(key as string)) continue;
      if (count >= EXTRA_SIZE_LIMIT) break;
      const sanitized = sanitizeExtraField(value);
      if (sanitized !== undefined) {
        extra[key] = sanitized;
        count++;
      }
    }
    event.extra = Object.keys(extra).length > 0 ? extra : undefined;

    await insertTrackingEvent(event as Parameters<typeof insertTrackingEvent>[0]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
