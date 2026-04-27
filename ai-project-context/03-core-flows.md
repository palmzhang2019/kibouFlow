# 03 · 核心业务流程（Core Flows）

> 仅整理 kibouFlow 中最关键、最常被改动、最影响验证策略的几条流程。
> 每条流程都标注涉及文件、输入输出、当前实现状态与注意事项。

---

## 流程 A：用户访问内容页（Guides 详情）

### 目的

让中日双语访客能从首页 / Guides 索引 / 链接落到一篇具体的 MDX 文章，并向其展示完整的 Article / FAQ / HowTo / Breadcrumb / DefinedTerm JSON-LD，使搜索引擎和大模型都能正确摄取。

### 涉及文件

- `src/app/[locale]/guides/[category]/[slug]/page.tsx`（页面入口、metadata、JSON-LD 串联）
- `src/lib/content.ts`（`getArticleBySlug`、`getStrategicRelatedArticles`、`getClusterEntryForArticle`）
- `src/lib/geo-settings.ts`（`resolveGeoMetadata`、`getGeoConfigBundle`）
- `src/lib/geo-rules.ts`（`getGeoSchemaToggles`、`compilePatterns`、`getGeoRules`）
- `src/lib/faq-extractor.ts`、`src/lib/howto-extractor.ts`
- `src/components/article/*`（`ArticleLayout`、`Breadcrumb`、`RelatedArticles`、`ArticleTracking`、`mdx-components`）
- `src/components/seo/*`（`ArticleJsonLd` / `BreadcrumbJsonLd` / `FAQPageJsonLd` / `HowToJsonLd` / `DefinedTermJsonLd`）
- 内容源：`content/{zh,ja}/{category}/{slug}.mdx`

### 输入

`{ locale, category, slug }`（来自 URL）。

### 处理过程

1. `generateStaticParams` 列举 `getAllArticleSlugs()`，所有 (locale, category, slug) 组合。
2. `generateMetadata` 调 `getArticleBySlug` 得到 frontmatter；调 `resolveGeoMetadata` 把 `geo_site_settings` + `geo_page_settings` 兜底进来；输出 `title` / `description` / canonical / `alternates.languages` / OG / robots。
3. 实际渲染时再次调 `getArticleBySlug`，并行 `getGeoConfigBundle`、`getGeoRules`、`getGeoSchemaToggles`。
4. 根据 `contentType` 决定走哪些抽取器：`faq` 走 `extractFaqPairsFromMarkdown`；`framework`/`cluster` 走 `extractHowToFromMarkdown`；`concept` 输出 `DefinedTermJsonLd`。
5. `toggles.enable_*` 决定哪些 JSON-LD `<script>` 实际渲染。
6. `MDXRemote` 渲染正文，`ArticleLayout` 拼接相关文章 / cluster entry / FAQ 锚点导航 / next-step 区块。

### 输出

完整 HTML 页面，包含正文、相关文章、cluster entry、FAQ accordion，以及若干 `<script type="application/ld+json">` 节点。

### 当前实现状态

✅ 已完成且被 `tests/e2e/core-flows.spec.ts` 覆盖：FAQ 页输出 `FAQPage` + `Article` + `BreadcrumbList`、cluster entry 输出 `HowTo` + `Article`、framework 输出 `HowTo`。

### 注意事项

- 不要在 UI 里硬编码补足 frontmatter。如果一篇文章没有 `tldr`，正确做法是改 MDX，而不是改组件。
- `extractFaqPairsFromMarkdown` 的最少条数与排除标题正则由 `geo_rules` 表控制。改默认值要同时跑 `npm run verify:content`。
- 改 `getStrategicRelatedArticles` 排序权重会直接影响每篇文章下方「相关阅读」与 cluster entry 的曝光，回归视感强。
- `relatedSlugs` 写错（不在 `RELATED_SLUG_PATTERN` 范围）会被 `content-harness-check.mjs` 警告 W004。

---

## 流程 B：Trial / Partner 表单转化

### 目的

把读完内容的访客接到 trial 或 partner 表单，并将提交可靠地落库。

