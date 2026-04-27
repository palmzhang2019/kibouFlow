# AI Handoff

> 这份文件是写给「下一个上手 kibouFlow 的 AI 或工程师」的交接单。
> 阅读约 10 分钟，能让你不踩这个项目最常见的坑。

---

## Project Summary

`kibouFlow` 是一个面向「在日本发展」主题的中日双语（zh / ja）内容与转化站点，使用 Next.js 16 App Router + React 19 + TypeScript + next-intl + MDX + PostgreSQL 构建。

核心叙事：**先帮用户整理希望，再做路径判断，再导向下一步行动（trial 试用或 partner 合作）**。

为了被生成式搜索（ChatGPT / Perplexity / AI Overviews / Bing Copilot）引用，项目同时把 **GEO（Generative Engine Optimization）** 当作头等公民：
- 站点输出 robots / sitemap / llms.txt / llms-full.txt / Article / FAQPage / HowTo / DefinedTerm / Breadcrumb / WebSite / Organization JSON-LD。
- MDX 内容必须有 `tldr` / `suitableFor` / `notSuitableFor` / `relatedSlugs` / 下一步建议 等结构化字段。
- 一个 admin 后台（`/{locale}/admin/geo-audit`）调用 Python 脚本做仓库级 GEO 五原理体检，并把结果落 PostgreSQL。

当前 README 描述为 **GEO 阶段 3（MVP）** 形态：48 篇 MDX 双语对齐、内容 warning baseline 为 0、4 条 GitHub Actions 守门。

---

## Must Read First

按这个顺序读，最快建立心智模型：

1. **`AGENTS.md`**（仓库根）— 项目宪法。protected areas、verify 矩阵、playbooks。
2. **`ai-project-context/00-project-overview.md`**（本目录）— 一页总览。
3. **`ai-project-context/01-business-context.md`** — 业务概念、用户角色、内容模型、转化漏斗。
4. **`ai-project-context/02-technical-architecture.md`** — 目录结构、API、DB、`src/lib` 模块职责。
5. **`ai-project-context/03-core-flows.md`** — 8 条主流程的详细路径。
6. **`docs/harness-operating-guide.md`** — 当天要改东西时如何挑选 verify 命令。
7. **`docs/new-post-sop.md`**（如果改 MDX）/ **`docs/geo-backend-operation-guide.md`**（如果改后台）。
8. **`src/lib/content.ts`** — 内容模型源头；任何对 `category` / `cluster` / `contentType` / `relatedSlugs` 有疑问都来这里。
9. **`src/app/[locale]/guides/[category]/[slug]/page.tsx`** — 单篇文章页是 SEO/GEO 输出的中枢。
10. **`ai-project-context/05-current-status-and-risks.md`** — 高风险区清单，下手前先看一遍。

---

## Current Implementation State

来源：`docs/content-warning-remediation-plan.md`、`README.md`、源码现状、`AGENTS.md`，更新到 2026-04-27。

- ✅ 中日双语前台、guides 列表与详情、trial / partner / track / admin 完整链路
- ✅ 8 张数据库表（trial / partner / tracking / 4 张 GEO 配置 / 4 张 GEO 体检）
- ✅ JSON-LD：Article / FAQPage / HowTo / DefinedTerm / BreadcrumbList / WebSite / Organization
- ✅ Admin 单密码登录 + HMAC 签名 cookie + GEO 五原理体检后台 + 历史
- ✅ 测试矩阵：25 单元 + 11 集成 + 7 E2E + 1 内容守门 + 3 Python 审计脚本
- ✅ 4 条 GitHub Actions（content / seo-geo / admin-geo / flows）
- ⚠️ `geoPublishRequestSchema` / `geoRoleSchema` 等暗示一个「草稿审核发布」流，但 API 路由未实现（schema 是孤儿）
- ⚠️ `docs/使用指南.md` 引用的 `geo-phase-*.md` 在 `docs/` 下不存在
- ⚠️ `docs/geo-implementation-phases.md` 阶段 6（答案页 / 术语页）和阶段 7（监测闭环）未实现
- ⚠️ ja 部分文章治理状态需要重新跑 `npm run verify:content` 确认（baseline 显示 0，但 SOP 附录有历史待办）

