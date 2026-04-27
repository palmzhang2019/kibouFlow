# 04 · 重要文件清单（Important Files）

> 帮接手者识别仓库的「枢纽文件」：哪些一改就影响整个站点、哪些是隐式约定、哪些是验证入口。
> 排序大致按「改动后影响半径」递减。

---

## 入口与配置

### `AGENTS.md`

**作用**：项目级 agent 行为约束 + 内容编辑 / Admin GEO playbooks + 不能乱碰的 protected areas。被 `CLAUDE.md` 通过 `@AGENTS.md` 引用。

**为什么重要**：**这是其它 agent 和未来工程师阅读优先级最高的文档**。它列出 Success Criteria、forbidden moves、verify 矩阵。

**修改注意**：
- 修这个文件等于修「项目宪法」。任何变更应在 PR 描述里给出依据（来自 ADR / 实际事故）。
- 不要把行业常识塞进来；只放 kibouFlow 真实失败教训和决定。

### `package.json`

**作用**：依赖、scripts、Node engines；scripts 一栏是项目 harness 的入口表（`verify:*`、`audit:*`、`harness:select`、`test:*`）。

**为什么重要**：所有自动化流程入口都在这里。改 scripts 名称会破 CI（`.github/workflows/*-governance.yml` 直接引用 `npm run xxx`）。

**修改注意**：
- 改依赖版本要同时跑全量测试 + `next build`；不要单独升 next/react 主版本。
- 改 script 名要 `grep` 一遍 `.github/workflows/`、`docs/`、`scripts/run-harness-verify.mjs`。

### `next.config.ts`

**作用**：声明 next-intl plugin、`output: "standalone"`、turbopack root。

**为什么重要**：`standalone` 输出方式决定 Docker 部署形态；不要随意改回普通 `next start`。

### `tsconfig.json`

**作用**：strict TypeScript 配置 + path alias（`@/*` → `src/*`）。

### `.env.example`

**作用**：环境变量模板。是「这个项目有哪些可配置项」的事实源。

**为什么重要**：缺失 `DATABASE_URL` / `ADMIN_GEO_PASSWORD` / `ADMIN_SESSION_SECRET` 会让大半功能进入降级模式（不报错但也不入库 / 不能登录）。

---

## 路由 / 页面

### `src/proxy.ts`

**作用**：next-intl middleware（注意：文件名是 `proxy.ts` 而不是 `middleware.ts`，是仓库自定义）。

**为什么重要**：`matcher: ["/", "/(zh|ja)/:path*"]` 决定所有用户路径必须走 locale prefix。

**修改注意**：
- 不要随便加新 locale，没有跑通 `routing.ts` + `messages/{locale}.json` + 全部页面 `generateMetadata` 之前不能上线。
- 给 admin 路径加 middleware 拦截风险高，会破现有的 server-side `requireAdminApiAuth` 模型。

### `src/i18n/routing.ts`

**作用**：`locales: ["zh","ja"]`、`defaultLocale: "zh"`。

**为什么重要**：是事实源。其他 `next-intl` 调用都依赖它。

### `src/app/layout.tsx`、`src/app/[locale]/layout.tsx`

**作用**：root + locale 布局。后者挂 `NextIntlClientProvider`、`TrackingProvider`、`Header`/`Footer`、`WebSiteJsonLd`、`GoogleAnalytics`。

**修改注意**：
- `WebSiteJsonLd` 的开关受 `geo_schema_toggles.enable_website` 控制；不要直接删 `<WebSiteJsonLd />`。
- `Header` / `Footer` 是站点全局视觉一致性来源；改它们要看双语两端。

### `src/app/[locale]/guides/[category]/[slug]/page.tsx`

**作用**：单篇 MDX 文章页。

**为什么重要**：站点 70% 的 SEO/GEO 信号都在这里输出（Article / FAQ / HowTo / DefinedTerm / Breadcrumb JSON-LD）。

**修改注意**：
- 改 JSON-LD 输出顺序 / 条件，要同步更新 `tests/e2e/core-flows.spec.ts` 的断言。
- 改 `extractFaqPairsFromMarkdown` 调用参数会立刻影响所有 FAQ 文章的输出。
- `AGENTS.md` 第 5 节把这个文件列为高风险区。