### 涉及文件

- 页面：`src/app/[locale]/trial/page.tsx`、`src/app/[locale]/trial/success/page.tsx`、`src/app/[locale]/partner/page.tsx`、`src/app/[locale]/partner/success/page.tsx`
- 客户端表单：`src/components/forms/TrialForm.tsx`、`src/components/forms/PartnerForm.tsx`
- API：`src/app/api/trial/route.ts`、`src/app/api/partner/route.ts`
- 校验：`src/lib/schemas.ts` 的 `trialFormSchema` / `partnerFormSchema`
- 写库：`src/lib/pg-data.ts` 的 `insertTrialSubmission` / `insertPartnerSubmission`
- 限流：`src/lib/rate-limit.ts`（10 分钟 / IP / 3 次）
- 埋点：`src/lib/tracking-events.ts` 中 `trial_form_started` / `trial_form_submitted` / `partner_form_*`

### 输入

POST JSON body，至少：

- trial：`{ name, contact, ...optional }`
- partner：`{ org_name, contact_person, contact_method, ...optional }`

### 处理过程

1. 客户端组件触发 `trial_form_started`（首次聚焦时）+ `trial_form_submitted`（提交成功时）埋点。
2. 提交时把 `locale`、`landing_page`、UTM 参数注入。
3. 服务端从 `x-forwarded-for` / `x-real-ip` 取 IP → `checkRateLimit(ip)` → Zod 校验 → `insertTrialSubmission(ip, data)`。
4. DB 缺失返回 503，限流返回 429，校验失败返回 400，插入失败 500，正常返回 200 `{ success: true }`。
5. 客户端在成功响应后跳转到 `/{locale}/{trial|partner}/success`。

### 输出

DB 行（`trial_submissions` / `partner_submissions`）+ 埋点 `tracking_events` 行 + 用户落到 success 页。

### 当前实现状态

✅ 已实现且被集成测试（`tests/integration/trial.route.test.ts`、`tests/integration/partner.route.test.ts`）和 E2E（`tests/e2e/core-flows.spec.ts`、`tests/e2e/form-submission.spec.ts`）覆盖。

### 注意事项

- 限流是**进程内 Map**，多实例部署无法共享限流计数，跨实例攻击仍能突破上限。
- success 页设置 `robots: { index: false }`（来源：`docs/geo-strategy.md` 0.1 节描述），不应被搜索引擎收录。
- `TrialForm` / `PartnerForm` 是 client component，对它们改 props/字段必须同步改 schema 和 API 路由。
- `insertTrackingEvent` 内部 catch 所有错误，设计上「埋点不阻断主流程」。

---

## 流程 C：埋点 `/api/track`

### 目的

记录页面浏览、CTA 点击、表单 phase 事件，作为转化漏斗与内容效果分析依据。

### 涉及文件

- `src/components/tracking/TrackingProvider.tsx`
- `src/lib/tracking.ts`（`sendTrackingEvent`）
- `src/lib/tracking-events.ts`（`resolveFormEventName`）
- `src/app/api/track/route.ts`
- `src/lib/pg-data.ts` 的 `insertTrackingEvent`
- DB 表：`tracking_events`（migration 001）

### 输入

任意 JSON body，含 `event_name`、`page_path`、可选 `element_id` / UTM / `session_id` / `locale` / `user_agent`。

### 处理过程

1. 客户端先尝试 `navigator.sendBeacon`，失败回退 `fetch keepalive`。
2. 服务端不做 Zod 校验（设计上对埋点宽松），手动 `String(...)` 转换。
3. 写 `tracking_events`；任何错误都返回 200 `{ ok: true }`，不暴露后端状态。

### 输出

DB 行；前端永远 200。

### 当前实现状态

✅ 已实现，被 `tests/integration/track.route.test.ts` 与 `tests/unit/tracking*.test.ts` 覆盖。

### 注意事项

