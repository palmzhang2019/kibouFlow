---
name: geo phase2 refine implement
overview: 先对齐 docs/geo-phase-2-plan.md 与当前代码现状（含 Next 16 / vitest globals 等细节），然后按 T1–T4 实施阶段 2：新增 getArticleMarkdown + /llms.txt + /llms-full.txt + 相应测试。
todos:
  - id: d1-align-doc
    content: 按列出的20250修订更新 docs/geo-phase-2-plan.md（T4 import、T1 描述、T2/T3 Next 16 备注、Exit 5.5、平台命令）
    status: completed
  - id: t1-get-article-markdown
    content: 在 src/lib/content.ts 追加 getArticleMarkdown（不读 env，头部元信息+正文 trim+换行）
    status: completed
  - id: t2-llms-route
    content: 新建 src/app/llms.txt/route.ts：GET + dynamic/force-static + revalidate=3600，Content-Type text/plain，按 SECTIONS 分节渲染 zh/ja
    status: completed
  - id: t3-llms-full-route
    content: 新建 src/app/llms-full.txt/route.ts：按 locale 分段拼接 getArticleMarkdown 输出，文章间以 \n\n---\n\n 分隔
    status: completed
  - id: t4-tests
    content: 新建 tests/integration/llms.route.test.ts（不导入 describe/it/expect）；tests/unit/content.test.ts 追加 getArticleMarkdown 断言
    status: completed
  - id: verify
    content: 跑 lint + unit + integration 测试；npm run dev 手动验证两条路由；npm run build 确认静态/ISR
    status: completed
isProject: false
---

## 背景确认（与当前代码对齐）

- `src/lib/content.ts`：已导出 `getAllArticles`、`getArticleBySlug`、`getArticlesByContentType`、`ArticleMeta`、`ContentType`；`Article.content` 由 `gray-matter` 返回，已经是剥离 frontmatter 后的纯正文。
- `src/app/robots.ts` / `src/app/sitemap.ts`：阶段 1 已落地；本阶段不修改。
- `vitest.config.ts`：启用了 `globals: true`，测试内直接使用 `describe/it/expect`，无需显式 import。
- `next.config.ts`：未启用 `cacheComponents`，因此 `export const dynamic = "force-static"` + `export const revalidate = 3600` 在 Next 16 下仍为官方支持的 Route Segment Config。
- `content/**` 共 46 篇 MDX（zh 23 + ja 23），均为纯 Markdown；`content/zh/boundaries/faq-japanese-path.mdx` 含"日语学习路径 FAQ"与"关键不是证书等级"，可用于测试断言。
- 已确认 `/zh/guides/paths/job-prep-cluster-entry` 与 `/ja/guides/paths/job-prep-cluster-entry` slug 真实存在。

## 阶段 D：文档对齐（仅改 `docs/geo-phase-2-plan.md`）

在不改变计划结构的前提下，做 5 处最小修订以消除与仓库现状的不一致：

1. **T4 参考骨架 / 测试 import**：删除 `import { describe, it, expect } from "vitest"`（仓库已启 globals，和 `tests/unit/content.test.ts`、`tests/integration/track.route.test.ts` 风格保持一致）。
2. **T1 描述精确化**：把"剥离 frontmatter"的表述改为"`Article.content` 由 `gray-matter` 返回即为纯正文，本函数只负责在顶部追加最小元信息头并 `.trim()` + 换行收尾"，避免读者误以为需要额外剥离。
3. **T2 / T3 备注 Next 16 兼容性**：在两段参考实现下方各加一行 note —— 当前 `next.config.ts` 未启用 `cacheComponents`，`dynamic = "force-static"` + `revalidate = 3600` 按 Route Segment Config 生效；若未来启用 Cache Components，需迁移到 `'use cache'` + `cacheLife`（文档链接：`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md` 的 Version History）。
4. **Exit Checklist 5.5（性能）**：把"本地 `time curl` 验证首字节 < 100ms"收紧为"`npm run build` 后用 `npm run start` 或预览环境验证（dev 会走动态执行不准）"。
5. **附录命令速查**：把 `time curl` 换成 `Measure-Command { Invoke-WebRequest ... }`（PowerShell 原生，仓库 shell 为 powershell）。