### `src/app/[locale]/page.tsx`

**作用**：首页。组合 Hero / Problem / Value / Flow / Audience / GuidesPreview + bottom CTA。

### `src/app/[locale]/trial/page.tsx`、`partner/page.tsx`、各自 `success/page.tsx`

**作用**：转化主流程。success 页设置 `robots: { index: false }`。

### `src/app/[locale]/admin/geo-audit/page.tsx`

**作用**：admin GEO 体检主页（最近一次成功 / 与上次 diff / issues 概览）。`AGENTS.md` 第 5 节高风险区。

### `src/app/sitemap.ts`、`src/app/robots.ts`、`src/app/llms.txt/route.ts`、`src/app/llms-full.txt/route.ts`

**作用**：SEO/GEO 静态出口。

**为什么重要**：是 LLM / 搜索引擎对站点的「目录」。改它们 = 改全站 ranking 信号。

**修改注意**：
- `priorityOf` / `STATIC_PAGES` / `BASE_URL` 修改要同步看 `tests/unit/sitemap.test.ts`、`tests/integration/llms.route.test.ts`、`tests/integration/robots.route.test.ts`。
- `llms.txt` 顶部那句英文 description 是站点的对外文案兜底，慎改。

---

## API 路由

### `src/app/api/trial/route.ts`、`src/app/api/partner/route.ts`

**作用**：表单提交。`Zod 校验 → 限流 → 写库`。

**修改注意**：DB 缺失返回 503 是约定行为（`AGENTS.md`），不要改成 500。

### `src/app/api/track/route.ts`

**作用**：埋点。**任何错误都返回 200**，设计上不阻塞主流程。修改时不要随手加严格校验。

### `src/app/api/admin/login/route.ts`、`logout/route.ts`、`session/route.ts`

**作用**：管理员会话生命周期。

### `src/app/api/admin/geo-audit/run/route.ts`

**作用**：触发 Python 体检脚本，把结果落库。

**修改注意**：
- 体检脚本调用要保留 `GEO_AUDIT_SKIP=1` 兜底（CI 测试需要）。
- 历史 `runId` 在脚本失败时也要更新成 `failed` 状态而不是悬挂为 `running`，目前实现已经这样做（看 `updateGeoAuditRun(runId, { status: result.ok ? "success" : "failed", ... })`），改时别破坏这个不变量。

### `src/app/api/admin/geo-audit/history/route.ts`、`history/[id]/route.ts`

**作用**：历史列表 / 详情。会被 admin UI 直接读。

---

## Library / 共享逻辑

### `src/lib/content.ts`

**作用**：内容模型核心；定义 `CATEGORIES` / `CONTENT_TYPES` / `CLUSTERS` / `CLUSTER_ENTRY_SLUGS`、`ArticleFrontmatter`、`normalizeFrontmatter`、`getArticleBySlug`、`getArticlesByCategory`、`getAllArticles`、`getStrategicRelatedArticles`、`getClusterEntry*`、`getArticleMarkdown`、`buildFaqArticleSuggestions`。

**为什么重要**：列表页 / 详情页 / sitemap / llms / 体检脚本都依赖它的输出形状。

**修改注意**：
- 改类型枚举要同步改 `scripts/content-harness-check.mjs`、`docs/new-post-sop.md`、所有列表页。
- `inferCluster` 的 slug 字符串规则会影响新增文章默认归簇。
- `normalizeFrontmatter` 里关于智能引号、null 兜底、`audience` default `["individual"]` 都是「悄悄做了什么」类型的逻辑——改它会改默认行为。

### `src/lib/schemas.ts`

**作用**：所有 Zod schema。包含 trial / partner 表单 + GEO 配置（site / page / rules / toggles / preview / rollback）+ 角色 + 发布草稿。

**注意**：`geoPublishRequestSchema` / `geoPublishReviewSchema` / `geoPublishActionSchema` 当前**未被任何 API 路由消费**（仓库中 grep 不到使用点），属于「可能在路上」的代码，不是僵尸代码就是规划草稿。改前先确认。

