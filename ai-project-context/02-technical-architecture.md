# 02 · 技术架构（Technical Architecture）

> 让接手者快速理解仓库的代码组织、运行方式与外部依赖。
> 来源：`package.json`、`next.config.ts`、`tsconfig.json`、`Dockerfile`、`src/` 实际代码、`docs/project-overview.md`。

---

## 1. 技术栈速查

| 层级 | 选型 | 关键文件 |
|------|------|----------|
| 框架 | Next.js 16.2.4（App Router、`output: "standalone"`） | `next.config.ts` |
| UI | React 19.2.4 | — |
| 类型 | TypeScript 5（`strict` 在 `tsconfig.json`） | `tsconfig.json` |
| i18n | `next-intl` 4.9.1，`["zh","ja"]`，default `zh` | `src/i18n/routing.ts`、`src/i18n/request.ts`、`src/i18n/navigation.ts`、`src/proxy.ts` |
| MDX | `next-mdx-remote` 6 + `gray-matter` 4 + `remark-gfm` + `react-markdown` | `src/lib/content.ts`、`src/components/article/mdx-components.tsx` |
| 样式 | Tailwind CSS 4 + `@tailwindcss/typography` | `src/app/globals.css`、`postcss.config.mjs` |
| 校验 | Zod 4 | `src/lib/schemas.ts` |
| DB | PostgreSQL（npm 包 `postgres` 3.4.7） | `src/lib/db.ts` |
| 测试 | Vitest 3（`vitest.config.ts`）、Playwright 1.55（`playwright.config.ts`） | — |
| Lint | ESLint 9 + `eslint-config-next` | `eslint.config.mjs` |
| Python | Python 3（容器中通过 `apk add python3` 安装；脚本侧调用 `python3 scripts/geo_principles_audit.py`） | `Dockerfile`、`scripts/run-python-script.mjs`、`scripts/*.py` |

**Node 引擎要求**：`>= 20.9.0`（`package.json` `engines`）。

---

## 2. 顶层目录结构

```text
kibouFlow/
├── AGENTS.md                # 项目级 agent 规范（CLAUDE.md 通过 @AGENTS.md 引用）
├── CLAUDE.md                # 仅有 `@AGENTS.md` 一行
├── README.md
├── Dockerfile               # 多阶段；runner 含 python3
├── docker-compose.yml
├── deploy.sh
├── next.config.ts           # next-intl plugin、standalone、turbopack root
├── playwright.config.ts
├── vitest.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── package.json / package-lock.json
├── .env / .env.example
├── content/
│   ├── zh/{problems,paths,boundaries,cases}/*.mdx
│   └── ja/{problems,paths,boundaries,cases}/*.mdx
├── docs/                    # 项目文档体系（geo / 测试 / harness / sop / 操作手册）
├── public/                  # 静态资源
├── scripts/                 # Node / Python / Shell 脚本（harness 验证、GEO 体检、内容审计）
├── supabase/migrations/     # PostgreSQL 建表 SQL（命名沿用 supabase 但已无 RLS）
│   └── 001_init.sql ... 008_geo_audit_decisions_enrich.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── opengraph-image.tsx
│   │   ├── not-found.tsx
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   ├── llms.txt/route.ts
│   │   ├── llms-full.txt/route.ts
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          # NextIntlClientProvider + Header/Footer + WebSiteJsonLd
│   │   │   ├── page.tsx            # 首页
│   │   │   ├── faq/page.tsx
│   │   │   ├── guides/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [category]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [slug]/page.tsx
│   │   │   ├── trial/{page.tsx,success/page.tsx}
│   │   │   ├── partner/{page.tsx,success/page.tsx}
│   │   │   └── admin/
│   │   │       ├── login/page.tsx
│   │   │       ├── geo/                   # 旧路径，重定向到 geo-audit
│   │   │       └── geo-audit/
│   │   │           ├── layout.tsx
│   │   │           ├── page.tsx           # 总览（最近一次成功体检 + diff + issues）
│   │   │           ├── run/page.tsx
│   │   │           ├── history/{page.tsx,[id]/page.tsx}
│   │   │           ├── issues/...
│   │   │           ├── decisions/...
│   │   │           ├── standards/...
│   │   │           ├── validation/...
│   │   │           └── fix/...
│   │   └── api/
│   │       ├── trial/route.ts
│   │       ├── partner/route.ts
│   │       ├── track/route.ts
│   │       └── admin/
│   │           ├── login/route.ts
│   │           ├── logout/route.ts
│   │           ├── session/route.ts
│   │           └── geo-audit/
│   │               ├── run/route.ts
│   │               └── history/{route.ts,[id]/route.ts}
│   ├── components/
│   │   ├── admin/      # AdminLoginForm、GeoAuditHeader、GeoAuditMarkdown、GeoAuditRunner
│   │   ├── analytics/  # GoogleAnalytics
│   │   ├── article/    # ArticleLayout、ArticleCard、Breadcrumb、CTA、Conclusion、AudienceBlock、DecisionBlock、TableOfContents、ThreeSectionBlock、RelatedArticles、ArticleTracking、mdx-components
│   │   ├── faq/        # FAQAccordion、FAQQuestionGroup
│   │   ├── forms/      # TrialForm、PartnerForm
│   │   ├── home/       # Hero / Problem / Value / Flow / Audience / GuidesPreview Sections
│   │   ├── layout/     # Header、Footer、CTAButtons、LanguageSwitcher
│   │   ├── seo/        # ArticleJsonLd、BreadcrumbJsonLd、DefinedTermJsonLd、FAQPageJsonLd、HowToJsonLd、JsonLd、OrganizationJsonLd、WebSiteJsonLd
│   │   ├── shared/     # Section
│   │   └── tracking/   # TrackingProvider
│   ├── i18n/           # routing / request / navigation
│   ├── lib/            # 见下方 §4
│   ├── messages/       # next-intl 文案 zh.json / ja.json
│   └── proxy.ts        # next-intl middleware（matcher: ['/', '/(zh|ja)/:path*']）
└── tests/
    ├── setup.ts
    ├── unit/           # 25 个单元测试
    ├── integration/    # 11 个 API 路由 / 抽取器 / Markdown 集成测试
    └── e2e/            # 7 个 Playwright spec
```

