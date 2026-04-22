import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GeoAuditHeader } from "@/components/admin/GeoAuditHeader";
import {
  GEO_ADMIN_SESSION_COOKIE,
  getAdminSecrets,
  verifyAdminSession,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function GeoAuditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const secrets = getAdminSecrets();
  if (!secrets) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">kibouFlow 后台</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          未配置 <code className="rounded bg-muted px-1">ADMIN_GEO_PASSWORD</code> /{" "}
          <code className="rounded bg-muted px-1">ADMIN_SESSION_SECRET</code>，无法使用登录与体检功能。
        </p>
      </div>
    );
  }

  const jar = await cookies();
  const token = jar.get(GEO_ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(secrets.sessionSecret, token)) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <GeoAuditHeader />
      <main className="mt-8">{children}</main>
    </div>
  );
}
