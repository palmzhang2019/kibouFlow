import { Link } from "@/i18n/navigation";
import { listAdminRepoFileDescriptors } from "@/lib/admin-repo-files";

export const dynamic = "force-dynamic";

export default function GeoAuditFixIndexPage() {
  const files = listAdminRepoFileDescriptors();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">源码修复</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          在后台直接打开并保存白名单内的源码文件，用于处理体检报告中的可落点问题（sitemap、JSON-LD、robots 等）。
        </p>
      </div>
      <ul className="space-y-2 text-sm">
        {files.map((f) => (
          <li key={f.key}>
            <Link href={`/admin/geo-audit/fix/${f.key}`} className="font-medium text-primary underline">
              {f.label}
            </Link>
            <span className="ml-2 text-muted-foreground">({f.relativePath})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
