import { NextRequest, NextResponse } from "next/server";
import { resolveRole } from "@/lib/geo-ops";

export async function GET(request: NextRequest) {
  const { userId, role } = await resolveRole(request.headers);
  const permissions =
    role === "admin"
      ? ["manage_roles", "review", "publish", "edit", "export", "view_audit"]
      : role === "reviewer"
        ? ["review", "view_audit", "view_health"]
        : ["edit", "request_review", "view_health"];
  return NextResponse.json({ user_id: userId, role, permissions });
}
