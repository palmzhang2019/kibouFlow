# 00 · 项目总览（Project Overview）

> 本文件让一个完全没看过仓库的人，读完就能知道 kibouFlow 大概是什么、用什么技术、当前在哪个阶段。
> 来源：仓库根目录 `README.md`、`AGENTS.md`、`docs/project-overview.md`、`package.json`、`Dockerfile`、`src/` 实际代码。

---

## 1. 项目名称

**kibouFlow**（包名 `kibou-flow`，`package.json` v0.1.0，`private: true`）

## 2. 一句话说明

面向「在日本发展但方向不清」的人群的中日双语（zh/ja）内容与转化站点，基于 Next.js 16 App Router 构建，自带一套面向「生成式搜索（GEO）+ 传统 SEO」的站点结构化输出能力，以及一个用于 GEO 仓库自检的极简管理后台。

## 3. 项目主要目标

按 `AGENTS.md` 第 2 节「Success Criteria」与 `docs/geo-strategy.md` 第 1 节「核心原则」综合：

1. **整理 → 判断 → 行动**：先帮用户整理希望/方向，再呈现路径判断，再把用户导向 `trial`（个人试用）或 `partner`（机构合作）转化。
2. **被搜索引擎和大模型同时发现并理解**：对 GEO 友好的内容结构（TL;DR、suitableFor、下一步建议、FAQ/HowTo/Article JSON-LD、`llms.txt` / `llms-full.txt` / `sitemap.xml`）。
3. **保持双语等价**：`zh` / `ja` 路径同时在线，不能因为一边的小改动悄悄破坏另一边。
4. **可治理**：通过 admin GEO 体检后台（Python 脚本 `scripts/geo_principles_audit.py`）持续做仓库级结构性检查，把发现的问题落库或落 Markdown。

## 4. 项目解决的问题

`src/app/llms.txt/route.ts` 中对站点的英文一句话定位：

> kibouFlow is a support platform for people whose direction is unclear when considering development in Japan. It helps users sort out their current situation, then evaluate their options, and finally take action.

具体解决的痛点：

- 在日本读书 / 工作 / 找工作的人在「日语 vs 简历 vs 投递时机 vs 是否要中介」上反复纠结，没有一站式判断框架。
- 对于运营方而言，需要让中日两类人都能发现内容并完成转化（trial 试用、partner 合作）。
- 同时希望让 ChatGPT / Perplexity / Google AI Overviews / Bing Copilot 等生成式搜索能引用站点内容，所以 GEO 不是事后 SEO，而是写作约束 + 工程约束。

## 5. 目标用户 / 使用场景

| 用户 | 场景 |
|------|------|
| 希望在日发展、还没确定方向的个人（`audience: individual`） | 阅读 `/zh/guides`、`/ja/guides` 中的判断框架与案例库，最终通过 `/trial` 提交联系方式 |
| 希望与 kibouFlow 合作的机构（`audience: partner`） | 走 `/partner` 流程提交合作意向 |
| 站点运营 / 内容编辑 | 通过 `/{locale}/admin/geo-audit` 做仓库 GEO 体检；通过 `npm run verify:*` / `npm run audit:*` 在本地做改动验证 |
| 生成式搜索 / LLM 爬虫 | 通过 `/llms.txt`、`/llms-full.txt`、`/sitemap.xml`、`/robots.txt`、JSON-LD 摄入站点 |

## 6. 当前项目状态

来源：`README.md` 顶部、`docs/project-overview.md`、`docs/geo-implementation-phases.md`、`docs/content-warning-remediation-plan.md`、`AGENTS.md`。

- **业务功能层**：`trial` / `partner` 表单、`tracking` 埋点、`guides` 文章详情、首页都已实现并被 E2E 覆盖（`tests/e2e/core-flows.spec.ts`）。
- **GEO/SEO 层**：sitemap、robots、`llms.txt` / `llms-full.txt`、Article / FAQPage / HowTo / Breadcrumb / WebSite / Organization / DefinedTerm 等 JSON-LD 都已落地。
- **内容层**：当前是 README 描述的「**GEO 阶段 3（MVP）**」状态，覆盖 4 个 cluster、若干 problems / paths / boundaries / cases / faq / framework / concept / cluster 文章。`docs/content-warning-remediation-plan.md` 显示 2026-04-25 时点 `totalWarnings: 0`，48 篇 MDX 100% 双语配对。
- **后台层**：`/admin/login` + `/admin/geo-audit/*`（含 history 列表、history 详情）已可用；`DATABASE_URL` 缺失时仍能运行体检但不落库。
- **测试 / Harness 层**：单元 / 集成 / E2E + Python 体检 + `harness:select` CLI + 4 条 GitHub Actions（content / SEO/GEO / admin GEO / flows）。
- **部署形态**：`Dockerfile` 多阶段构建，runner 含 `python3` 以执行 GEO 体检脚本；`next.config.ts` 走 `standalone`。

