import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import {
  GEO_ADMIN_SESSION_COOKIE,
  getAdminSecrets,
  verifyAdminSession,
} from "@/lib/admin-session";
import { isAdminUiLocale } from "@/lib/admin-locale";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAdminUiLocale(locale)) {
    notFound();
  }

  const secrets = getAdminSecrets();
  if (!secrets) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          后台未配置：请设置环境变量 <code className="rounded bg-amber-100 px-1">ADMIN_GEO_PASSWORD</code> 与{" "}
          <code className="rounded bg-amber-100 px-1">ADMIN_SESSION_SECRET</code>。
        </div>
      </div>
    );
  }

  const jar = await cookies();
  const token = jar.get(GEO_ADMIN_SESSION_COOKIE)?.value;
  if (verifyAdminSession(secrets.sessionSecret, token)) {
    redirect(`/${locale}/admin/geo-audit`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <AdminLoginForm />
    </div>
  );
}
