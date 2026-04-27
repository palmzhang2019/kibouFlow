# 05 · 当前状态与风险（Status & Risks）

> 这份文件是写给「下一个动手改代码的人」的。先看完，再决定是否要动手。
> 来源：源码 + `AGENTS.md` + `docs/` + `tests/`，截至 2026-04-27。

---

## 1. 当前已完成的内容

### 1.1 业务 / 前台

- 中文与日文双语完整路由：首页、`/guides`、`/guides/{category}/{slug}`、`/faq`、`/trial`、`/trial/success`、`/partner`、`/partner/success`。
- 表单链路：trial / partner Zod 校验 + 限流 + DB 写入 + 503 降级 + UTM 注入。
- 埋点：`page_view` / `cta_click` / `*_form_started|submitted` / `form_start|submit` 全部接通。
- 内容模型：48 篇 MDX 文章双语对齐（来自 `docs/content-warning-remediation-plan.md`）。
- frontmatter 兜底：`normalizeFrontmatter` 兜底 `contentType` / `cluster` / `ctaType`、过滤空字符串、智能引号清理。

### 1.2 SEO / GEO

- 动态 `robots.ts`、`sitemap.ts`（按 contentType 分层 priority、`lastModified` 来自 frontmatter）、`llms.txt` / `llms-full.txt`。
- JSON-LD：Article、FAQPage、HowTo、BreadcrumbList、WebSite、Organization、DefinedTerm。
- DB 驱动 metadata 覆盖（`geo_site_settings` / `geo_page_settings`）和 schema 开关（`geo_schema_toggles`）。

### 1.3 后台 / 体检

- Admin 登录 / 退出 / 会话校验（HMAC 签名 cookie）。
- GEO 五原理体检：`POST /api/admin/geo-audit/run` 调 Python → 落 `geo_audit_runs` + `geo_audit_issues`，UI 展示最近一次 + 与上次 diff + issues 概览 + 历史详情。
- DB 缺失降级：体检脚本可独立运行，前台显式提示「未配置 DATABASE_URL」。

### 1.4 测试 / Harness

- Vitest 单元（25 个）+ 集成（11 个）+ Playwright E2E（7 个）。
- `npm run verify:local | content | seo-geo | admin-geo | flows | e2e:smoke | publish`。
- `npm run audit:geo:repo[:json]`、`audit:seo-geo:local`、`audit:admin:selenium`、`audit:content:baseline | diff[:strict]`。
- 4 条 GitHub Actions 守门（content / seo-geo / admin-geo / flows）。
- 内容守门 baseline：`totalWarnings: 0`（截至 2026-04-25）。

### 1.5 部署形态

- `Dockerfile` 多阶段构建，runner 含 `python3` 以执行 GEO 体检脚本。
- `next.config.ts` 走 `standalone` 输出。
- `deploy.sh` 提供部署脚本（未细看）。

---

## 2. 当前未完成 / 文档提到但代码未实现

### 2.1 GEO 发布草稿流（schema 已有，路由缺失）

- `src/lib/schemas.ts` 中 `geoPublishRequestSchema`、`geoPublishReviewSchema`、`geoPublishActionSchema`、`geoRoleSchema`、`geoRoleBindingSchema` 暗示一个「草稿 → 审核 → 发布」工作流。
- 但 `src/app/api/admin/` 下没有 `publish` / `review` / `roles` 路由实现。
- **需要确认**：这是规划中、被砍的旧需求、还是某个 PR 的 WIP？不要在确认前删掉相关 schema。

### 2.2 文档提到但代码未见

- `docs/使用指南.md` 引用 `geo-phase-*.md`，但 `docs/` 当前没有这些文件（`docs/docs-index.md` 第 71 行已点出此问题）。
- `docs/geo-implementation-phases.md` 中阶段 6（答案页 + 术语页）与阶段 7（监测闭环）标为 P2 可选，**当前未实现**。
- `docs/geo-strategy.md` 提到要区分「来自大模型引用」的 referral 流量；当前 `tracking_events` 没有专门维度。

### 2.3 内容治理待办（来自 `docs/new-post-sop.md` 附录 P1）