- `event_name` 字符串当前没有白名单校验，写错也会落库。改名要同时改 `tracking-events.ts` 与 README 的事件清单。
- `user_agent` 截断到 500 字。
- 这条流程**默认对错误静默**，意味着客户端排错难度高；如果你怀疑事件没落库，要直接看 `tracking_events` 表。

---

## 流程 D：Admin 登录与会话

### 目的

让站点维护者用一个共享密码登录 admin 后台，进入 GEO 体检入口。

### 涉及文件

- 页面：`src/app/[locale]/admin/login/page.tsx`、`src/components/admin/AdminLoginForm.tsx`
- API：`src/app/api/admin/login/route.ts`、`src/app/api/admin/logout/route.ts`、`src/app/api/admin/session/route.ts`
- 会话：`src/lib/admin-session.ts`
- 路由保护：`src/lib/require-admin-api.ts`
- 环境变量：`ADMIN_GEO_PASSWORD`、`ADMIN_SESSION_SECRET`

### 输入

POST `/api/admin/login` body：`{ password }`。

### 处理过程

1. 读 `getAdminSecrets()`，缺失环境变量直接报错。
2. 比较 password；通过后用 HMAC-SHA256 签 `{ exp, v: 1 }` payload，base64url 拼成 token。
3. `Set-Cookie: geo_admin_session=<token>; HttpOnly; Path=/; SameSite=Lax`（具体 attribute 看路由实现）。
4. 后续 admin API 路由用 `requireAdminApiAuth(req)` 校验 cookie；过期或签名错误 → 401。

### 输出

带签名 cookie 的响应；登录后浏览器侧自动带 cookie 访问 `/admin/geo-audit/*` 页面与 API。

### 当前实现状态

✅ 已实现，被 `tests/unit/admin-session.test.ts`、`tests/integration/geo-admin-login.route.test.ts`、`tests/integration/admin-logout.route.test.ts` 覆盖。

### 注意事项

- 单密码模式，没有用户表 / 角色 / 多账号。`schemas.ts` 里 `geoRoleSchema` / `geoRoleBindingSchema` 暗示规划过角色系统，但 API 没出现。
- token TTL 由调用方传入；改默认值要看 `signAdminSession` 的调用点。
- 不要在客户端代码里读 `ADMIN_GEO_PASSWORD`，只能通过 server route 校验。

---

## 流程 E：GEO 五原理体检（Admin 后台）

### 目的

提供一个本地或服务端可重复执行的「站点结构性健康度」检查，输出 5 维分数 + 结构化 issues + Markdown 报告，并落库形成历史可比。

### 涉及文件

- 页面：`src/app/[locale]/admin/geo-audit/{page,run/page,history/page,history/[id]/page}.tsx`
- 触发组件：`src/components/admin/GeoAuditRunner.tsx`、`src/components/admin/GeoAuditMarkdown.tsx`
- API：`src/app/api/admin/geo-audit/run/route.ts`、`src/app/api/admin/geo-audit/history/route.ts`、`src/app/api/admin/geo-audit/history/[id]/route.ts`
- 子进程封装：`src/lib/geo-principles-audit-runner.ts`
- 落库：`src/lib/geo-audit-runs.ts`、`src/lib/geo-audit-issues.ts`、`src/lib/geo-audit-scores.ts`、`src/lib/geo-audit-report-markdown.ts`
- 脚本：`scripts/geo_principles_audit.py`
- DB：`geo_audit_runs` / `geo_audit_issues` / `geo_audit_decisions`（migrations 005–008）
- 操作手册：`docs/geo-backend-operation-guide.md`、`docs/geo-admin-hermes-manual-test.md`、`docs/geo-admin-selenium-e2e-flow.md`

### 输入

admin 用户已登录 → 点「运行 GEO 体检」→ POST `/api/admin/geo-audit/run`。

### 处理过程

