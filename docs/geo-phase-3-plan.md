# GEO 第三阶段实施计划：结构化数据组件层

> 本文件是 [`geo-implementation-phases.md`](./geo-implementation-phases.md) 中 **阶段 3** 的展开版，直接面向工程落地。
> 目标读者：接手实现的开发者（建议 1 人主责 + 编辑参与 FAQ / HowTo 规约确认）。
>
> 本阶段的特征：**全站 JSON-LD 组件化 + 抽取器单测为资产**；与阶段 4（`tldr` 等 frontmatter）解耦，**本阶段不要求改 MDX 正文结构**（仅在抽取器无法命中时做小范围内容修补）。

---

## 0. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | Phase 3 / 结构化数据组件层 |
| 预估工时 | 5–8 人日（1 人） |
| 改动类型 | 以工程为主；**少量**内容协作（FAQ / HowTo 抽取规约白名单） |
| 风险等级 | 中（页面多、schema 类型多；需防重复/冲突） |
| 优先级 | P0（GEO 收益最高的工程阶段） |
| 前置依赖 | **阶段 1**：`NEXT_PUBLIC_SITE_URL`、`metadataBase`、各页 `alternates`（含 `x-default`）已就绪，便于输出绝对 `url` / `@id`。**阶段 2**：非硬依赖，可与本阶段并行。 |
| 后置阻塞 | 阶段 4 的 `ArticleJsonLd` 字段扩展（`abstract` ← `tldr`）会复用本阶段抽出的组件 |

**一句话目标**：把全站从「浏览器可读」升级到「**机器可读 + 可被富结果/生成式引用**」——统一 `<JsonLd>`、补齐 **WebSite / BreadcrumbList**、把 **Article** 从页面内联迁出并增强字段、对 **MDX FAQ** 与 **框架 / 簇入口** 输出 **FAQPage / HowTo**。

---

## 1. 现状快照（与仓库对齐，实施前复核）

> 以下路径以本仓库当前结构为准；若你本地已合并更多 PR，实施前用 `rg "application/ld\\+json" src` 再扫一遍。

| 位置 | 现状 | 阶段 3 动作 |
|---|---|---|
| `src/app/[locale]/guides/[category]/[slug]/page.tsx` | 内联 `Article` JSON-LD（`author`/`publisher` 均为 Organization） | 抽离为 `ArticleJsonLd`，并补 `url`、`inLanguage`、`mainEntityOfPage` 等 |
| `src/app/[locale]/faq/page.tsx` | 已从 i18n 生成 `FAQPage` | **保持**；本阶段重点在 **MDX `contentType: faq` 的文章页** |
| `src/app/[locale]/page.tsx` | 已有 `OrganizationJsonLd` | 可选：与 `WebSiteJsonLd` 通过 `@id` 互链（见 T3） |
| `src/app/[locale]/layout.tsx` | 无站点级 JSON-LD | 挂载 `WebSiteJsonLd`（每 locale 一条或合并策略见 T3） |
| `src/app/[locale]/guides/page.tsx` 等 | 无 `BreadcrumbList` | 增加 `BreadcrumbJsonLd` |
| `src/app/[locale]/trial/*`、`partner/*`、`success/*` | 无面包屑 schema | 同上，按路径生成短链面包屑 |
| `content/**/boundaries/faq-*.mdx` 等 | `##` 下为问答句 + 段落答 | 用 **FAQ 抽取器** 生成 `FAQPage.mainEntity[]` |
| `content/**/paths/framework-*.mdx`、`cluster` 入口 | 常见「推荐阅读顺序」+ `1.` 列表 | 用 **HowTo 抽取器** 生成 `HowTo.step[]` |

**与阶段 4 的边界**：本阶段**不**新增 frontmatter 字段（如 `tldr`）；若抽取器对某篇 MDX 零命中，优先用 **抽取规则 + 白名单** 解决，实在不行再登记「阶段 4 改结构」清单。

---

## 2. 任务清单（T1–T8）

### T1　通用组件：`<JsonLd data={object} />`

**新建**：`src/components/seo/JsonLd.tsx`

**职责**
- 接收 `Record<string, unknown>` 或 `object[]`（`@graph`）
- 统一 `JSON.stringify` + `dangerouslySetInnerHTML`，避免各处复制粘贴
- 可选：`id` prop，便于同一页多条 script

**验收**
- 类型安全：`JSON.stringify` 前剔除 `undefined`（或统一用 `undefined` 不序列化策略）

---

### T2　`ArticleJsonLd` 抽离与字段增强

**新建**：`src/components/seo/ArticleJsonLd.tsx`  
**修改**：`src/app/[locale]/guides/[category]/[slug]/page.tsx`（删除内联 script，改为 `<ArticleJsonLd … />`）

**建议字段（首版）**

