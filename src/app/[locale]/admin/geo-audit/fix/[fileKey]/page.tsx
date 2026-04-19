import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { RepoFileEditor } from "@/components/admin/RepoFileEditor";
import { adminRepoFileLabel, isAdminRepoFileKey, listAdminRepoFileDescriptors } from "@/lib/admin-repo-files";

export const dynamic = "force-dynamic";

export default async function GeoAuditFixFilePage({ params }: { params: Promise<{ fileKey: string }> }) {
  const { fileKey } = await params;
  const key = fileKey?.trim() ?? "";
  if (!isAdminRepoFileKey(key)) notFound();

  const meta = listAdminRepoFileDescriptors().find((x) => x.key === key)!;

  return (
    <div className="space-y-6">
      <Link href="/admin/geo-audit/fix" className="text-sm text-primary underline">
        ← 返回源码修复列表
      </Link>
      <RepoFileEditor fileKey={key} title={adminRepoFileLabel(key)} relativePath={meta.relativePath} />
    </div>
  );
}
