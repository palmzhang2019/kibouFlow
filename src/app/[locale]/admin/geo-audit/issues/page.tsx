import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function GeoAuditIssuesPage() {
  redirect("/admin/geo-audit/history");
}
