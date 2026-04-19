import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function GeoAuditValidationPage() {
  redirect("/admin/geo-audit/run");
}
