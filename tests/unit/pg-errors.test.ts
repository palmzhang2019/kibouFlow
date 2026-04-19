import { describe, expect, it } from "vitest";
import { isMissingRelationError } from "@/lib/pg-errors";

describe("isMissingRelationError", () => {
  it("detects Postgres undefined_table", () => {
    expect(isMissingRelationError({ code: "42P01" })).toBe(true);
    expect(isMissingRelationError({ code: "23505" })).toBe(false);
    expect(isMissingRelationError(null)).toBe(false);
  });
});