| 字段 | 来源 |
|---|---|
| `@context` | `https://schema.org` |
| `@type` | `Article` |
| `headline` | `article.title` |
| `description` | `article.description` |
| `datePublished` / `dateModified` | `publishedAt` / `updatedAt \|\| publishedAt` |
| `author` / `publisher` | 暂维持 Organization「GEO」（阶段 5 再升级为 `Person`） |
| `inLanguage` | `zh` → `zh-CN`，`ja` → `ja-JP` |
| `mainEntityOfPage` | `{ "@type": "WebPage", "@id": absolutePageUrl }` |
| `url` | `${SITE_URL}/${locale}${article.href}` |
| `isPartOf`（可选） | 指向 WebSite `@id`，强化站点实体 |

**注意**
- 绝对 URL 依赖 `NEXT_PUBLIC_SITE_URL`（与阶段 1 一致）
- 若文章 `generateMetadata` 仍手写 `` `| GEO` ``，可与阶段 1 的 `title.template` 对齐后删掉模板重复（小改动，可放在本 PR 或单独 chore）

---

### T3　`WebSiteJsonLd`（站点 + 可选搜索）

**新建**：`src/components/seo/WebSiteJsonLd.tsx`  
**挂载点**：`src/app/[locale]/layout.tsx`（每个 locale 渲染一次，语言与 `lang` 属性一致）

**推荐 JSON-LD 形态**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://example.com/zh/#website",
  "name": "GEO",
  "url": "https://example.com/zh",
  "inLanguage": "zh-CN",
  "publisher": { "@id": "https://example.com/#organization" }
}
```

**关于 `potentialAction / SearchAction`**
- 站内**无**全文搜索时：**不要**伪造 `SearchAction`（易被判定为无效/误导）
- 若未来有 `/guides?q=` 再补；本阶段文档明确 **omit SearchAction**

**与 Organization 的关系**
- 首页已有 `OrganizationJsonLd`：可为 Organization 增加稳定 `@id`（如 `${SITE_URL}/#organization`），WebSite 的 `publisher.@id` 指向同一 `@id`
- 非首页：仅输出 WebSite 亦可；或每页都带 Organization（略冗余，**首版建议只在首页 Organization + 各 locale WebSite**）

---

### T4　`BreadcrumbJsonLd`（全站二级及以下）

**新建**：`src/components/seo/BreadcrumbJsonLd.tsx`  
**建议配套**：`src/lib/seo/breadcrumbs.ts` —— 纯函数 `buildBreadcrumbItems(locale, segments): { name, item }[]`

**覆盖页面（最小集）**

| 路由模式 | 面包屑示例 |
|---|---|
| `/{locale}` | Home |
| `/{locale}/guides` | Home → 路径判断（或 i18n 中的 guides 标题） |
| `/{locale}/guides/{cat}/{slug}` | Home → 路径判断 → 分类名 → 文章标题 |
| `/{locale}/faq` | Home → FAQ |
| `/{locale}/trial` | Home → 试用 |
| `/{locale}/trial/success` | Home → 试用 → 成功 |
| `/{locale}/partner` | Home → 合作 |
| `/{locale}/partner/success` | Home → 合作 → 成功 |

**分类显示名**：与 `guides` 页 `t(\`categories.${cat}\`)` 对齐，避免中英日硬编码分叉；实现时可传 `categoryLabel: string` 由页面 `getTranslations` 注入。