### `src/lib/db.ts`

**作用**：全局 `postgres.Sql` 单例 + `isPgConfigured` / `getMissingDatabaseEnv`。

**修改注意**：连接池参数（`max: 8`、`idle_timeout: 30`）改前要做压测。

### `src/lib/pg-data.ts`

**作用**：写 `trial_submissions` / `partner_submissions` / `tracking_events`。失败按 `{ ok: false, reason }` 返回，不抛。

### `src/lib/admin-session.ts`

**作用**：HMAC 签名 / 验证 admin token。

**修改注意**：`timingSafeEqual` 用法不能改成普通 `===`（防侧信道）。

### `src/lib/require-admin-api.ts`

**作用**：admin API 路由开头一行调用即可获得 `{ ok, response }`。

### `src/lib/geo-settings.ts`、`src/lib/geo-rules.ts`

**作用**：所有页面 `generateMetadata` 都通过 `resolveGeoMetadata` 注入 DB 覆盖；JSON-LD 输出由 `getGeoSchemaToggles` 控制。`mergeJsonLd` 提供深合并能力。

**修改注意**：
- DB 兜底逻辑（`DEFAULT_SITE_SETTINGS`）是 DB 缺失时的真值；不能让 `getSiteUrl()` 在构建期返回 placeholder（这就是为什么 README 强调要正确设 `NEXT_PUBLIC_SITE_URL`）。

### `src/lib/geo-audit-runs.ts`、`src/lib/geo-audit-issues.ts`、`src/lib/geo-audit-scores.ts`、`src/lib/geo-audit-report-markdown.ts`、`src/lib/geo-principles-audit-runner.ts`

**作用**：体检数据持久化、Markdown 渲染、Python 子进程封装。

**修改注意**：`runGeoPrinciplesAuditScript` 走 `spawn`，改 stdout 解析方式要保留对 stderr 与 exit code 的处理。

### `src/lib/faq-extractor.ts`、`src/lib/howto-extractor.ts`

**作用**：从 MDX 文本现场抽取 FAQ pair / HowTo step（不是从 frontmatter）。

**修改注意**：抽取结果会直接进入 JSON-LD；改正则要跑 `tests/unit/faq-extractor.test.ts`、`tests/unit/howto-extractor.test.ts`、`tests/integration/geo-markdown-extractors.test.ts`。

### `src/lib/rate-limit.ts`

**作用**：进程内 IP 限流（10 分钟 3 次）。

**修改注意**：多实例下不可靠；如果上 LB，要换成 Redis 或类似实现。当前先维持现状，**不要在没有数据库 / Redis 设计前贸然改**。

### `src/lib/tracking.ts`、`src/lib/tracking-events.ts`、`src/lib/utm.ts`

**作用**：客户端埋点链路 + 表单事件名 + UTM 解析。

---

## 内容源

### `content/zh/**`、`content/ja/**`

**作用**：MDX 正文 + frontmatter，是站点的真实内容源。

**修改注意**：
- 永远修源 MDX，不要为单篇文章在组件里 if-else。
- 改 frontmatter 里 `slug` 等于改 URL，会破坏外链 + cluster entry 关系，做时要 grep 全仓 + 改 sitemap 测试。

### `src/messages/zh.json`、`src/messages/ja.json`

**作用**：next-intl 文案 namespace。

**修改注意**：改 key 名要看所有 `getTranslations({ namespace })` 调用。

---

## 数据库

### `supabase/migrations/001_init.sql` … `008_geo_audit_decisions_enrich.sql`

**作用**：建表 SQL 序列，按文件名顺序执行。

**修改注意**：
- 不能改老 migration（`AGENTS.md` 第 5 节明令禁止）；新需求开新文件。
- 列名要与 `pg-data.ts`、`geo-audit-*.ts`、admin 页面表头同步。

---

## 测试 / 守门

### `tests/unit/content.test.ts`

**作用**：覆盖 `content.ts` 的 normalizeFrontmatter、inferCluster、相关文章策略、`getArticleMarkdown`。

