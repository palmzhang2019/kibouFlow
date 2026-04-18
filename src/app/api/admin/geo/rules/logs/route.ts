import { NextRequest, NextResponse } from "next/server";
import { listGeoRuleLogs } from "@/lib/geo-rules";

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const logs = await listGeoRuleLogs(Number.isFinite(limit) ? limit : 20);
  return NextResponse.json({ data: logs });
}
