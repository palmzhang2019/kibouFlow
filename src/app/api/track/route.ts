import { NextRequest, NextResponse } from "next/server";
import { insertTrackingEvent } from "@/lib/pg-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const event = {
      event_name: String(body.event_name || "unknown"),
      page_path: String(body.page_path || ""),
      element_id: body.element_id ? String(body.element_id) : null,
      utm_source: body.utm_source ? String(body.utm_source) : null,
      utm_medium: body.utm_medium ? String(body.utm_medium) : null,
      utm_campaign: body.utm_campaign ? String(body.utm_campaign) : null,
      referrer: body.referrer ? String(body.referrer) : null,
      session_id: body.session_id ? String(body.session_id) : null,
      locale: body.locale ? String(body.locale) : null,
      user_agent: body.user_agent ? String(body.user_agent).slice(0, 500) : null,
    };

    await insertTrackingEvent(event);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
