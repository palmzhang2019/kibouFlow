import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

const STANDARDS = [
  "页面模板标准（一页一主题、稳定 slug）",
  "内容结构块标准（TL;DR、结论段、H2 小节结论）",
  "作者/审校归因标准（Person / Organization 与 sameAs）",
  "suitableFor / notSuitableFor 与正文锚点一致",
  "引用来源与结论边界",
  "sitemap / lastmod 更新时间来源可信度",
  "中日双语对齐（标题、结论、FAQ、schema）",
  "FAQ / HowTo / Breadcrumb 与正文一致性",
];

export default function GeoAuditStandardsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">规则 / 标准中心（只读）</h2>
      <p className="text-sm text-muted-foreground">
        以下为计划沉淀的受控标准类型，后续可与仓库校验脚本、发布前检查共用同一规则源。
      </p>
      <ol className="list-inside list-decimal space-y-2 text-sm">
        {STANDARDS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <Link href="/admin/geo-audit" className="text-sm text-primary underline">
        返回总览
      </Link>
    </div>
  );
}