### `tests/integration/{trial,partner,track}.route.test.ts`

**作用**：API 路由集成测试（mock pg-data + rate-limit）。

### `tests/integration/geo-audit-*`

**作用**：admin 体检 API 行为；mock 子进程 / 数据库。

### `tests/e2e/core-flows.spec.ts`

**作用**：站点最关键 E2E：首页可达、guides 索引（含主题簇 / 案例库 / 下一步建议字符串）、文章详情、trial / partner 表单、JSON-LD 类型断言（FAQPage、HowTo、Article、BreadcrumbList、WebSite）。

**修改注意**：改文案 / 改 JSON-LD 时要同步改这里，否则 `flows-governance.yml` 会失败。

### `tests/e2e/geo-phase3-health.spec.ts`、`geo-rules-preview.spec.ts`

**作用**：阶段 3 结构可见性 + 规则 preview 端到端。

### `playwright.config.ts`

**作用**：定义 baseURL（`http://127.0.0.1:3000`）、是否自动 `npm run dev`。

### `vitest.config.ts`

**作用**：路径 alias、`tests/setup.ts`、jsdom 环境配置。

---

## Harness 脚本（Node）

### `scripts/run-harness-verify.mjs`

**作用**：`verify:local` / `verify:flows` / `verify:e2e:smoke` / `verify:publish` 的执行器。

### `scripts/content-harness-check.mjs`

**作用**：48 篇 MDX 的 W001-W011 检查。`verify:content` 入口。

### `scripts/content-warning-baseline.mjs`、`scripts/content-warning-diff.mjs`

**作用**：维护 / 比较 content warning baseline。`audit:content:*` 入口。

### `scripts/harness-select.mjs`

**作用**：交互式 selector，按任务类型推荐对应 verify/audit 命令。

### `scripts/run-python-script.mjs`

**作用**：Node 端调用 Python 脚本的胶水（统一 `python3` 解析、Windows 兼容）。

---

## Harness 脚本（Python）

### `scripts/geo_principles_audit.py`

**作用**：GEO 五原理体检主脚本，输出 JSON / Markdown。

**修改注意**：是 admin 后台「运行体检」的真实执行体。改它要跑 `npm run audit:geo:repo` + `npm run audit:geo:repo:json`。

### `scripts/seo-geo-audit.py`

**作用**：本地 SEO/GEO 审计（`audit:seo-geo:local`）。

### `scripts/selenium_geo_admin_flow.py`

**作用**：admin 后台浏览器主流程自动化（`audit:admin:selenium`）。

---

## 关键文档

### `docs/project-overview.md`

**作用**：项目总览，与 `00-project-overview.md` 高度重叠但更偏路由地图。

### `docs/harness-operating-guide.md`

**作用**：日常如何挑选 verify/audit 命令；harness 维护规则。

### `docs/testing-strategy.md`

**作用**：单元 / 集成 / E2E / 手动测试如何分工。

### `docs/new-post-sop.md`

**作用**：内容发布 SOP。任何 MDX 改动后跑哪个命令、按什么时间表治理。

### `docs/manual-exploratory-checklist.md`

**作用**：上线前手测清单（含 Hermes Agent 指令模板）。

### `docs/geo-principles.md`、`docs/geo-strategy.md`、`docs/geo-implementation-phases.md`

**作用**：GEO 三件套（原理 / 方案 / 工程阶段）。

### `docs/geo-backend-operation-guide.md`

**作用**：admin GEO 后台用户手册。

### `docs/content-warning-remediation-plan.md`

**作用**：内容 warning 治理快照（截至 2026-04-25 已为 0）。

### `docs/docs-index.md`

**作用**：docs/ 自身的索引，按场景给出推荐阅读顺序。

---

*若你只能看 5 个文件就开干，按 1) `AGENTS.md` 2) `src/lib/content.ts` 3) `src/app/[locale]/guides/[category]/[slug]/page.tsx` 4) `src/lib/schemas.ts` 5) `docs/harness-operating-guide.md` 的顺序。*