> 本阶段 D 只改 markdown，不引入代码变更，不影响后续实施。

## 阶段 A：实施 T1–T4（单 PR）

PR 标题：`feat(geo): llms.txt and llms-full.txt routes`

### T1 在 `src/lib/content.ts` 追加 `getArticleMarkdown`

- 位置：文件末尾导出区追加。
- 签名：`export function getArticleMarkdown(locale: string, category: string, slug: string, siteUrl: string): string | null`
- 实现按文档 T1 示例，**不改动现有导出**；不读 env。
- 头部元信息顺序：title → blockquote(description) → URL / Locale / Published / [Updated] / [Type] / [Cluster] → `---` → 正文。

### T2 新建 `src/app/llms.txt/route.ts`

- 按文档 T2 参考实现落地。
- 导出 `GET`、`export const dynamic = "force-static"`、`export const revalidate = 3600`。
- 站点 URL：`process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibouflow.com"`。
- 分节顺序：Primary → Cluster Entries → Judgment Frameworks (`framework`) → Concepts → FAQ → Cases → Other Articles（未归入以上 `contentType` 的剩余文章）。
- 响应头：`Content-Type: text/plain; charset=utf-8` + `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`。

### T3 新建 `src/app/llms-full.txt/route.ts`

- 按文档 T3 参考实现落地，复用 T1 的 `getArticleMarkdown`。
- 按 locale 分段（`## Locale: zh` / `## Locale: ja`），每篇文章后插入 `\n\n---\n\n` 分隔。
- 排序沿用 `getAllArticles` 返回的 `publishedAt desc`。
- 同 T2 的 `dynamic` / `revalidate` / 响应头。

### T4 测试

- 新建 `tests/integration/llms.route.test.ts`：
  - 导入两个 Route Handler 的 `GET`（`@/app/llms.txt/route`、`@/app/llms-full.txt/route`），断言 `status === 200`、`content-type` 含 `text/plain`。
  - `llms.txt`：断言含 `# GEO`、`/zh/guides/paths/job-prep-cluster-entry`、`/ja/guides/paths/job-prep-cluster-entry`。
  - `llms-full.txt`：断言含 `## Locale: zh`、`## Locale: ja`、`日语学习路径 FAQ`、`关键不是证书等级`。
  - **不** 导入 `describe/it/expect`（globals 已启用）。
- 在 `tests/unit/content.test.ts` 追加一条 `getArticleMarkdown` 断言：
  - 读 `zh` + `boundaries` + `faq-japanese-path`，断言返回非 null；
  - 头部含绝对 URL `https://kibouflow.com/zh/guides/boundaries/faq-japanese-path`；
  - 不以 `---\ntitle:` 开头（证明无残留 frontmatter）；
  - 末尾以 `\n` 结尾。

## 数据流示意

```mermaid
flowchart LR
  MDX[content/{locale}/{category}/*.mdx] --> content["src/lib/content.ts (getArticleBySlug / getAllArticles)"]
  content --> getMD["getArticleMarkdown (T1)"]
  content --> llms["/llms.txt route (T2)"]
  getMD --> llmsFull["/llms-full.txt route (T3)"]
  llms --> Bots[LLM crawlers]
  llmsFull --> Bots
  tests["tests/integration + tests/unit (T4)"] -.-> getMD
  tests -.-> llms
  tests -.-> llmsFull
```

## 验证清单

- `npm run lint`
- `npm run test:unit -- tests/unit/content.test.ts`
- `npm run test:integration -- tests/integration/llms.route.test.ts`
- 本地 `npm run dev` 后：
  - `Invoke-WebRequest http://localhost:3000/llms.txt -Method Head` 返回 200 + `text/plain`
  - `Invoke-WebRequest http://localhost:3000/llms-full.txt` 内容行数 > 1000
- `npm run build`：确认 `/llms.txt` 与 `/llms-full.txt` 被识别为静态/ISR（build log 的 `○` / `●` 标记）。

## 回滚

- 两条路由互不依赖，删除对应 `src/app/llms.txt/route.ts` / `src/app/llms-full.txt/route.ts` 即可 404；`getArticleMarkdown` 若暂无其它消费者也可一并 revert，零副作用。