## 7. 技术栈概览

| 领域 | 选型 | 来源 |
|------|------|------|
| 框架 | Next.js 16.2.4（App Router） | `package.json` |
| UI | React 19.2.4 | `package.json` |
| 语言 | TypeScript 5 | `tsconfig.json` |
| 国际化 | `next-intl` 4.9.1，`locales: ["zh","ja"]`，`defaultLocale: "zh"` | `src/i18n/routing.ts`, `src/proxy.ts` |
| 内容 | MDX + `gray-matter` + `next-mdx-remote` 6 + `react-markdown` + `remark-gfm` | `package.json`, `src/lib/content.ts` |
| 校验 | Zod 4 | `src/lib/schemas.ts` |
| 数据库 | PostgreSQL（npm 包 `postgres` 3.4.7），通过 `DATABASE_URL` 连接 | `src/lib/db.ts` |
| 样式 | Tailwind CSS 4 + `@tailwindcss/typography` | `package.json`, `src/app/globals.css` |
| 测试 | Vitest 3、Playwright 1.55 | `vitest.config.ts`, `playwright.config.ts` |
| Lint | ESLint 9 + `eslint-config-next` | `eslint.config.mjs` |
| 体检脚本 | Python 3（容器内）、Selenium（可选 admin E2E） | `Dockerfile`, `scripts/*.py` |
| Node 运行时 | Node `>= 20.9.0` | `package.json` `engines` |

## 8. 前端 / 后端 / 数据库 / 部署

- **前端**：Next.js App Router，所有用户路径在 `src/app/[locale]/...`；中间件 `src/proxy.ts` 用 `next-intl/middleware`；UI 组件在 `src/components/{home,article,layout,forms,seo,admin,faq,tracking,analytics,shared}`。
- **后端**：Next.js Route Handlers，位于 `src/app/api/...`；同进程内同步访问 PostgreSQL（`postgres.js` 客户端，`src/lib/db.ts` 全局复用一个 `Sql`）。
- **数据库**：PostgreSQL（自托管）。建表 SQL 在 `supabase/migrations/001` ~ `008`，按文件名序号执行；表覆盖：`trial_submissions`、`partner_submissions`、`tracking_events`、`geo_site_settings`、`geo_page_settings`、`geo_rules`、`geo_schema_toggles`、`geo_audit_runs`、`geo_audit_issues`、`geo_audit_decisions` 等。**该目录命名为 `supabase/`，但代码中已不再依赖 Supabase SDK / RLS。**
- **部署**：`Dockerfile` 多阶段构建，runner 端 `apk add python3` 以支持 GEO 体检脚本；`next.config.ts` 配置 `output: "standalone"`；CI 见 `.github/workflows/{content,seo-geo,admin-geo,flows}-governance.yml`。

## 9. 项目中最重要的 5～10 个文件 / 目录

按对项目可玩性、改动风险与可见性综合排序（详见 `04-important-files.md`）：

1. `AGENTS.md` — 项目级 agent 行为约束、protected areas、playbooks。
2. `src/lib/content.ts` — 内容模型（CATEGORIES / CONTENT_TYPES / CLUSTERS）和 frontmatter 规范化逻辑；几乎所有列表页和 SEO/GEO 输出都依赖它。
3. `src/app/[locale]/guides/[category]/[slug]/page.tsx` — 单篇 MDX 文章页，串联 metadata、Article/FAQ/HowTo JSON-LD、相关文章、cluster entry。
4. `src/app/sitemap.ts` / `src/app/robots.ts` / `src/app/llms.txt/route.ts` / `src/app/llms-full.txt/route.ts` — GEO/SEO 输出入口。
5. `src/lib/schemas.ts` — 所有 Zod schema（trial / partner / GEO 配置）。
6. `src/lib/geo-settings.ts` + `src/lib/geo-rules.ts` — 数据库驱动的页面元数据 / 规则覆盖逻辑（`resolveGeoMetadata`、`getGeoSchemaToggles`）。
7. `src/lib/admin-session.ts` + `src/lib/require-admin-api.ts` — 管理后台会话签名与 API 鉴权。
8. `scripts/geo_principles_audit.py` + `src/lib/geo-principles-audit-runner.ts` + `src/app/api/admin/geo-audit/run/route.ts` — GEO 五原理体检主链路。
9. `content/zh/**` 与 `content/ja/**` — 内容源。所有列表 / 详情 / 索引都从这里读 MDX。
10. `docs/`（重点：`project-overview.md`、`harness-operating-guide.md`、`new-post-sop.md`、`testing-strategy.md`、`geo-principles.md`、`geo-strategy.md`、`geo-implementation-phases.md`、`geo-backend-operation-guide.md`、`manual-exploratory-checklist.md`） — 文档体系，是项目「为什么这么做」的源头。

---

*生成时间：2026-04-27。事实以源码为准；如与文档冲突优先看源码。*