---

## 3. 前端架构

- **路由**：`src/app/[locale]/...`，所有用户路径必须带 `zh` 或 `ja` 前缀；`src/proxy.ts` 是 `next-intl` 中间件。
- **布局**：`src/app/layout.tsx` 是 root（极简）；`src/app/[locale]/layout.tsx` 是 locale 布局，挂 `NextIntlClientProvider`、`TrackingProvider`、`Header` / `Footer` / `WebSiteJsonLd`、`GoogleAnalytics`。
- **数据获取**：服务端组件直接调用 `src/lib/content.ts` 读 MDX；admin 页同样在 server component 中查 PG。
- **客户端组件**：仅在必要点（表单、`TrackingProvider`、`AdminLoginForm`、`GeoAuditRunner` 等）`"use client"`。表单使用受控 input + fetch POST + UTM/locale 自动注入。
- **MDX 渲染**：`<MDXRemote source={...} components={getMDXComponents(locale)} />`，自定义组件包括 `ArticleLayout`、`AudienceBlock`、`DecisionBlock`、`ThreeSectionBlock`、`Breadcrumb`、`TableOfContents`。
- **国际化**：`getTranslations({ locale, namespace })`，namespace 文案在 `src/messages/zh.json` / `src/messages/ja.json`。

---

## 4. `src/lib` 模块职责

| 模块 | 职责 |
|------|------|
| `content.ts` | 读 `content/{locale}` MDX、定义 frontmatter 类型、列表 / 详情 / 派生（`getStrategicRelatedArticles`、`getClusterEntry`）、规范化 frontmatter，输出 `getArticleMarkdown` 给 LLM 友好版 |
| `article-anchors.ts` | `slugifyHeading` 生成锚点 ID |
| `db.ts` | 全局复用一个 `postgres.Sql`；提供 `getPg`、`isPgConfigured`、`getMissingDatabaseEnv` |
| `pg-data.ts` | 写入 `trial_submissions` / `partner_submissions` / `tracking_events` |
| `pg-errors.ts` | 数据库错误归类 |
| `schemas.ts` | 所有 Zod schema（trial / partner / GEO 配置 / GEO 规则 / GEO toggles / GEO 发布流） |
| `rate-limit.ts` | 内存限流：10 分钟 3 次 / IP |
| `admin-session.ts` | HMAC-SHA256 签名的 admin session token；提供 `signAdminSession` / `verifyAdminSession` / `getAdminSecrets` |
| `require-admin-api.ts` | 在 API 路由开头校验会话 cookie |
| `geo-settings.ts` | 读 `geo_site_settings` / `geo_page_settings`，输出 `resolveGeoMetadata`、`mergeJsonLd` |
| `geo-rules.ts` | 读 `geo_rules` / `geo_schema_toggles`、`compilePatterns`、`getGeoRules`、`getGeoSchemaToggles` |
| `geo-audit-runs.ts` | `geo_audit_runs` CRUD：插入运行、更新结果、序列化 report_json、列出最近成功 |
| `geo-audit-issues.ts` | `geo_audit_issues` CRUD + `normalizeIssueInputs` |
| `geo-audit-scores.ts` | 从体检 JSON 提取五维分数 |
| `geo-audit-report-markdown.ts` | 渲染 Markdown 报告 |
| `geo-principles-audit-runner.ts` | 子进程调用 `python3 scripts/geo_principles_audit.py` 并解析 stdout |
| `faq-extractor.ts` | 从 MDX 文本抽 FAQ pair |
| `howto-extractor.ts` | 从 MDX 文本抽 HowTo step |
| `tracking.ts` | 客户端 `sendBeacon`/`fetch` 发送埋点 |
| `tracking-events.ts` | 表单事件名约定（`resolveFormEventName`） |
| `utm.ts` | 读 / 解析 UTM 参数 |
| `seo/site-url.ts` | 取站点根 URL（默认 `https://kibouflow.com`） |
| `seo/breadcrumbs.ts` | `buildBreadcrumbItems` 返回 BreadcrumbJsonLd 输入 |
| `seo/strip-undefined.ts` | JSON-LD 输出前清理 undefined |