**验收**
- Rich Results 中 BreadcrumbList 非必须项，但 [Schema Validator](https://validator.schema.org/) 应无 error

---

### T5　FAQ 抽取器（MDX 正文 → `FAQPage`)

**新建**：`src/lib/faq-extractor.ts` —— `extractFaqPairsFromMarkdown(markdown: string, options?: { excludeHeadingPatterns?: RegExp[] }): { name: string; text: string }[]`

**适用范围**
- **仅** `article.contentType === "faq"` 的文章页挂载 `FAQPageJsonLd`
- **不要**在 `/zh/faq` 重复输出第二份 FAQPage（该页已从 i18n 生成）

**抽取规则（首版建议）**
1. 按行扫描，匹配 `^##\s+(.+)$` 作为**候选问题**
2. 紧随其后的段落（直到下一个 `##` 或文件结束）合并为 `acceptedAnswer.text`（trim，单换行可保留）
3. **排除**非问答结构标题（需与编辑对齐后固化为常量）：
   - `这页解决什么问题`、`推荐阅读顺序`、`常见误区`、`下一步建议`
   - `案例库怎么用`、`按问题类型浏览`、`阅读一个案例时看什么`（若出现在 faq 类 MDX 中）
4. 若排除后条目 `< 2`：不输出 FAQPage（或仅打 `console.warn` 在 dev），避免空壳 Rich Results

**新建**：`src/components/seo/FAQPageJsonLd.tsx` —— 接收 `pairs`，输出 `<JsonLd>`；`inLanguage` 与 T2 一致

**人工介入（小）**
- 与编辑确认「排除标题」列表是否覆盖全部现有 `faq-*.mdx`；新增 FAQ 时更新常量或改为 frontmatter 驱动（阶段 4 可选）

---

### T6　HowTo 抽取器（有序列表 → `HowTo`）

**新建**：`src/lib/howto-extractor.ts` —— `extractHowToFromMarkdown(markdown: string): { name?: string; steps: { text: string }[] } | null`

**适用范围（首版）**
- `contentType === "framework"` **或** `contentType === "cluster"` 且正文中存在 **「推荐阅读顺序」** 或 **「判断框架」** 小节下的有序列表 `1.`

**步骤文本清洗**
- 列表项内 Markdown 链接 `[text](url)` → 保留 `text` 或 `text + url`（建议保留 `text` 降低噪声）
- 去掉行尾多余空格

**新建**：`src/components/seo/HowToJsonLd.tsx`

**挂载策略**
- 与 `ArticleJsonLd` 同页输出：`Article` + `HowTo`（Google 常见并存；若 Rich Results 有冲突再收敛为仅 HowTo）

**人工介入（小）**
- 若某篇 framework 未用 `1.` 列表：登记为「阶段 4 改模板」或当次小改 MDX（控制在 ≤3 篇则可在阶段 3 内做）

---

### T7　页面接入矩阵

| 页面 | Article | FAQPage | HowTo | Breadcrumb | WebSite |
|---|---|---|---|---|---|
| `[locale]/page.tsx` | — | — | — | ✓（仅 Home 一级可省略） | 由 layout |
| `[locale]/guides/page.tsx` | — | — | — | ✓ | layout |
| `[locale]/guides/.../page.tsx` | ✓ | 若 `faq` | 若 `framework`/`cluster` 命中 | ✓ | layout |
| `[locale]/faq/page.tsx` | — | 已有 | — | ✓ | layout |
| `[locale]/trial/page.tsx` 等 | — | — | — | ✓ | layout |

**实现提示**：面包屑可封装 `<PageJsonLd locale={...} crumbs={...}>` 减少重复，非必须。

---

### T8　测试矩阵

| 类型 | 文件 | 覆盖点 |
|---|---|---|
| 单元 | `tests/unit/faq-extractor.test.ts` | fixture：一篇典型 `faq-*.mdx` 正文片段 → ≥3 个 Question；排除标题生效 |
| 单元 | `tests/unit/howto-extractor.test.ts` | fixture：`japanese-learning-path-cluster-entry` 推荐阅读顺序 → ≥3 steps |
| 单元 | `tests/unit/article-jsonld.test.ts`（可选） | 序列化结果含 `url`、`inLanguage` |
| E2E | `tests/e2e/core-flows.spec.ts` | 访问 `/zh/guides/boundaries/faq-japanese-path`（或任意 faq MDX），`page.locator('script[type="application/ld+json"]')` 解析 JSON，断言存在 `@type":"FAQPage"` |
| E2E | 同上 | 访问一篇 `framework-*.mdx`，断言存在 `@type":"HowTo"` 或 `HowTo` 在 `@graph` 中（视实现而定） |

---

## 3. PR 拆分建议（3 个 PR，控制 diff）

与 [`geo-implementation-phases.md`](./geo-implementation-phases.md) 一致：

### PR #4：`feat(seo): JsonLd + WebSite + Breadcrumb`

- T1 `JsonLd`
- T3 `WebSiteJsonLd` + 挂到 `[locale]/layout.tsx`
- T4 `BreadcrumbJsonLd` + 全站接入（含 trial/partner/success）
- 最小 E2E：任选一页断言存在 `BreadcrumbList`（若实现为单 script 多 `@graph`，则解析 `@graph`）

### PR #5：`feat(seo): ArticleJsonLd refactor + enrich`

- T2 抽离 + 字段增强
- 改 `guides/[category]/[slug]/page.tsx` 一处接入

### PR #6：`feat(seo): FAQ + HowTo extractors and JSON-LD`

- T5 + T6 + T7 条件挂载
- T8 全部单测 + E2E

> 若团队更偏好「一次合并」：可压缩为 **2 个 PR**（PR4+5 / PR6），但 review 压力会上升。

---

## 4. 执行顺序（建议 5 天单人）

| 天 | 内容 |
|---|---|
| Day 1 | T1 + T3 + 本地 Rich Results 抽测首页 / zh |
| Day 2 | T4 全站接入 + 修 i18n 分类名注入 |
| Day 3 | T2 Article 抽离 + 字段对齐 |
| Day 4 | T5 + T6 抽取器 + 单测 fixture |
| Day 5 | T7 接入 + E2E + 文档登记「抽取失败文章」清单（若有） |

---

## 5. 退出标准（Exit Checklist）

### 5.1 工程
- [ ] 全站仅通过 `<JsonLd>` 输出 `application/ld+json`（文章页旧内联已删除）
- [ ] 每个 `[locale]` 下页面在「查看源代码」中能看到 **WebSite**（或 `@graph` 内含 WebSite）
- [ ] `guides` 文章详情 URL 的 `Article` 含 **绝对 `url`** 与 **`inLanguage`**
- [ ] 至少一篇 **MDX FAQ** 页面额外含 **FAQPage**
- [ ] 至少一篇 **framework** 或 **cluster 入口** 含 **HowTo**（且 `step` ≥ 2）
- [ ] 二级页面含 **BreadcrumbList**（或 `@graph` 内）

### 5.2 验证工具
- [ ] [Rich Results Test](https://search.google.com/test/rich-results)：`Article` + `FAQPage` + `HowTo` + `BreadcrumbList` 无致命 error（warning 记录 backlog）
- [ ] [Schema Markup Validator](https://validator.schema.org/)：同上

### 5.3 测试
- [ ] `npm run test:unit` 新增 faq/howto 用例全绿
- [ ] `npm run test:e2e` 新增/更新用例全绿
- [ ] 无重复 FAQPage：`/zh/faq` 仍为 **1 份** FAQPage script（与文章页不冲突）

### 5.4 性能与体积
- [ ] 单页 JSON-LD 总大小 &lt; 100KB（FAQ 条目很多时抽查体积）
- [ ] 不阻塞 LCP（script 放 body 开头当前与现有一致；若后续优化可挪到 body 末，非本阶段必须）

---

## 6. 回滚方案

| PR | 回滚 |
|---|---|
| PR #4 | 移除 layout 中 WebSite + 各页 Breadcrumb；保留 JsonLd 空壳无意义可一并 revert |
| PR #5 | 恢复文章页内联 Article（git revert） |
| PR #6 | 移除 FAQ/HowTo 条件挂载；抽取器文件可保留但无引用 |

---

## 7. 本阶段「不做」清单（防范围蔓延）

- ❌ 不把 `author` 改为 `Person`、不上作者页（**阶段 5**）
- ❌ 不加 `tldr` / `abstract` 依赖 frontmatter（**阶段 4**）
- ❌ 不新增 `/answers`、`/glossary` 路由（**阶段 6**）
- ❌ 不引入 `remark` / MDX AST 完整解析链（首版用正则 + 状态机即可；复杂度上升再评估）
- ❌ 不修改 `/zh/faq` 现有 i18n FAQPage 逻辑（除非与全站 `@graph` 策略冲突）

---

## 8. 与后续阶段对接

| 本阶段产出 | 阶段 4 / 5 用法 |
|---|---|
| `ArticleJsonLd` | 阶段 4：`abstract` ← `tldr`；阶段 5：`author` → `Person` + `url` |
| `FAQPageJsonLd` + 抽取器 | 阶段 4：可选 `faqItems` frontmatter 覆盖自动抽取 |
| `WebSiteJsonLd` `@id` | 阶段 5：Organization / Person `worksFor` 互链 |
| E2E 解析 JSON-LD 的模式 | 阶段 6 新路由可复用同一 helper |

---

## 9. Next.js 16 与实现前必读

按仓库 [`AGENTS.md`](../AGENTS.md) 要求：实现前阅读 `node_modules/next/dist/docs/` 下与 **Metadata**、**静态生成**相关的当前版本说明，确认 `generateMetadata`、`<script type="application/ld+json">` 在 App Router 下的推荐写法无变更。

---

## 附：关键文件索引（实施后应对照）

| 用途 | 路径 |
|---|---|
| 通用 JSON-LD | `src/components/seo/JsonLd.tsx` |
| Article | `src/components/seo/ArticleJsonLd.tsx` |
| WebSite | `src/components/seo/WebSiteJsonLd.tsx` |
| Breadcrumb | `src/components/seo/BreadcrumbJsonLd.tsx` + `src/lib/seo/breadcrumbs.ts` |
| FAQ 抽取 | `src/lib/faq-extractor.ts` + `src/components/seo/FAQPageJsonLd.tsx` |
| HowTo 抽取 | `src/lib/howto-extractor.ts` + `src/components/seo/HowToJsonLd.tsx` |
| 文章页接入 | `src/app/[locale]/guides/[category]/[slug]/page.tsx` |
| Locale 壳 | `src/app/[locale]/layout.tsx` |
| 单测 | `tests/unit/faq-extractor.test.ts`、`tests/unit/howto-extractor.test.ts` |
| E2E | `tests/e2e/core-flows.spec.ts`（或新建 `seo-jsonld.spec.ts`） |
