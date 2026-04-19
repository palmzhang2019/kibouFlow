import type { AdminRepoFileKey } from "@/lib/admin-repo-files";

export type IssueRemediation = {
  fileKey: AdminRepoFileKey;
  /** 给操作者的简短指引 */
  hint: string;
};

/** 体检问题代码 → 可在后台直接编辑的仓库文件（白名单） */
export function remediationForIssueCode(code: string): IssueRemediation | null {
  switch (code.trim()) {
    // 仓库级聚合问题：跳转到体检历史详情查看分数/内容详情，不走单文件 fix 路径
    case "SCORE_PRINCIPLE_BELOW_THRESHOLD":
      return {
        fileKey: "__history__" as AdminRepoFileKey,
        hint: "该问题为多维度分数汇总型，请点击「处理」前往本次体检历史详情查看各维度分数与根因。",
      };
    case "CONTENT_TLDR_COVERAGE_ZERO":
      return {
        fileKey: "__history__" as AdminRepoFileKey,
        hint: "该问题为仓库级内容问题，请点击「处理」前往本次体检历史详情查看 MDX 覆盖详情与批量修复指引。",
      };
    case "SITE_SITEMAP_FAKE_LASTMOD":
      return {
        fileKey: "sitemap",
        hint: "静态路由建议不要用每次请求刷新的 `new Date()` 作为 lastModified；可改为固定站点级日期、构建时间或省略该字段（文章 URL 仍可用 frontmatter 日期）。",
      };
    case "TEMPLATE_ARTICLE_AUTHOR_ORGANIZATION_ONLY":
    case "TEMPLATE_ARTICLE_ABOUT_MISSING":
      return {
        fileKey: "article-jsonld",
        hint: "在 `ArticleJsonLd` 中把 `author` 从 Organization 调整为 Person（并补 url / sameAs 等），或增加 `about` 等字段；保存后重新跑体检验证。",
      };
    case "TEMPLATE_DEFINED_TERM_MISSING":
      return {
        fileKey: "defined-term-jsonld",
        hint: "补充 `DefinedTermJsonLd` 组件，供术语/定义类页面输出 `DefinedTerm` 结构化数据；如页面路由尚未落地，可先在该文件中搭建基础组件骨架。",
      };
    case "SITE_ORG_SAMEAS_SPARSE":
      return {
        fileKey: "organization-jsonld",
        hint: "扩充 `OrganizationJsonLd` 中 `sameAs`（含稳定外部实体链接）；保存后复检。",
      };
    case "SITE_ROBOTS_MISSING":
    case "SITE_ROBOTS_AI_CRAWLERS_INCOMPLETE":
      return {
        fileKey: "robots",
        hint: "在 `src/app/robots.ts` 中补齐 robots 与常见 AI 爬虫规则；保存后复检。",
      };
    default:
      return null;
  }
}
