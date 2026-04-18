import { createHmac, timingSafeEqual } from "node:crypto";

export const GEO_ADMIN_SESSION_COOKIE = "geo_admin_session";

export interface SessionPayload {
  exp: number;
  v: number;
}

export function signAdminSession(secret: string, ttlMs: number): string {
  const payload: SessionPayload = { exp: Date.now() + ttlMs, v: 1 };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSession(secret: string, token: string | undefined): boolean {
  if (!secret || !token) return false;
  const i = token.lastIndexOf(".");
  if (i <= 0) return false;
  const payloadB64 = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try {
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    return typeof data.exp === "number" && data.exp > Date.now() && data.v === 1;
  } catch {
    return false;
  }
}

export function getAdminSecrets(): { password: string; sessionSecret: string } | null {
  const password = process.env.ADMIN_GEO_PASSWORD?.trim();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!password || !sessionSecret) return null;
  return { password, sessionSecret };
}
