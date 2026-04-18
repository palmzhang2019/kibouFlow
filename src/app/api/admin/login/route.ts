import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  GEO_ADMIN_SESSION_COOKIE,
  getAdminSecrets,
  signAdminSession,
} from "@/lib/admin-session";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = checkRateLimit(`admin-login:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const secrets = getAdminSecrets();
  if (!secrets) {
    return NextResponse.json(
      { error: "Admin is not configured (set ADMIN_GEO_PASSWORD and ADMIN_SESSION_SECRET)" },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(secrets.password, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signAdminSession(secrets.sessionSecret, SESSION_MAX_AGE_MS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GEO_ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
  return res;
}
