import fs from "node:fs/promises";
import path from "node:path";

/** 与 URL 段 `/admin/geo-audit/fix/[fileKey]` 一致；仅允许白名单内相对仓库根的路径 */
export const ADMIN_REPO_FILE_KEYS = [
  "sitemap",
  "article-jsonld",
  "defined-term-jsonld",
  "organization-jsonld",
  "robots",
] as const;

export type AdminRepoFileKey = (typeof ADMIN_REPO_FILE_KEYS)[number];

const RELATIVE_PATHS: Record<AdminRepoFileKey, string> = {
  sitemap: "src/app/sitemap.ts",
  "article-jsonld": "src/components/seo/ArticleJsonLd.tsx",
  "defined-term-jsonld": "src/components/seo/DefinedTermJsonLd.tsx",
  "organization-jsonld": "src/components/seo/OrganizationJsonLd.tsx",
  robots: "src/app/robots.ts",
};

const LABELS: Record<AdminRepoFileKey, string> = {
  sitemap: "Sitemap（src/app/sitemap.ts）",
  "article-jsonld": "Article JSON-LD（ArticleJsonLd.tsx）",
  "defined-term-jsonld": "DefinedTerm JSON-LD（DefinedTermJsonLd.tsx）",
  "organization-jsonld": "Organization JSON-LD（OrganizationJsonLd.tsx）",
  robots: "robots.txt 策略（src/app/robots.ts）",
};

export function isAdminRepoFileKey(v: string): v is AdminRepoFileKey {
  return (ADMIN_REPO_FILE_KEYS as readonly string[]).includes(v);
}

export function listAdminRepoFileDescriptors(): { key: AdminRepoFileKey; label: string; relativePath: string }[] {
  return ADMIN_REPO_FILE_KEYS.map((key) => ({
    key,
    label: LABELS[key],
    relativePath: RELATIVE_PATHS[key],
  }));
}

function repoRoot(): string {
  return path.resolve(process.cwd());
}

/** 将 fileKey 解析为绝对路径；若越权或未知则返回 null */
export function resolveAdminRepoFilePath(fileKey: string): string | null {
  if (!isAdminRepoFileKey(fileKey)) return null;
  const root = repoRoot();
  const rel = RELATIVE_PATHS[fileKey];
  const full = path.resolve(root, rel);
  const relFromRoot = path.relative(root, full);
  if (relFromRoot.startsWith("..") || path.isAbsolute(relFromRoot)) return null;
  return full;
}

export function adminRepoFileLabel(key: AdminRepoFileKey): string {
  return LABELS[key];
}

export async function readAdminRepoFile(fileKey: string): Promise<{ path: string; content: string } | null> {
  const abs = resolveAdminRepoFilePath(fileKey);
  if (!abs) return null;
  try {
    const content = await fs.readFile(abs, "utf8");
    return { path: abs, content };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      // Allow first-time creation for whitelisted targets from the admin editor.
      return { path: abs, content: "" };
    }
    return null;
  }
}

const MAX_BYTES = 512 * 1024;

export async function writeAdminRepoFile(fileKey: string, content: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const abs = resolveAdminRepoFilePath(fileKey);
  if (!abs) return { ok: false, error: "invalid file key" };
  const buf = Buffer.from(content, "utf8");
  if (buf.length > MAX_BYTES) {
    return { ok: false, error: `content exceeds ${MAX_BYTES} bytes` };
  }
  try {
    await fs.writeFile(abs, content, "utf8");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "write failed";
    return { ok: false, error: msg };
  }
}

/** 生产环境默认禁止写盘；自托管可显式开启 */
export function isAdminRepoFileWriteAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const v = process.env.ADMIN_ENABLE_REPO_FILE_WRITE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
