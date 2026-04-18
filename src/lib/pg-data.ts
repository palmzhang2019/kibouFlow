import { getPg } from "@/lib/db";
import type { PartnerFormData, TrialFormData } from "@/lib/schemas";

export type InsertOk = { ok: true };
export type InsertNotConfigured = { ok: false; reason: "not_configured" };
export type InsertFailed = { ok: false; reason: "insert_failed"; detail?: string };

export type TrialInsertResult = InsertOk | InsertNotConfigured | InsertFailed;

export async function insertTrialSubmission(ip: string, data: TrialFormData): Promise<TrialInsertResult> {
  const sql = getPg();
  if (!sql) return { ok: false, reason: "not_configured" };
  try {
    const row = { ...data, ip_address: ip };
    await sql`insert into trial_submissions ${sql(row)}`;
    return { ok: true };
  } catch (e) {
    console.error("insertTrialSubmission", e);
    return { ok: false, reason: "insert_failed", detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function insertPartnerSubmission(ip: string, data: PartnerFormData): Promise<TrialInsertResult> {
  const sql = getPg();
  if (!sql) return { ok: false, reason: "not_configured" };
  try {
    const row = { ...data, ip_address: ip };
    await sql`insert into partner_submissions ${sql(row)}`;
    return { ok: true };
  } catch (e) {
    console.error("insertPartnerSubmission", e);
    return { ok: false, reason: "insert_failed", detail: e instanceof Error ? e.message : String(e) };
  }
}

export type TrackingEventRow = {
  event_name: string;
  page_path: string;
  element_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  session_id: string | null;
  locale: string | null;
  user_agent: string | null;
};

export async function insertTrackingEvent(event: TrackingEventRow): Promise<void> {
  const sql = getPg();
  if (!sql) return;
  try {
    await sql`insert into tracking_events ${sql(event)}`;
  } catch {
    // 与旧实现一致：埋点失败不抛给客户端
  }
}
