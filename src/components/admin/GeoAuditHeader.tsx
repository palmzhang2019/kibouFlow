"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";

function navButtonClass(active: boolean) {
  return active
    ? "rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium"
    : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground";
}

export function GeoAuditHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const onDashboard = /\/admin\/geo-audit$/.test(pathname);
  const onRun = pathname.includes("/admin/geo-audit/run");
  const onIssues = pathname.includes("/admin/geo-audit/issues");
  const onHistory = pathname.includes("/admin/geo-audit/history");
  const onDecisions = pathname.includes("/admin/geo-audit/decisions");
  const onValidation = pathname.includes("/admin/geo-audit/validation");
  const onStandards = pathname.includes("/admin/geo-audit/standards");
  const onFix = pathname.includes("/admin/geo-audit/fix");

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <h1 className="text-xl font-bold tracking-tight">GEO 治理后台</h1>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/admin/geo-audit" className={navButtonClass(onDashboard)}>
          总览
        </Link>
        <Link href="/admin/geo-audit/run" className={navButtonClass(onRun)}>
          运行体检
        </Link>
        <Link href="/admin/geo-audit/issues" className={navButtonClass(onIssues)}>
          问题
        </Link>
        <Link href="/admin/geo-audit/history" className={navButtonClass(onHistory)}>
          历史
        </Link>
        <Link href="/admin/geo-audit/decisions" className={navButtonClass(onDecisions)}>
          决策
        </Link>
        <Link href="/admin/geo-audit/validation" className={navButtonClass(onValidation)}>
          验证
        </Link>
        <Link href="/admin/geo-audit/standards" className={navButtonClass(onStandards)}>
          标准
        </Link>
        <Link href="/admin/geo-audit/fix" className={navButtonClass(onFix)}>
          源码修复
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