- ja 高优先级文章（`content/ja/boundaries/concept-*.mdx`、`faq-*.mdx`）需补 `## 結論` / `## 次のステップ` / `suitableFor` / `notSuitableFor`。
- guides 索引页 i18n 缺 key（`guides.contentTypes."faq"`）。
- **需要现场验证**：当前 baseline 是 0 warnings，意味着上述项要么已修，要么不在 W001-W011 检查范围。改动前先 `npm run verify:content` + `grep` 一遍。

---

## 3. 明显 TODO / 代码内注释

未做全仓 grep。已知散点：

- `src/lib/pg-data.ts` 注释「与旧实现一致：埋点失败不抛给客户端」——明确的「不修复」决策。
- `scripts/` 下若干 `minimax-m2.7-*.md` 是历史 phase 任务计划，当前是否仍在执行需确认。
- `scripts/run-harness-verify.mjs`、`scripts/content-harness-check.mjs` 是稳定工具脚本，没有显式 TODO。
- `tsconfig.tsbuildinfo` 体积 225 KB 已被提交，可能是误提；不影响运行但显得不整洁。

---

## 4. 潜在问题与隐含约束

### 4.1 `src/lib/rate-limit.ts` 是进程内 Map

- 多实例部署 / serverless 冷启动会让限流计数互不相通。
- 仅是「劝阻级别」防滥用，不能视为真正的反爆破。

### 4.2 `geo-phase-*.md` 死链

`docs/使用指南.md` 引用了不存在的文件，需要清理或补回。

### 4.3 `supabase/` 命名误导

- 目录命名仍是 `supabase/migrations/`，但代码已不依赖 Supabase SDK / RLS。
- 文档（`docs/project-overview.md`、`AGENTS.md`）已说明这是「自托管 PostgreSQL 友好」。
- 重命名风险：CI / 部署脚本可能 hard-code 了路径，谨慎。

### 4.4 admin 单密码

- 没有用户表 / 多账号 / 角色。如果运营团队要分权，需要另起方案。

### 4.5 JSON-LD 抽取依赖正则

- `extractFaqPairsFromMarkdown` 与 `extractHowToFromMarkdown` 基于正则与 H2/H3 结构。MDX 写法变化（如换成自定义组件）可能让抽取失败。
- `geo_rules.faq_exclude_heading_patterns` 是用户可自定义正则，错误正则应被 `regexStringSchema` 拒绝，但运行期 `compilePatterns` 仍要防御。

### 4.6 体检脚本是 spawn Python

- 容器要装 `python3`（`Dockerfile` 已经做了）。
- 脚本失败的状态会被记录为 `failed`，但前台总览页是按「最近一次成功」筛选展示的，所以 failed run 不会破首页，但要看历史才能发现失败。

### 4.7 `tracking_events` 写库失败静默

- 故障时前端永远 200。这是有意设计，但代价是难发现 DB 故障——只能依赖 admin 体检 / 监控告警。

### 4.8 root layout 与 hydration 抑制

- `src/app/[locale]/layout.tsx` 在 `<html>` 与 `<body>` 上设了 `suppressHydrationWarning`。意味着浏览器扩展或第三方注入引起的水合 mismatch 不会报警，但也意味着调试真正的水合问题会更难察觉。

---

## 5. 文档与代码不一致的点

| 项 | 文档说法 | 代码实际 | 取信优先 |
|----|----------|----------|----------|
| 文件名 `middleware.ts` | `docs/project-overview.md` 写「`src/proxy.ts` 使用 next-intl 的 createMiddleware」 | 文件确实叫 `src/proxy.ts`（不是 `middleware.ts`） | 代码 |
| `geo-phase-*.md` | `docs/使用指南.md` § 1 表格引用 | docs/ 下未见 | 代码（即不存在） |
| GEO 发布流 | schema 文件里有定义 | API 路由未见 | 代码（先用未实现处理） |
| `content` warnings 为 0 | `content-warning-remediation-plan.md` 时点 2026-04-25 | 需重新跑 `verify:content` 现场确认 | 重新跑 |
| `docs/new-post-sop.md` 附录里的 ja 待办 | 列出 6 篇文章需补 | 需对照 `content/ja/boundaries/*.mdx` 实际确认 | 现场看文件 |

---

## 6. 测试是否完整

