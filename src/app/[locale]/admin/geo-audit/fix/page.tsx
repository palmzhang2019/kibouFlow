import { redirect } from "next/navigation";
import { getGeoAuditIssueById } from "@/lib/geo-audit-issues";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ issueId?: string }>;

export default async function GeoAuditFixPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const issueId = sp.issueId ?? "";
  const issue = await getGeoAuditIssueById(issueId);

  redirect(issue ? `/admin/geo-audit/history/${issue.run_id}` : "/admin/geo-audit/history");
}
