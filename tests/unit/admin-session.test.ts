import { describe, expect, it } from "vitest";
import {
  signAdminSession,
  verifyAdminSession,
} from "@/lib/admin-session";
import { isAdminUiLocale } from "@/lib/admin-locale";

describe("admin-session", () => {
  const secret = "test-secret-key-at-least-16";

  it("signs and verifies a valid token", () => {
    const token = signAdminSession(secret, 60_000);
    expect(verifyAdminSession(secret, token)).toBe(true);
  });

  it("rejects wrong secret", () => {
    const token = signAdminSession(secret, 60_000);
    expect(verifyAdminSession("other-secret-other-16", token)).toBe(false);
  });

  it("rejects tampered token", () => {
    const token = signAdminSession(secret, 60_000);
    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(verifyAdminSession(secret, tampered)).toBe(false);
  });

  it("rejects expired token", () => {
    const token = signAdminSession(secret, -1);
    expect(verifyAdminSession(secret, token)).toBe(false);
  });
});

describe("admin locale guard", () => {
  it("allows admin UI for zh and ja", () => {
    expect(isAdminUiLocale("zh")).toBe(true);
    expect(isAdminUiLocale("ja")).toBe(true);
  });

  it("rejects en for admin UI", () => {
    expect(isAdminUiLocale("en")).toBe(false);
  });
});
