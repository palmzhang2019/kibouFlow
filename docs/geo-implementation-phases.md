# GEO 落地开发分阶段计划

> 本文是 `[geo-strategy.md](./geo-strategy.md)` 的**工程落地版**。
> 回答的核心问题：**方案能不能落地？应该分几个阶段做？每阶段怎么交付、怎么验收？**
>
> 三件套阅读顺序：
>
> - `[geo-principles.md](./geo-principles.md)` — **为什么做**（原理）
> - `[geo-strategy.md](./geo-strategy.md)` — **做什么**（方案）
> - `geo-implementation-phases.md`（本文） — **怎么分阶段做**（工程）

---

## 结论

**完全可以落实。** 方案里每一项都能对应到仓库中具体的文件或新建模块，没有架构性阻塞。

但如果一次性全改（30+ 页文档 × 46 篇 MDX × 10+ 新组件），会出现三类风险：

- PR 过大难 review
- 内容改动和工程改动耦合
- 测试面扩散

建议按 **"依赖方向 + 可独立上线"** 两条原则拆成 **5 个主阶段（P0）+ 2 个可选阶段（P1/P2）**，每阶段都是一个**可独立合并、可独立回滚、可独立验证收益**的交付单元。

---

## 阶段依赖图

```
┌─────────────────────────────────────────────────────────────┐
│ 阶段 1: 机器可读底座（纯工程，零内容改动）                   │
│  robots.ts / sitemap 新鲜度 / 根元数据 / ENV                │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────────┐   ┌────────────────────────────┐
│ 阶段 2       │   │ 阶段 3                      │
│ LLM 入口通道 │   │ 结构化数据组件层            │
│ llms.txt /   │   │ Article / FAQ / HowTo /     │
│ llms-full    │   │ Breadcrumb / WebSite JSON-LD│
└──────┬───────┘   └──────────┬──────────────────┘
       │                      │
       └──────────┬───────────┘
                  ▼
        ┌──────────────────────────────┐
        │ 阶段 4: 内容层改造            │
        │ tldr / 框架步骤化 / 概念定义  │
        └──────────┬───────────────────┘
                   ▼
        ┌──────────────────────────────┐
        │ 阶段 5: E-E-A-T + 实体层      │
        │ 作者 / Person schema / 边界显示│
        └──────────┬───────────────────┘
                   ▼  (可选)
    ┌──────────────┴──────────────┐
    ▼                             ▼
┌──────────────────┐      ┌──────────────────┐
│ 阶段 6 (P2):     │      │ 阶段 7 (P2):     │
│ 答案页 + 术语页  │      │ 监测闭环         │
└──────────────────┘      └──────────────────┘
```

---

## 阶段 1：机器可读底座（3–5 人日）

**目标**：不动一篇内容，只改工程配置，就能让搜索 / AI 爬虫看到一个"合规、有时效、有元信息"的站点。


| 项目           | 动作                                                     | 文件                                          |
| ------------ | ------------------------------------------------------ | ------------------------------------------- |
| ENV          | 新增 `NEXT_PUBLIC_SITE_URL`                              | `.env.local` / Vercel env                   |
| robots       | 新增动态 robots，删除静态 robots                                | `src/app/robots.ts` + 删 `public/robots.txt` |
| sitemap 新鲜度  | `lastModified` 用 frontmatter 的 `updatedAt/publishedAt` | `src/app/sitemap.ts`                        |
| sitemap 优先级  | 按 `contentType` 分层                                     | 同上                                          |
| 根元数据         | `metadataBase` / title template / 默认 OG / Twitter card | `src/app/layout.tsx`                        |
| hreflang     | alternates 加 `x-default`                               | 各 `generateMetadata`                        |
| Organization | 补齐 logo / contactPoint / areaServed / 去占位              | `src/components/seo/OrganizationJsonLd.tsx` |


**退出标准**

