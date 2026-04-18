"use client";

import { Link, useRouter } from "@/i18n/navigation";

export function GeoAuditHeader() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <h1 className="text-xl font-bold tracking-tight">GEO 体检后台</h1>
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/geo-audit"
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          主页
        </Link>
        <Link
          href="/admin/geo-audit/history"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium"
        >
          历史记录
        </Link>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm"
          onClick={() => void logout()}
        >
          退出登录
        </button>
      </nav>
    </header>
  );
}
