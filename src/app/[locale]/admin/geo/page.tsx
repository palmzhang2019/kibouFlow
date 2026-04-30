import { notFound, redirect } from "next/navigation";
import { isAdminUiLocale } from "@/lib/admin-locale";

export default async function LegacyGeoAdminRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAdminUiLocale(locale)) {
    notFound();
  }

  redirect(`/${locale}/admin/geo-audit`);
}
