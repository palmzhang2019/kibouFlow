import { type NextRequest, NextResponse } from "next/server";
import {
  GEO_ADMIN_SESSION_COOKIE,
  getAdminSecrets,
  verifyAdminSession,
} from "@/lib/admin-session";

export type AdminApiContext =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * 从 Route Handler 的 NextRequest 读取会话（避免依赖 `cookies()` async storage，便于集成测试直接调用 handler）。
 */
export function requireAdminApiAuth(request: NextRequest): AdminApiContext {
  const secrets = getAdminSecrets();
  if (!secrets) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin is not configured (set ADMIN_GEO_PASSWORD and ADMIN_SESSION_SECRET)" },
        { status: 503 },
      ),
    };
  }
  const token = request.cookies.get(GEO_ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(secrets.sessionSecret, token)) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}
