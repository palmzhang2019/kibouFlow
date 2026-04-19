import { redirect } from "next/navigation";
import { getGeoAuditIssueById } from "@/lib/geo-audit-issues";

export const dynamic = "force-dynamic";

export default async function GeoAuditIssueDetailPage({
  params,
}: {
  params: Promise<{ locale: string; issueId: string }>;
}) {
  const { issueId } = await params;
  const issue = await getGeoAuditIssueById(issueId);

  redirect(issue ? `/admin/geo-audit/history/${issue.run_id}` : "/admin/geo-audit/history");
}
