import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GEO_ADMIN_SESSION_COOKIE,
  getAdminSecrets,
  verifyAdminSession,
} from "@/lib/admin-session";

export async function GET() {
  const secrets = getAdminSecrets();
  if (!secrets) {
    return NextResponse.json({ authenticated: false, configured: false });
  }
  const jar = await cookies();
  const token = jar.get(GEO_ADMIN_SESSION_COOKIE)?.value;
  const authenticated = verifyAdminSession(secrets.sessionSecret, token);
  return NextResponse.json({ authenticated, configured: true });
}
