import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows first three requests and blocks the fourth", () => {
    const ip = `ip-${Date.now()}`;

    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);

    const blocked = checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeTypeOf("number");
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after time window", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(now);

    const ip = "window-reset-ip";
    checkRateLimit(ip);
    checkRateLimit(ip);
    checkRateLimit(ip);
    expect(checkRateLimit(ip).allowed).toBe(false);

    vi.setSystemTime(new Date(now.getTime() + 10 * 60 * 1000 + 1));
    expect(checkRateLimit(ip).allowed).toBe(true);

    vi.useRealTimers();
  });
});