---

## 5. API 设计

| 路由 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/api/trial` | POST | 公开 + 限流 | Zod 校验后写 `trial_submissions`；DB 缺失返回 503 |
| `/api/partner` | POST | 公开 + 限流 | Zod 校验后写 `partner_submissions` |
| `/api/track` | POST | 公开（无校验） | 写 `tracking_events`；任何错误都返回 200 `{ ok: true }` 不阻塞前端 |
| `/api/admin/login` | POST | 比对密码 | 返回 `Set-Cookie: geo_admin_session=...` |
| `/api/admin/logout` | POST | session | 清 cookie |
| `/api/admin/session` | GET | session | 当前会话状态 |
| `/api/admin/geo-audit/run` | POST | session + 限流 | spawn `python3 scripts/geo_principles_audit.py`，结果落 `geo_audit_runs` + `geo_audit_issues` |
| `/api/admin/geo-audit/history` | GET | session | 历史列表 |
| `/api/admin/geo-audit/history/[id]` | GET | session | 单次详情 |

API 错误约定：

- 400：请求体 / Zod 校验失败
- 401 / 403：未登录或会话无效（admin 路由）
- 429：触发限流
- 503：DB 未配置导致无法写入
- 500：插入失败 / 脚本执行失败

---

## 6. 数据模型（PostgreSQL）

按 `supabase/migrations/00X_*.sql` 顺序执行：

1. `001_init.sql`：`trial_submissions`、`partner_submissions`、`tracking_events`、相关索引
2. `002_geo_settings.sql`：`geo_site_settings`、`geo_page_settings`
3. `003_geo_rules_and_toggles.sql`：`geo_rules`、`geo_schema_toggles`
4. `004_geo_ops_phase3.sql`：发布草稿 / 角色相关
5. `005_geo_audit_runs.sql`：`geo_audit_runs`（含五维分数列、Markdown / JSON 报告列）
6. `006_geo_audit_issues.sql`：`geo_audit_issues`
7. `007_geo_audit_decisions.sql`：`geo_audit_decisions`
8. `008_geo_audit_decisions_enrich.sql`：决定表字段扩展

> 命名空间是 `supabase/`，但实际部署到任意 PostgreSQL 上都可用，**不依赖 Supabase 客户端、不依赖 RLS**。

---

## 7. 状态管理与数据流

- 几乎所有页面是 server component，没有客户端全局 store；状态通过 URL（locale / category / slug）+ DB（GEO 配置 / 体检结果）+ MDX 文件三处共存。
- 客户端只维持非常局部的状态：表单字段、admin 登录表单、GEO 体检触发按钮、Tracking provider 的 session id。
- next-intl 文案通过服务端 `getTranslations` 注入，不是 redux 风格。

---

## 8. 外部依赖

- **PostgreSQL**：通过 `DATABASE_URL` 连接。缺失时大部分 GEO 功能仍可运行（前台 metadata 走兜底，体检脚本仍可跑但不入库）。
- **OpenAI**（可选）：`GEO_AUDIT_USE_LLM=1` + `OPENAI_API_KEY` 时，`scripts/geo_principles_audit.py` 在末尾追加「LLM 归纳与建议（附录）」，模型由 `GEO_AUDIT_OPENAI_MODEL` 控制。
- **Google Analytics**：`<GoogleAnalytics />` 组件读 GA Measurement ID（具体环境变量名见组件代码）。
- **Selenium / Chromedriver**（仅本地）：`scripts/selenium_geo_admin_flow.py` 用于跑 admin 浏览器自动化。

---

## 9. 环境变量（来自 `.env.example` 与 `docs/geo-backend-operation-guide.md`）

| 变量 | 用途 | 必填？ |
|------|------|--------|
| `NEXT_PUBLIC_SITE_URL` | 站点根 URL（无尾部斜杠），用于 robots / sitemap / Organization JSON-LD | 强烈建议 |
| `NEXT_PUBLIC_ORGANIZATION_X_URL` 等 | OrganizationJsonLd `sameAs` | 可选 |
| `ADMIN_GEO_PASSWORD` | admin 登录密码 | admin 后台必填 |
| `ADMIN_SESSION_SECRET` | HMAC 签名密钥（≥32 字符） | admin 后台必填 |
| `DATABASE_URL` | PostgreSQL 连接串 | trial / partner / track / 体检历史必填，缺失则降级 |
| `SITEMAP_STATIC_LASTMOD` | 静态页 sitemap 的 `lastModified` | 可选 |
| `GEO_AUDIT_USE_LLM` + `OPENAI_API_KEY` + `GEO_AUDIT_OPENAI_MODEL` | 体检脚本接入 LLM 附录 | 可选 |
| `GEO_AUDIT_PYTHON` | 自定义 Python 路径 | 可选 |
| `GEO_AUDIT_SKIP=1` | CI 跳过真实子进程 | 可选 |

---

## 10. 启动与构建

```bash
npm install
npm run dev                # next dev --webpack，默认 http://localhost:3000

