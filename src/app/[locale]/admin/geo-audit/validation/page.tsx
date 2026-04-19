import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default function GeoAuditValidationHubPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">验证与复检中心</h2>
      <p className="text-sm text-muted-foreground">
        规划能力：规则扫描结果确认、人工抽检清单、修复执行留痕、复检对比与问题回流。当前仅占位，闭环将在后续迭代接入同一套登录与体检运行链路。
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/geo-audit/run" className="text-primary underline">
          发起复检（运行体检）
        </Link>
        <Link href="/admin/geo-audit/history" className="text-primary underline">
          历史记录
        </Link>
      </div>
    </div>
  );
}