| 维度 | 评估 |
|------|------|
| 单元 | 关键 lib 都有单元测试，覆盖面足；新增 lib 时记得加 |
| 集成 | API 路由都有测试；mock pg-data 与 rate-limit 是默认做法 |
| E2E | 覆盖核心可见结构，但**断言文案是写死的中文 / JP 字符串**（如 "下一步建议"、"主题簇入口"）。改文案时易引发 false negative |
| 体检 | Python 脚本有 mock 路径（`GEO_AUDIT_SKIP=1`），CI 上靠 mock 跑 |
| 手动 | `docs/manual-exploratory-checklist.md` 比较完整，但需要人工执行 |

**已知薄弱点**：

- `tests/e2e/seo-metadata.spec.ts`、`navigation.spec.ts`、`language-switcher.spec.ts` 等还没读，可能存在过期断言。
- 没有专门的可访问性（a11y）测试。
- 没有性能 / Core Web Vitals 类自动化。
- `tracking_events` 写库失败的真实链路无端到端测试覆盖。

---

## 7. 是否有失败测试

未在本会话中执行。需要新接手时先跑：

```bash
npm run test          # vitest
npm run test:e2e      # playwright（需要本地 :3000）
npm run verify:local  # 单元 + 集成 + next build
```

---

## 8. 后续开发最应该小心的地方

按 `AGENTS.md` 第 5 节 + 本文件第 4 节，**这些区域改动一定要 PR review + 跑全套验证**：

- `src/lib/content.ts`（一改全站受影响）
- `src/app/sitemap.ts`、`src/app/robots.ts`、`src/app/llms.txt/route.ts`、`src/app/llms-full.txt/route.ts`
- `src/app/[locale]/guides/[category]/[slug]/page.tsx`
- `src/app/api/admin/geo-audit/*`
- `src/lib/admin-session.ts`（密码学相关）
- `src/lib/geo-*`（DB 配置覆盖逻辑）
- `supabase/migrations/*`（不能改老的，新增要按序号）
- `scripts/geo_principles_audit.py`
- `scripts/content-harness-check.mjs`（baseline 守门）

## 9. 不建议随便修改的地方

| 区域 | 不要改的原因 |
|------|--------------|
| `.env*` | 含敏感配置，不能进 Git |
| `node_modules/`、`.next/`、`test-results/`、`tsconfig.tsbuildinfo` | 生成产物 |
| `package-lock.json` | 只在依赖真正变化时改 |
| `supabase/migrations/00*.sql` 老文件 | 顺序不能乱 |
| `CATEGORIES` / `CONTENT_TYPES` / `CLUSTERS` 枚举 | 改一个要追全仓 |
| 文件名 `src/proxy.ts`（不是 `middleware.ts`） | 改名等于改路由中间件入口 |
| `success` 页 `robots: { index: false }` | 这是策略性设置 |
| `getMDXComponents` 的组件映射 | MDX 渲染的契约表 |
| 限流策略 `WINDOW_MS=10min, MAX=3` | 改前要做风控评估 |
| `Dockerfile` runner 的 `apk add python3` | 删了体检脚本就跑不起来 |

---

## 10. 风险等级速览

| 改动类型 | 风险 | 必跑命令 |
|----------|------|----------|
| 改一篇 MDX 文案 | 低 | `npm run verify:content` |
| 改 frontmatter slug / category | 高（破链 + sitemap）| `verify:content` + `verify:seo-geo` + grep 全仓 |
| 改 JSON-LD 组件 | 中 | `verify:seo-geo` + `verify:flows` |
| 改 metadata 兜底 | 中 | `verify:seo-geo` |
| 改 API 路由 | 中 | `verify:local` + `verify:admin-geo`（如改 admin） |
| 改 admin 会话 / 密码学 | 高 | `verify:admin-geo` + 手动验证 |
| 改体检 Python 脚本 | 高 | `audit:geo:repo` + `verify:admin-geo` |
| 升级 Next.js / React 主版本 | 极高 | 全套 + 手测 + Lighthouse |
| 改 `next.config.ts` `standalone` 配置 | 高 | 重新构 Docker 镜像并部署冒烟 |

---

*一句话：此项目代码并不大，但是「内容 ↔ SEO/GEO ↔ 体检 ↔ DB」相互耦合的回归面比较大；优先跑 verify 矩阵再下结论。*