---

## Development Rules

### 必须遵守（来自 `AGENTS.md`）

1. **不要碰 `.env*`、`node_modules/`、`.next/`、`test-results/`** 除非任务特意要求。
2. **不要乱碰 protected files**：`src/lib/content.ts`、`src/app/sitemap.ts`、`src/app/robots.ts`、`src/app/llms.txt/route.ts`、`src/app/[locale]/guides/[category]/[slug]/page.tsx`、`src/app/api/admin/geo-audit/*`、`src/lib/admin-session.ts`、`src/lib/geo-*`。改这些文件前请明确告知用户。
3. **不要改老 migration**（`supabase/migrations/001_init.sql` 等）。新需求开新文件，按序号递增。
4. **不要重命名 / 删除 locale 路由结构**——`zh` 和 `ja` 必须同时维持。
5. **不要替换确定性检查为 LLM-only 检查**（来自 `AGENTS.md` 第 5 节）。
6. **永远修源 MDX，不要在组件里硬编码补丁**。frontmatter 是事实源。
7. **DB 缺失要降级而不是崩溃**。trial/partner 503、track 始终 200、admin 给降级 UI 提示。
8. **不要随手 `--no-verify`**、`git reset --hard`、`force push`，没有明确授权之前都不要做。

### 偏好与约定

- 优先小范围修改，不做无关重构。
- 默认不写注释；只在「为什么」非显然时写一行。
- 改 frontmatter `slug` 等于改 URL：要 `grep` 全仓 + 改 `relatedSlugs` + 跑 sitemap 测试。
- 改文案要意识到 `tests/e2e/core-flows.spec.ts` 等在断言中文 / 日文字符串。
- 中日双语等价≠机翻：写新文章时，用本地语境改写而不是逐字翻译。

---

## Testing Rules

按改动类型选 verify 命令（同时见 `docs/harness-operating-guide.md`）：

| 改动 | 必跑 |
|------|------|
| 改 MDX 内容 | `npm run verify:content`（再视情况 `verify:seo-geo` 或 `audit:geo:repo`） |
| 改页面 / route / 组件 | `npm run verify:local` |
| 改 SEO/GEO 输出（sitemap / robots / llms / JSON-LD） | `npm run verify:seo-geo` |
| 改 admin GEO 后台 | `npm run verify:admin-geo`，必要时 `audit:admin:selenium` |
| 改用户主流程 | `npm run verify:flows` 或 `verify:e2e:smoke` |
| 准备发布 | `npm run verify:publish` + `docs/manual-exploratory-checklist.md` |

不确定改了什么类型？跑：

```bash
npm run harness:select
```

它会以交互式问你「主要改了什么」，并给出对应命令。

**真实 CI 没观察过之前，不要把 PR 描述写成「CI 已通过」。**

---

## Known Risks

参考 `ai-project-context/05-current-status-and-risks.md` 第 4、8、9 节。最容易踩的：

- 改 `extractFaqPairsFromMarkdown` 或 `extractHowToFromMarkdown` 的正则会让所有 FAQ / 框架文章 JSON-LD 输出突变。
- 限流是进程内 Map：多实例不互通，serverless 冷启动重置。
- E2E 断言写死中文 / 日文字符串，文案改名要同时改测试。
- `geoPublishRequestSchema` 等是孤儿 schema（无路由），删它前先确认。
- `<html suppressHydrationWarning>` 让水合错误更难察觉，不要让它隐藏真实 bug。
- `success` 页是 `robots: { index: false }`，别加索引。
- `tsconfig.tsbuildinfo` 已被提交，可能是误提，但不影响行为。

---

## Recommended Next Tasks

按「价值高 + 影响半径可控」推荐：

### A. 内容治理类

