import { describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { insertTrialSubmission, insertPartnerSubmission, insertTrackingEvent } from "@/lib/pg-data";

const mockGetPg = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  getPg: mockGetPg,
}));

describe("insertTrialSubmission", () => {
  it("returns not_configured when getPg returns null", async () => {
    mockGetPg.mockReturnValue(null);

    const result = await insertTrialSubmission("127.0.0.1", {
      name: "Alice",
      contact: "alice@example.com",
    });
    expect(result).toEqual({ ok: false, reason: "not_configured" });
  });

  it("returns ok true on successful insert", async () => {
    mockGetPg.mockReturnValue(vi.fn().mockResolvedValue([]) as ReturnType<typeof vi.fn<() => postgres.Sql<Record<string, unknown>>[], []>>);

    const result = await insertTrialSubmission("127.0.0.1", {
      name: "Alice",
      contact: "alice@example.com",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns insert_failed with detail on sql error", async () => {
    mockGetPg.mockReturnValue(
      vi.fn().mockRejectedValue(new Error("connection refused")) as ReturnType<typeof vi.fn<() => postgres.Sql<Record<string, unknown>>[], []>>,
    );

    const result = await insertTrialSubmission("127.0.0.1", {
      name: "Bob",
      contact: "bob@example.com",
    });
    expect(result).toEqual({ ok: false, reason: "insert_failed", detail: "connection refused" });
  });
});

describe("insertPartnerSubmission", () => {
  it("returns not_configured when getPg returns null", async () => {
    mockGetPg.mockReturnValue(null);

    const result = await insertPartnerSubmission("127.0.0.1", {
      org_name: "Acme",
      contact_person: "Carol",
      contact_method: "email",
    });
    expect(result).toEqual({ ok: false, reason: "not_configured" });
  });

  it("returns ok true on successful insert", async () => {
    mockGetPg.mockReturnValue(vi.fn().mockResolvedValue([]) as ReturnType<typeof vi.fn<() => postgres.Sql<Record<string, unknown>>[], []>>);

    const result = await insertPartnerSubmission("127.0.0.1", {
      org_name: "Acme",
      contact_person: "Carol",
      contact_method: "email",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns insert_failed with detail on sql error", async () => {
    mockGetPg.mockReturnValue(
      vi.fn().mockRejectedValue(new Error("table not found")) as ReturnType<typeof vi.fn<() => postgres.Sql<Record<string, unknown>>[], []>>,
    );

    const result = await insertPartnerSubmission("127.0.0.1", {
      org_name: "Acme",
      contact_person: "Carol",
      contact_method: "email",
    });
    expect(result).toEqual({ ok: false, reason: "insert_failed", detail: "table not found" });
  });
});

describe("insertTrackingEvent", () => {
  it("returns silently when getPg returns null", async () => {
    mockGetPg.mockReturnValue(null);

    await expect(
      insertTrackingEvent({
        event_name: "click",
        page_path: "/",
        element_id: "btn",
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: null,
        session_id: null,
        locale: null,
        user_agent: null,
      }),
    ).resolves.not.toThrow();
  });

  it("does not throw when sql throws", async () => {
    mockGetPg.mockReturnValue(
      vi.fn().mockRejectedValue(new Error("db error")) as ReturnType<typeof vi.fn<() => postgres.Sql<Record<string, unknown>>[], []>>,
    );

    await expect(
      insertTrackingEvent({
        event_name: "click",
        page_path: "/",
        element_id: null,
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: null,
        session_id: null,
        locale: null,
        user_agent: null,
      }),
    ).resolves.not.toThrow();
  });
});