- `/robots.txt` 返回动态内容，带 AI 爬虫白名单
- `/sitemap.xml` 每条 URL 都有**非当天的** `lastmod`
- 用 [Rich Results Test](https://search.google.com/test/rich-results) 对首页返回 Organization 正常
- 单元测试覆盖 sitemap 生成器（新增 `tests/unit/sitemap.test.ts`）

**风险等级**：极低。纯工程，可随时回滚。

---

## 阶段 2：LLM 入口通道（2–3 人日）

**目标**：打开 GEO 主闸门，让 LLM 爬虫一次性摄入整个站点。


| 项目              | 动作                               | 文件                                             |
| --------------- | -------------------------------- | ---------------------------------------------- |
| MDX → MD 工具     | 抽出共用渲染工具（剥 frontmatter、保留 MD 正文） | `src/lib/content.ts` 新增 `getArticleMarkdown()` |
| `llms.txt`      | Route Handler 生成骨架索引             | `src/app/llms.txt/route.ts`                    |
| `llms-full.txt` | Route Handler 生成全文拼接（zh + ja）    | `src/app/llms-full.txt/route.ts`               |
| Cache 策略        | `revalidate = 3600` 或静态化         | 同上                                             |


**退出标准**

- `curl -I /llms.txt` 返回 `text/plain`，内容列出所有 cluster / framework / faq / case
- `/llms-full.txt` 包含全部 46 篇正文（中日），无 HTML 污染
- 集成测试验证两条路由返回 200 + 关键 slug 存在
- 手测：把 `/llms-full.txt` 全文喂给 Claude / ChatGPT，能正确回答 5 个核心 query

**风险等级**：低。独立路由，不影响既有页面。

---

## 阶段 3：结构化数据组件层（5–8 人日）

**目标**：把所有页面从"浏览器可读"升级到"机器可读"，这是 **GEO 收益最大的一个阶段**。


| 项目               | 动作                              | 文件                                        |
| ---------------- | ------------------------------- | ----------------------------------------- |
| 抽离 ArticleJsonLd | 从 `guides/[slug]/page.tsx` 内联移出 | `src/components/seo/ArticleJsonLd.tsx`    |
| WebSiteJsonLd    | 根 layout 接入，含 `SearchAction`    | `src/components/seo/WebSiteJsonLd.tsx`    |
| BreadcrumbJsonLd | 所有二级及以下页面                       | `src/components/seo/BreadcrumbJsonLd.tsx` |
| FAQ 抽取器          | 从 MDX 抽 `##` / `###` 问答对        | `src/lib/faq-extractor.ts`                |
| FAQPageJsonLd    | `contentType === "faq"` 时自动挂载   | `src/components/seo/FAQPageJsonLd.tsx`    |
| HowTo 抽取器        | 抽有序列表步骤                         | `src/lib/howto-extractor.ts`              |
| HowToJsonLd      | `framework` / cluster 入口页       | `src/components/seo/HowToJsonLd.tsx`      |


**关键工程点**

- FAQ / HowTo 抽取器必须加**单元测试**（输入 MDX fixture → 断言输出 JSON-LD 结构），这是 GEO 核心资产，不能回归
- 所有 JSON-LD 组件建议统一用一个 `<JsonLd data={...} />` 包一层，避免 `dangerouslySetInnerHTML` 散落多处

**退出标准**

- Rich Results Test 对 5 类页面（首页 / 指南总览 / FAQ 文章 / 框架文章 / 案例）全部识别出对应类型
- 新增测试：`tests/unit/faq-extractor.test.ts`、`tests/unit/howto-extractor.test.ts`
- Playwright E2E 补一条："访问 FAQ 页 → DOM 中存在 `application/ld+json` 且解析出 `@type: FAQPage`"

**风险等级**：中。schema 组件较多，建议拆成 2–3 个 PR：

- PR 1：通用 `<JsonLd>` + Breadcrumb + WebSite
- PR 2：Article 抽离 + 字段扩展
- PR 3：FAQ / HowTo 抽取器 + 挂载

---

## 阶段 4：内容层改造（5–10 人日，其中大半是内容人力）

**目标**：把内容升级到"LLM 友好"结构。**这是第一个与编辑深度耦合的阶段**，建议工程先行出模板，内容分批回填。


| 项目               | 动作                                        | 涉及                                         |
| ---------------- | ----------------------------------------- | ------------------------------------------ |
| frontmatter 扩展   | 加 `tldr: string`、可选 `author: string`      | `src/lib/content.ts` schema                |
| ArticleLayout 渲染 | `tldr` 渲染为 `<p class="lead">`             | `src/components/article/ArticleLayout.tsx` |
| ArticleJsonLd 字段 | `abstract` 用 `tldr`、`inLanguage` 用 locale | `ArticleJsonLd.tsx`                        |
| 框架页模板            | 统一"判断框架 / 适用场景 / 不适用场景"三段                 | 5 篇 `framework-*.mdx`                      |
| 概念页模板            | 首段加 Definition Block                      | 4 篇 `concept-*.mdx`                        |
| 案例页模板            | 加"判断者 / 判断日期"                             | 3 篇 `cases/*.mdx`                          |
| 内容回填             | 为现存 46 篇补 `tldr`                          | zh + ja 各 23 篇                             |


**工程与内容协同**

- 工程侧先合并 frontmatter schema 升级（`tldr` 设为可选），让老内容不报错
- 内容侧分 3 批次回填：
  1. 第一批：所有 FAQ + 所有 cluster 入口（10 篇）
  2. 第二批：所有框架 + 概念（9 篇）
  3. 第三批：其余
- 验证脚本：`npm run test` 里加一条，警告所有缺 `tldr` 的文章（一段时间后升级为 error）

**退出标准**

- 所有 framework 页都能被 HowTo 抽取器识别出 ≥ 3 个 step
- 随机抽 5 篇喂给 ChatGPT 问"这篇核心结论是什么"，返回应 ≈ `tldr` 内容
- 46 篇全部有 `tldr`

**风险等级**：低（工程侧）/ 中（内容侧人力瓶颈）。

---

## 阶段 5：E-E-A-T + 实体层（4–6 人日）

**目标**：把可信度特征喂给 LLM 的打分器。


| 项目                | 动作                                           | 文件                                         |
| ----------------- | -------------------------------------------- | ------------------------------------------ |
| 作者数据源             | 新增 `content/authors/<slug>.mdx`（中日）          | 新目录                                        |
| 作者加载工具            | `getAuthor(slug, locale)`                    | `src/lib/authors.ts`                       |
| 作者页路由             | `/{locale}/about/<author>`                   | `src/app/[locale]/about/[author]/page.tsx` |
| 文章 frontmatter    | 加 `author: <slug>`                           | 所有 MDX                                     |
| Article schema 升级 | `author.@type = Person`，含 url                | `ArticleJsonLd.tsx`                        |
| 实体对齐              | frontmatter 加 `entities: [{name, wikidata}]` | schema 层读取，输出 `about / mentions`           |
| 边界显示              | Footer / 文章尾加"我们不处理什么"链接                     | `Footer.tsx` / `ArticleLayout.tsx`         |
| 更新徽标              | 文章头展示"发布 X / 更新 Y"                           | `ArticleLayout.tsx`                        |


**退出标准**

- Perplexity 搜索核心 query 时，本站被列入引用来源（取第一个月基线）
- Rich Results Test 对文章页返回 `Article` + `author.Person`

**风险等级**：低。都是增量信号。

---

## 阶段 6（P2，可选）：答案页 + 术语页（8–12 人日）

**目标**：把 URL 粒度对齐 LLM 引用粒度。


| 项目                 | 动作                              | 文件                                                     |
| ------------------ | ------------------------------- | ------------------------------------------------------ |
| `/answers` 路由      | 新目录 + 动态路由                      | `src/app/[locale]/answers/[slug]/page.tsx`             |
| `/glossary` 路由     | 新目录 + 动态路由                      | `src/app/[locale]/glossary/[term]/page.tsx`            |
| 内容 seed            | 从现有 FAQ 拆出 8 条问答页 + 10 个术语      | `content/zh|ja/answers/`* / `content/zh|ja/glossary/*` |
| DefinedTerm schema | 每个术语页输出                         | `src/components/seo/DefinedTermJsonLd.tsx`             |
| 内链重构               | FAQ 页每条答案反向链到 `/answers/<slug>` | 模板调整                                                   |
| sitemap 接入         | 新路由加入 sitemap                   | `src/app/sitemap.ts`                                   |


**触发条件建议**：阶段 5 上线 1 个月后，看到 AI referer 数据再决定是否投入这个阶段。不要盲推。

---

## 阶段 7（P2，可选）：监测闭环（3–5 人日）

**目标**：从"盲改"升级为"数据驱动"。


| 项目            | 动作                                                                                 | 文件                                  |
| ------------- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| AI referer 识别 | 识别 `chat.openai.com / perplexity.ai / gemini.google.com / copilot.microsoft.com` 等 | `src/proxy.ts` 或 `TrackingProvider` |
| 新增事件          | `ai_referrer_visit`                                                                | `src/lib/tracking-events.ts`        |
| 核心 query 脚本   | Node 脚本定期用 Perplexity API 查 15 条 query，记录是否命中本站                                    | `scripts/geo-audit.ts`              |
| 月度报告模板        | Markdown 模板输出"引用率 / AI 流量 / 被引用 URL Top10"                                         | `docs/geo-monthly-report.md`        |


---

## 跨阶段通用规范（贯穿所有阶段）

1. **分支 / PR 规则**：每个阶段拆 2–4 个 PR，每个 PR ≤ 400 行 diff
2. **测试要求**：
  - 阶段 1 / 2：单元测试必过
  - 阶段 3：每个 schema 组件都要有 fixture 快照测试
  - 阶段 4：加 frontmatter 校验测试（`tldr` 长度 40–120 字）
  - 所有阶段：`tests/e2e/core-flows.spec.ts` 不能红
3. **环境变量管理**：`NEXT_PUBLIC_SITE_URL` 在阶段 1 立刻补上，后续所有阶段共用
4. **i18n 同步**：中日双语必须同阶段上线，避免 hreflang 出现半空壳
5. **灰度验证**：每阶段上线后用 Rich Results Test + Schema Validator + LLM 抽测三件套做验收

---

## 推荐的最小可行推进路径（MVP）

如果人力有限，建议按 **"阶段 1 + 阶段 2 + 阶段 3 的 FAQ 部分"** 作为第一波发布，大约 **2 周、1 人** 可以完成，却能拿到方案里 **70% 的 GEO 收益**：

```
Week 1:  阶段 1 全部 + 阶段 2 全部
Week 2:  阶段 3 的 FAQPageJsonLd + Breadcrumb（只做最高 ROI 两项）
-------- 上线，观察 1 个月 --------
Month 2: 阶段 3 剩余 + 阶段 4
Month 3: 阶段 5
-------- 依据 AI referer 数据决定是否进入阶段 6 / 7 --------
```

---

## 阶段完成度自检清单

建议每个阶段结束时对照勾选：

### 阶段 1

- `NEXT_PUBLIC_SITE_URL` 已在所有环境配置
- `src/app/robots.ts` 已上线，`public/robots.txt` 已删除
- sitemap 的 `lastModified` 来自内容日期
- 首页 Rich Results Test 通过，识别 Organization
- `alternates.languages` 含 `x-default`

### 阶段 2

- `/llms.txt` 与 `/llms-full.txt` 均返回 `text/plain`
- `/llms-full.txt` 包含全部 46 篇
- 人工 LLM 抽测通过 5 条核心 query

### 阶段 3

- 通用 `<JsonLd>` 组件已抽出
- 所有 FAQ 文章输出 `FAQPage` 并通过验证器
- 所有 framework 文章输出 `HowTo`
- 所有非首页页面有 Breadcrumb
- 新增两个抽取器的单元测试通过

### 阶段 4

- 46 篇文章 100% 有 `tldr`
- 5 篇 framework 页步骤结构统一
- 4 篇 concept 页含 Definition Block
- 测试脚本能校验 frontmatter 完整性

### 阶段 5

- 作者页上线（中日双语）
- Article schema `author` 为 `Person`
- 文章头显示发布/更新日期
- Footer / 文章尾露出边界声明链接

### 阶段 6（可选）

- `/answers` 与 `/glossary` 首批内容上线
- DefinedTerm schema 正常输出
- FAQ 页有反向链接到对应 answer 页

### 阶段 7（可选）

- AI referer 识别已生效，有数据进入分析侧
- 月度 query 脚本可运行
- 第一份月度报告已产出