1. 跑 `npm run verify:content` 现场确认 baseline 是否仍为 0。如果有回归，按 `docs/new-post-sop.md` 附录逐项修复。
2. 对照 `docs/new-post-sop.md` 附录里 ja 文章待办（`content/ja/boundaries/concept-*.mdx` / `faq-*.mdx`）逐篇看是否需要补 `## 結論` / `## 次のステップ` / `suitableFor`。
3. 整理 `docs/使用指南.md` 中失效的 `geo-phase-*.md` 引用：要么补回文档，要么改写为指向当前文档。

### B. 工程小改善

1. 评估 `src/lib/schemas.ts` 中孤儿 schema（`geoPublishRequestSchema` / `geoRoleSchema` 等）：和用户确认是该补路由实现，还是删掉。
2. `tsconfig.tsbuildinfo` 是否应该 `.gitignore`：和用户确认后清理。
3. 给 `tests/e2e/*` 中硬编码字符串拉到 `tests/e2e/helpers.ts`，让文案变更只改一处。

### C. 中等规模新功能（按 `docs/geo-implementation-phases.md`）

1. **阶段 6（答案页 + 术语页）**：把 cluster 入口扩展为「直接答案页」，并在 `concept` 文章上挂 `DefinedTerm` 详情页。
2. **阶段 7（监测闭环）**：在 `tracking_events` 中区分「来自大模型 referral」的流量；在 admin 后台增加 referral 报表。

### D. 不建议立即做

- 升级 Next.js / React 主版本（影响 `standalone` 输出与 next-intl 兼容性）。
- 把限流换成 Redis（在 LB / 多实例需求出现前先不要做）。
- 把 admin 单密码升级为多用户（需要先和用户对齐运营需求）。

---

## Questions That Need Human Confirmation

如果你拿到一条任务后无法 100% 确定，请先问：

1. **`geoPublishRequestSchema` 等 schema 是不是要补对应 API？** 如果是历史遗留，能否删除 schema 与对应 Zod 类型？
2. **`docs/使用指南.md` 引用的 `geo-phase-*.md` 是不是历史文件？** 是否需要补文档或修改链接？
3. **`tsconfig.tsbuildinfo` 提交是有意还是误提？** 是否要加 .gitignore + 重新清理 git 历史？
4. **GEO 阶段 6 / 7 是否仍在 roadmap？** 如果在，按什么顺序排？
5. **`AGENTS.md` 第 4 节里 ja 文章的 `## 次のステップ` / `## 次の一歩` 哪些已经修复？** 需要现场跑 `verify:content` 拿快照。
6. **生产部署是否在 Vercel / 容器 / 自托管？** `Dockerfile` + `deploy.sh` 暗示是容器，但发布方式（K8s / 单机 / serverless）未在文档明示。
7. **是否启用 `GEO_AUDIT_USE_LLM=1`（OpenAI 附录）？** 如启用，需要确认成本与 model 名称。
8. **Selenium admin E2E（`audit:admin:selenium`）是否在 CI 内运行？** 还是只在本地手动？
9. **未在 `.env.example` 列出的 GA Measurement ID 走哪个变量？** 需要查 `src/components/analytics/GoogleAnalytics.tsx`。
10. **`success` 页是否被 GA 配置为转化目标？** 如果是，事件名须保持稳定。

任务给得不明确时，先把这些问题挑相关的回去问用户，再动手。

---

## TL;DR for the Next AI

1. 改任何东西前，先看 `AGENTS.md` + `ai-project-context/05-current-status-and-risks.md`。
2. 改前先 `npm run harness:select`，跑对应 verify。
3. 改 MDX 永远不要在 UI 里硬编码补救；改源 MDX。
4. 双语（zh / ja）任何一边动了，必须确认另一边的影响。
5. DB 缺失要降级，不要 500。
6. Migration 只能新增，不能改老。
7. 文案、JSON-LD、E2E spec 是三角联动；改一个看其它两个。
8. 不确定先问用户，不要凭空猜测。

---

*这份 handoff 与 `00-04` 文件配合阅读最有效。如果 ChatGPT 网页端只能上传一个文件，就上传本文件。*
