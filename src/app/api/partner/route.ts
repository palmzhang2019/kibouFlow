import { NextRequest, NextResponse } from "next/server";
import { partnerFormSchema } from "@/lib/schemas";
import { insertPartnerSubmission } from "@/lib/pg-data";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsed = partnerFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await insertPartnerSubmission(ip, parsed.data);
    if (!result.ok && result.reason === "not_configured") {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}