1. `requireAdminApiAuth` 校验 cookie；失败 401。
2. `checkRateLimit` 限流（IP 维度，前缀 `geo-audit-run:`）；失败 429。
3. 若 `canPersistGeoAuditRuns()` 为真，先 `insertGeoAuditRunRunning()` 拿一个 `run_id`。
4. `runGeoPrinciplesAuditScript()` 调 `python3 scripts/geo_principles_audit.py --json`（路径由 `GEO_AUDIT_PYTHON` 控制；CI 可用 `GEO_AUDIT_SKIP=1` 跳过）。
5. `coalesceAuditJsonForPersist` 把 stdout JSON / Markdown 合并、`extractScoresFromAuditJson` 抽五维分数、`normalizeIssueInputs` 规范化 issues。
6. 用 `updateGeoAuditRun(runId, ...)` 更新行；若 `result.ok` 且有 issues，再 `insertGeoAuditIssuesForRun`。
7. 响应包含：`ok`、`id`、`persisted`、`issues_inserted`、`exitCode`、`markdown`、`json`、`issues`、`stderr`、`command`、五维分数、`used_llm`、`llm_model` 等。

### 输出

- DB：`geo_audit_runs` 一行（含 markdown / json）+ `geo_audit_issues` 多行
- HTTP：完整 JSON（包含 markdown 让前端渲染）
- 历史页 `/{locale}/admin/geo-audit/history` 列出所有 run；点开看单次详情

### 当前实现状态

✅ 已实现，被 `tests/integration/geo-audit-admin.route.test.ts`、`tests/integration/geo-audit-history-detail.route.test.ts`、`tests/integration/geo-audit-run-issues-mock.route.test.ts` 覆盖；浏览器主流程可用 `npm run audit:admin:selenium`。

### 注意事项

- `DATABASE_URL` 缺失时仍能跑（脚本与 markdown 返回正常），但 `persisted: false`，前台总览页会渲染降级提示（见 `src/app/[locale]/admin/geo-audit/page.tsx`）。
- 体检脚本默认是「启发式规则结果」，不能替代真实检索 + 引用环境抽检（来自 `docs/geo-backend-operation-guide.md`）。
- 改 issue 字段（severity、layer、code）必须同时改 `geo-audit-issues.ts`、`geo_audit_issues` migration、列表 / 详情页表头。
- 改五维评分键名必须同步 `extractScoresFromAuditJson`、`geo_audit_runs` 列、admin 总览页表格。

---

## 流程 F：SEO/GEO 静态出口（sitemap、robots、llms）

### 目的

让搜索引擎和 LLM 爬虫能拿到一份准确、最新、与 frontmatter 真实日期对齐的资源清单。

### 涉及文件

- `src/app/sitemap.ts`（`getAllArticles` + 静态页 + categories；`lastModified` 从 frontmatter 拿）
- `src/app/robots.ts`
- `src/app/llms.txt/route.ts`、`src/app/llms-full.txt/route.ts`
- `src/lib/seo/site-url.ts`（`getSiteUrl` / `getDefaultOgImage`）
- 测试：`tests/unit/sitemap.test.ts`、`tests/integration/llms.route.test.ts`、`tests/integration/robots.route.test.ts`、`tests/unit/seo-site-url.test.ts`

### 输入

无（运行时静态/缓存）。

### 处理过程

1. `sitemap.ts` 遍历 `LOCALES × STATIC_PAGES`，再加 `LOCALES × CATEGORIES`，再加每篇文章。
2. 静态页 `lastModified` 用 `SITEMAP_STATIC_LASTMOD` 或 `new Date()`。
3. 文章 `priority` 用 `priorityOf(contentType)`：`cluster` 0.9、`framework` 0.85、`faq` 0.8、`case` 0.75，其它 0.7。
4. `llms.txt` 输出按 `cluster / framework / concept / faq / case` 顺序的人类可读列表，每条带绝对 URL + description；`llms-full.txt` 输出每篇文章的 `getArticleMarkdown`（标题 + TL;DR + Prerequisites + Common Mistakes + 正文）。

### 输出

- `/sitemap.xml`（Next.js 自动生成）
- `/robots.txt`
- `/llms.txt`（缓存：`max-age=0, s-maxage=3600, stale-while-revalidate=86400`）
- `/llms-full.txt`

### 当前实现状态

