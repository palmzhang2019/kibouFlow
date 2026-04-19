import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function GeoAuditStandardsPage() {
  redirect("/admin/geo-audit");
}
