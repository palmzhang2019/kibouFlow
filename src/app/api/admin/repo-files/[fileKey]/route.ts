import { NextRequest, NextResponse } from "next/server";
import {
  isAdminRepoFileKey,
  isAdminRepoFileWriteAllowed,
  readAdminRepoFile,
  writeAdminRepoFile,
} from "@/lib/admin-repo-files";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdminApiAuth } from "@/lib/require-admin-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ fileKey: string }> },
) {
  const auth = requireAdminApiAuth(_request);
  if (!auth.ok) return auth.response;

  const { fileKey } = await context.params;
  const key = fileKey?.trim() ?? "";
  if (!isAdminRepoFileKey(key)) {
    return NextResponse.json({ error: "unknown file key" }, { status: 404 });
  }

  const data = await readAdminRepoFile(key);
  if (!data) {
    return NextResponse.json({ error: "file not found or unreadable" }, { status: 404 });
  }

  return NextResponse.json({
    key,
    absolutePath: data.path,
    content: data.content,
    writeEnabled: isAdminRepoFileWriteAllowed(),
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ fileKey: string }> }) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = checkRateLimit(`admin-repo-file:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = requireAdminApiAuth(request);
  if (!auth.ok) return auth.response;

  if (!isAdminRepoFileWriteAllowed()) {
    return NextResponse.json(
      {
        error:
          "Repo file write disabled in this environment. For production self-hosting set ADMIN_ENABLE_REPO_FILE_WRITE=true.",
      },
      { status: 403 },
    );
  }

  const { fileKey } = await context.params;
  const key = fileKey?.trim() ?? "";
  if (!isAdminRepoFileKey(key)) {
    return NextResponse.json({ error: "unknown file key" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || typeof (body as { content?: unknown }).content !== "string") {
    return NextResponse.json({ error: "content (string) required" }, { status: 400 });
  }

  const result = await writeAdminRepoFile(key, (body as { content: string }).content);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, key });
}