npm run build              # next build，produces .next/standalone
npm run start              # node server.js（standalone 输出）

npm run lint               # eslint
```

**测试**：

```bash
npm run test               # vitest run（unit + integration 全量）
npm run test:unit
npm run test:integration
npm run test:e2e           # playwright，启动或复用 :3000

npm run verify:local       # unit + integration + next build
npm run verify:content     # content-harness-check + content/jsonld 单元
npm run verify:seo-geo     # sitemap/llms/robots 单元/集成 + next build
npm run verify:admin-geo   # admin session + admin geo-audit 路由测试
npm run verify:flows       # E2E core-flows
npm run verify:e2e:smoke   # E2E core + geo-phase3-health + geo-rules-preview
npm run verify:publish     # content + JSON-LD + SEO 单元 + next build

npm run audit:geo:repo            # python3 scripts/geo_principles_audit.py
npm run audit:geo:repo:json       # 同上 + --json
npm run audit:seo-geo:local       # python3 scripts/seo-geo-audit.py --skip-online
npm run audit:admin:selenium      # selenium 跑 admin 浏览器主流程
npm run audit:content:baseline    # 维护 content warning baseline
npm run audit:content:diff[:strict] # 跟 baseline 比较
```

`harness:select`：交互式 CLI，问任务类型并给出对应 `verify:*` / `audit:*` 命令。

---

## 11. 测试方式（也见 `docs/testing-strategy.md`）

| 层级 | 工具 | 范围 |
|------|------|------|
| Unit | Vitest | `tests/unit/*.test.ts`（25 个），覆盖 content / schema / tracking / geo-audit / pg / sitemap / breadcrumbs / strip-undefined / utm / rate-limit / admin-session 等 |
| Integration | Vitest + mock | `tests/integration/*.test.ts`（11 个），mock `pg-data` / `rate-limit` 等，验证 API 路由行为 |
| E2E | Playwright | `tests/e2e/*.spec.ts`（7 个），覆盖核心流程、地区切换、表单提交、SEO metadata、GEO 阶段 3 健康、GEO 规则 preview |
| 体检脚本 | Python | `scripts/geo_principles_audit.py`、`scripts/seo-geo-audit.py`、`scripts/selenium_geo_admin_flow.py` |
| 内容守门 | Node 脚本 | `scripts/content-harness-check.mjs` 强制 baseline；`scripts/content-warning-{baseline,diff}.mjs` 跟踪历史 |

CI（`.github/workflows/`）：

- `content-governance.yml` — 内容护栏
- `seo-geo-governance.yml` — SEO/GEO 输出
- `admin-geo-governance.yml` — admin GEO 路由 / 会话
- `flows-governance.yml` — E2E smoke

---

## 12. 关键设计取舍

- **MDX as source of truth**：所有内容字段最终都从 MDX frontmatter 派生；DB 的 `geo_*` 表只覆盖元数据 / 规则 / 体检，不存正文。
- **`next-intl` middleware 文件叫 `proxy.ts`**：是仓库自定义命名（不是 Next.js 默认的 `middleware.ts`），保持注意。
- **DB 缺失要降级而非崩溃**：`AGENTS.md` 第 7E 节明确，前台与后台都必须保留「未配置 DATABASE_URL 时仍能渲染 / 运行体检但不入库」的行为。
- **frontmatter 兜底优于在 UI 里硬补**：`AGENTS.md` 第 4 节「Content Editing Chapter」要求 UI 不得替代源数据。
- **Migration 不可乱排**：`AGENTS.md` 第 5、7E 节明确不得改老 migration 顺序。

---

*以上是一张速读地图。任何模块改动前，回去读对应文件本体而不是只信本文件。*