✅ 已实现并被 `npm run verify:seo-geo` 与 GitHub Actions `seo-geo-governance.yml` 守卫。

### 注意事项

- `lastModified` 取自 frontmatter `updatedAt ?? publishedAt`；改 frontmatter 日期字段会直接影响 sitemap 新鲜度。
- 改 `priorityOf` 表会影响所有文章在搜索结果中的优先级映射，回归面广。
- `llms.txt` 顶部的英文一句话定位是站点文案默认值的事实源。

---

## 流程 G：内容守门（`verify:content`）

### 目的

发布前阻挡 frontmatter / 内链 / next-step / TL;DR 等结构性回归，保持 baseline 0 warnings。

### 涉及文件

- `scripts/content-harness-check.mjs`
- `scripts/content-warning-baseline.mjs`、`scripts/content-warning-diff.mjs`
- `scripts/baselines/content-warning-baseline.json`
- 文档：`docs/content-warning-remediation-plan.md`、`docs/new-post-sop.md`

### 输入

仓库里 `content/{zh,ja}/{category}/*.mdx` 全集。

### 处理过程

1. 读每篇 MDX 的 frontmatter（gray-matter）。
2. 检查 W001-W011：非规范 contentType / cluster / ctaType / relatedSlugs；缺 tldr / suitableFor / notSuitableFor / relatedSlugs；内链不足；缺 next-step heading；缺配对 locale。
3. 输出 warning / error 列表，与 baseline 对比；可在 strict 模式下任何回归直接失败。

### 输出

- 控制台 warning 列表
- 退出码（CI / `verify:content` 中决定是否 break）

### 当前实现状态

✅ 已实现，当前 baseline `totalWarnings: 0`（来自 `docs/content-warning-remediation-plan.md`）。

### 注意事项

- `NEXT_STEPS_PATTERNS` 是硬编码正则，`AGENTS.md` 第 4 节列了支持的中文 / 日文标题；新增写法要先改这里。
- `RELATED_SLUG_PATTERN` 限定 `^(problems|paths|boundaries|cases)\/[a-z0-9-]+$`，禁止跨 locale 直接写 slug。

---

## 流程 H：双语内容编辑

### 目的

确保 zh / ja 两端文章数量、关键 frontmatter、结构对等。

### 涉及文件

- `content/zh/**`、`content/ja/**`
- `src/lib/content.ts`（normalizeFrontmatter）
- `docs/new-post-sop.md`、`docs/content-warning-remediation-plan.md`、`AGENTS.md` 第 4 节

### 处理过程

1. 编辑前确认配对的 locale 文章是否存在；若另一边缺失，至少要补 frontmatter 与 TL;DR 占位（参考 `AGENTS.md` Content Editing Chapter）。
2. 保持 `category`、`slug`、`relatedSlugs`、`cluster`、`contentType`、`ctaType` 在两端一致；`title` / `description` / 正文按本地语境写，不强求逐字翻译。
3. 改完跑 `npm run verify:content`；涉及内链或聚合页改动跑 `npm run verify:seo-geo`；高价值文章改完跑 `npm run audit:geo:repo`。

### 当前实现状态

⚠️ 内容数量当前 48 篇双语对齐（来自 `docs/content-warning-remediation-plan.md`），但 `docs/new-post-sop.md` 附录列出多个 ja 文章仍需补 `## 結論` / `## 次のステップ` / `suitableFor` / `notSuitableFor`。需要确认这些治理项当前是否已完成（验证方式：跑 `npm run verify:content` 确认 0 warnings，并直接看 `content/ja/boundaries/*.mdx` 内容头部）。

### 注意事项

- 不要复用 zh slug 跨到 ja 时仅做翻译，模型会判低质量镜像。
- relatedSlugs 写错会让 sitemap、相关文章、cluster entry 链路同时失真，但 build 不会报错；只能靠 `verify:content` 警告发现。

---

*这八条流程基本覆盖了项目所有「值得测试」的路径。其它细节流程（如 admin issues 列表、admin decisions、faq 锚点抽取）多是这些主流程的衍生。*
