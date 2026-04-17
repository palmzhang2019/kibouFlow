# kibouFlow GEO + SEO 优化方案（GEO 优先）

> 本文档是 kibouFlow（双语内容与转化站）在阶段3（MVP 已完成）之后的可见性与被引用能力升级方案。
> 目标：让 **大模型/答案引擎（ChatGPT、Perplexity、Google AI Overviews、Bing Copilot 等）** 与 **传统搜索引擎（Google/Bing/百度/Yahoo! Japan）** 都能稳定地发现、理解、引用我们的内容，并将流量导入 trial/partner 转化链路。
>
> 核心策略：**GEO 优先（生成式引擎优化）+ SEO 做地基**。在内容层对齐「可抽取的答案单元」，在技术层补齐结构化数据与可信度信号，最后用埋点闭环衡量成效。

---

## 0. 背景与现状基线

### 0.1 项目特性（影响策略的关键事实）

- 技术栈：Next.js 16 App Router + React 19 + next-intl（zh/ja）+ MDX + gray-matter
- 路由：`src/app/[locale]/**`，已有 `zh`/`ja` 双语
- 内容模型（`src/lib/content.ts`）：
  - `CATEGORIES`: `problems | paths | boundaries | cases`
  - `CONTENT_TYPES`: `problem | path | boundary | case | faq | framework | concept | cluster`
  - `CLUSTERS`: `job-prep | japanese-path | direction-sorting | partner-needs`
  - frontmatter 已支持 `audience / suitableFor / notSuitableFor / relatedSlugs / ctaType / publishedAt / updatedAt`
- 已有的 SEO 资产：
  - `src/app/sitemap.ts`（静态页 + 所有文章）
  - `public/robots.txt`
  - `src/components/seo/OrganizationJsonLd.tsx`（首页用）
  - 文章页 `Article` JSON-LD、FAQ 页 `FAQPage` JSON-LD
  - 每页均有 `generateMetadata`，大多数页已配 `alternates.languages`（zh/ja 互指）
  - `trial/success`、`partner/success` 页已 `robots: { index: false }`
- 已有的转化资产：`TrackingProvider` + `page_view / cta_click / *_form_started / *_form_submitted`

### 0.2 当前已识别的差距

- 技术层：
  - `BASE_URL` 占位符 `https://your-domain.com` 仍散落在 `sitemap.ts` / `robots.txt` / `OrganizationJsonLd.tsx`
  - 根 `metadata`（`src/app/layout.tsx`）仍是通用 `title: "GEO"`，缺 `metadataBase` 与 `default/template`
  - `sitemap.ts` 的 `lastModified` 用 `new Date()`，未使用 frontmatter 真实时间
  - 未输出 `WebSite`（含 `SearchAction`）和文章页的 `BreadcrumbList`
  - 没有 `llms.txt`（大模型抓取友好约定），也未在 `robots` 显式声明对主流 AI 爬虫的允许/限制策略
- 内容层：
  - 文章结构未被强约束为「可抽取答案块」（TL;DR / 步骤 / 适用条件 / 反例）
  - FAQ 页用 i18n `messages` 平铺，未绑定到具体文章/簇，不易被模型按场景引用
  - 案例库的「条件 → 决策 → 结果」三段式未硬性规范
- 可衡量性：
  - 暂未区分「来自大模型引用」的 referral 流量，缺 UTM/referer 采集维度

---

## 1. 核心原则（GEO 优先）

1. **每一页都要能回答一个具体问句**（H1 = 问句或结论；首屏给出 TL;DR）
2. **答案要可抽取**：定义、步骤、条件、反例都用短段落 + 列表，避免长段落
3. **实体一致**：同一概念（如「希望整理」「路径判断」「信号」）全站同名、互链
4. **可信度可验证**：作者/组织、更新时间、适用对象、不适用对象必须显式
5. **多语言等价而非翻译**：zh/ja 的标题与例子按本地语境改写，避免模型判定为低价值镜像
6. **SEO 服从 GEO**：技术 SEO（sitemap/hreflang/schema）是 GEO 的前置条件，不做多余"关键词堆砌"

---

## 2. GEO（生成式引擎优化）方案

### 2.1 把每篇内容改成"可抽取答案单元"

对 `content/{zh,ja}/**/*.mdx` 逐步改造为以下固定骨架（阶段3多数文章已接近，只需硬性统一）：

```mdx
---
title: "<一句问句或结论式标题>"
description: "<一句话摘要，不超过 140 字>"
# ...其余 frontmatter
---

## 先说结论（TL;DR）
- 一句话回答
- 适用前提：……
- 不适用前提：……

## 判断步骤
1. 第一步
2. 第二步
3. 第三步

## 适合谁 / 不适合谁
- 适合：……
- 不适合：……

## 常见误区
- 误区1 ……
- 误区2 ……

## 下一步建议
- 个人用户：去 [trial](/zh/trial)
- 机构用户：去 [partner](/zh/partner)
```

约束理由：
- 「TL;DR」块被 AI Overviews / Perplexity 等高频抽取
- 有序列表对「怎么做」类问句命中率最高
- 「适合/不适合」显式边界让模型更愿意引用（降低幻觉风险）

落地动作：
- 在 `.cursor/rules/` 或 `AGENTS.md` 新增「MDX 内容结构规范」条目（可由我后续补）
- 为 `lib/content.ts` 增加可选校验：发现缺 TL;DR 段落时在 dev 控制台 warn（不阻塞）

### 2.2 强化结构化数据（JSON-LD）

在现有 `Organization / Article / FAQPage` 基础上，新增：

- 根布局注入 `WebSite`（含 `SearchAction`）
- 文章页注入 `BreadcrumbList`
- 文章页 `Article` 补：`inLanguage / mainEntityOfPage / about / keywords / articleSection`
- 主题簇入口页注入 `CollectionPage` + 列表 `itemListElement`
- 概念页注入 `DefinedTerm`（让模型更愿意把它作为"定义来源"引用）

建议新增组件位置：

```text
src/components/seo/
  OrganizationJsonLd.tsx      # 已有
  WebsiteJsonLd.tsx           # 新：根布局
  BreadcrumbJsonLd.tsx        # 新：文章页
  CollectionJsonLd.tsx        # 新：簇入口/guides索引
  DefinedTermJsonLd.tsx       # 新：概念页
  ArticleJsonLd.tsx           # 新：从文章页抽离并扩字段
```

`Article` JSON-LD 建议字段（示意，不是可直接执行的代码）：

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "……",
  "description": "……",
  "inLanguage": "zh-CN",
  "datePublished": "2026-04-20",
  "dateModified": "2026-04-25",
  "author": { "@type": "Organization", "name": "kibouFlow" },
  "publisher": { "@type": "Organization", "name": "kibouFlow" },
  "mainEntityOfPage": "https://<site>/zh/guides/problems/resume-vs-japanese",
  "about": ["direction-sorting", "job-prep"],
  "keywords": ["在日求职", "日语学习", "希望整理"],
  "articleSection": "problems"
}
```

### 2.3 AI 爬虫友好策略

- 新增 `public/llms.txt`（社区事实标准，类似 robots 的「给大模型看的索引」）
  - 列出首页、`/zh/guides`、`/ja/guides`、主题簇入口、案例库、FAQ、概念页
  - 附一段 50 字以内的项目定位说明（便于大模型「选摘」时引用）
- `public/robots.txt` 显式声明（按产品策略任选其一）：
  - 全量允许：`GPTBot / OAI-SearchBot / ChatGPT-User / PerplexityBot / ClaudeBot / Google-Extended / CCBot` 等 `Allow: /`
  - 或差异化：屏蔽训练型（如 `CCBot`、`GPTBot` 的训练），允许检索型（`OAI-SearchBot`、`ChatGPT-User`、`PerplexityBot`、`Google-Extended` 的 Overviews 使用）
  - 本项目建议：**全量允许**，因为站点目标本就是被引用/导流
- 在所有公开页面确保 **SSR/SSG 完整渲染**（Next App Router 默认即可），不要让答案块只在 client hydrate 后出现

建议 `llms.txt` 骨架（示意）：

```text
# kibouFlow — 在日本发展的中日双语判断与路径整理站
# Purpose: 帮助在日本工作/留学的人做「希望整理」与「路径判断」，并连接机构合作

## Sitemaps
- https://<site>/sitemap.xml

## Key Entry Pages
- https://<site>/zh
- https://<site>/ja
- https://<site>/zh/guides
- https://<site>/ja/guides

## Topic Clusters
- https://<site>/zh/guides/paths/job-prep-cluster-entry
- https://<site>/zh/guides/paths/japanese-learning-path-cluster-entry
- https://<site>/zh/guides/paths/direction-sorting-cluster-entry
- (ja 对应页同上)

## Definitions
- https://<site>/zh/guides/boundaries/concept-hope-sorting
- https://<site>/zh/guides/boundaries/concept-path-judgment
```

### 2.4 概念页与术语体系（提升"被定义引用率"）

- 每个核心概念一页，URL 稳定、命名一致
  - 「希望整理」→ `boundaries/concept-hope-sorting`
  - 「路径判断」→ `boundaries/concept-path-judgment`
  - 未来可扩：「信号」「不适合推进」「方向整理」等
- 每页结构：
  - H1 = "什么是 X"
  - 首段 ≤ 2 句定义（AI 更愿意抄首段）
  - "X 不是什么"（反定义）
  - "什么时候用 X / 什么时候不用"
  - "X 和 Y 的区别"（横向比较）
- 在其他文章首次出现该术语时，用内链回指概念页（跨页实体一致性）

### 2.5 FAQ 系统升级

- 现状：`/[locale]/faq/page.tsx` 的 10 条 Q/A 来自 `messages/*.json`，与文章无绑定
- 升级方向：
  - 保留总览 `/faq` 作为站点级 FAQPage schema 聚合页
  - 专题 FAQ 走 `guides/boundaries/faq-*.mdx`（阶段3 已有），每页独立 `FAQPage` JSON-LD
  - 每条 FAQ 的 `answer` 控制在 3 句以内，AI 抽取友好
  - 在总览 FAQ 末尾加「看更多专题 FAQ」导流到 `guides`

### 2.6 案例库"条件 → 决策 → 结果"规范

- `content/{zh,ja}/cases/*.mdx` 统一 frontmatter 建议新增（非破坏性）：
  - `caseContext`: 一句话背景
  - `caseDecision`: 我们建议了什么
  - `caseOutcome`: 发生了什么
- 正文固定三段：背景 / 决策 / 结果，每段不超过 150 字
- JSON-LD 侧可以给 `Article` 增加 `about: "case-study"`

---

## 3. SEO（传统搜索引擎优化）方案

### 3.1 技术 SEO 基础（必须先补齐）

- [ ] 替换所有 `https://your-domain.com` 占位符
  - `src/app/sitemap.ts`（`BASE_URL`）
  - `src/components/seo/OrganizationJsonLd.tsx`
  - `public/robots.txt`（`Sitemap:` 行）
- [ ] `.env` / `.env.production` 正确设置 `NEXT_PUBLIC_SITE_URL`
- [ ] 在 `src/app/layout.tsx` 的 `metadata` 中增加：
  - `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!)`
  - `title: { default: "kibouFlow", template: "%s | kibouFlow" }`
  - `description`（本地化可通过 `[locale]/layout.tsx` 覆盖）
- [ ] `src/app/[locale]/layout.tsx` 增加根级 `metadata`（按 locale 切换 `openGraph.locale`、默认 description）

### 3.2 sitemap 升级

改造 `src/app/sitemap.ts`：

- `lastModified` 使用文章 frontmatter 的 `updatedAt || publishedAt`（需要扩展 `getAllArticleSlugs` 返回时间）
- `changeFrequency`/`priority` 分层：
  - 首页：`weekly` / `1.0`
  - `/guides` 索引、主题簇入口：`weekly` / `0.9`
  - 案例库总览、概念页、框架页：`monthly` / `0.8`
  - 普通文章：`monthly` / `0.7`
  - `/trial`, `/partner`：`monthly` / `0.6`（交易型页不是自然流量主阵地）
- `success` 页已 `noindex`，无需进 sitemap

### 3.3 hreflang / 国际化

- 所有 `generateMetadata` 中 `alternates.languages` 必须同时包含 `zh` 与 `ja`（已覆盖大多数页，缺口补齐）
- 建议追加 `x-default` 指向 zh 首页（或按商业策略选择）
- 不同 locale 的内容**本地化改写**，避免被识别为机翻镜像
  - zh 版多用「在日中国人」语境
  - ja 版多用「在日外国人 / 日本での転職」语境

### 3.4 Open Graph / Twitter

- 根 `metadata` 增加默认 OG image（可用 `next/og` 动态生成：站点标题 + 文章标题）
- 文章页 `openGraph.images` 绑定动态 OG
- 增加 `twitter: { card: "summary_large_image" }`

### 3.5 页面级 SEO 清单

| 页面 | title 模板 | description 要求 | 额外 schema |
| --- | --- | --- | --- |
| `/` (locale 首页) | 品牌 + 一句价值主张 | ≤ 140 字，含主关键词 | Organization + WebSite |
| `/guides` | "内容索引 \| kibouFlow" | 总览主题簇 | CollectionPage |
| `/guides/{cat}/{slug}` 簇入口 | 簇名 + "怎么做" | 说明簇适用人群 | CollectionPage + BreadcrumbList |
| `/guides/{cat}/{slug}` 普通文章 | `<文章 title>` | 首段 TL;DR 改写 | Article + BreadcrumbList |
| `/guides/boundaries/concept-*` | "什么是 X" | 定义 + 用法 | DefinedTerm + Article |
| `/guides/boundaries/faq-*` | "X 常见问题" | 说明适用簇 | FAQPage |
| `/faq` | "常见问题" | 站点级总览 | FAQPage |
| `/trial` | "申请一次希望整理" | 说明流程 | WebPage |
| `/partner` | "机构合作" | 说明合作对象 | WebPage |
| `/*/success` | `noindex` | — | — |

### 3.6 Core Web Vitals

- 继续使用 `next/image`（若有未替换的 `<img>`，改造）
- 字体使用 `next/font`（避免字体闪烁）
- 确保 SSR 阶段关键内容已渲染（现在 App Router 默认满足）
- 定期用 Lighthouse / PageSpeed 核查 `zh/ja` 双语首页与 `guides` 索引

---

## 4. 衡量与反馈闭环

### 4.1 区分"来自 AI 引用"的流量

- 在 `TrackingProvider` 中为 `page_view` 事件补充：
  - `referrer`（取 `document.referrer`）
  - `ai_source`（按 referrer 匹配 `chat.openai.com / chatgpt.com / perplexity.ai / copilot.microsoft.com / gemini.google.com / you.com` 归类）
  - `utm_*`（若链接带参）
- 对站内出站链接（trial/partner 提交后）保留 UTM，便于合作方复盘

### 4.2 GEO 专属看板（建议指标）

- **曝光类**：各簇入口 PV、概念页 PV、FAQ 专题 PV
- **引用类**：带 `ai_source != null` 的 session 数、进入落地页分布
- **转化类**：AI 来源 session → `cta_click` → `*_form_started` → `*_form_submitted` 四段漏斗
- **内容类**：Top 10 被 AI 来源命中最多的文章（决定下一轮扩写方向）

### 4.3 复盘节奏

- 每 2 周一次：看 AI 来源占比与漏斗
- 每 4 周一次：根据「Top 被引用文章」扩展 1-2 篇衍生（FAQ / 概念 / 框架）
- 每季度一次：检查 hreflang、sitemap、schema 是否仍与实际内容结构一致

---

## 5. 分阶段执行计划（建议 4 周）

### Week 1：技术地基（SEO 必修，GEO 前置）

- 替换 `your-domain.com` 占位符 → 生产域名
- 根 `layout.tsx` 加 `metadataBase / title.template / default description`
- `sitemap.ts` 接入 frontmatter 的 `updatedAt`
- `public/robots.txt` 明确 AI 爬虫策略
- 新增 `public/llms.txt`
- 新增 `WebsiteJsonLd`（根布局）
- 新增 `BreadcrumbJsonLd`（文章页）

### Week 2：结构化数据与内容骨架

- 抽离 `ArticleJsonLd`，补 `inLanguage / mainEntityOfPage / about / keywords / articleSection`
- 新增 `CollectionJsonLd`（`/guides` 与簇入口）
- 新增 `DefinedTermJsonLd`（概念页）
- 统一 MDX 内容骨架（TL;DR / 步骤 / 适合 / 不适合 / 下一步）
- 新增 AGENTS.md 或 `.cursor/rules/` 的「MDX 内容结构规范」

### Week 3：内容升级（GEO 重头戏）

- 所有 `problems/*` 补 TL;DR + 步骤化
- 所有 `paths/*` 补「判断条件表」
- 所有 `boundaries/concept-*` 改写成可被引用定义
- `cases/*` 统一「背景 / 决策 / 结果」
- FAQ 专题每条答案 ≤ 3 句，补 `relatedSlugs`

### Week 4：观测与迭代

- `TrackingProvider` 加 `referrer / ai_source / utm_*`
- 建立 GEO 看板（先 Excel/Notion 也行，后续上 BI）
- 跑一次 Lighthouse / PageSpeed / Rich Results Test / Schema Markup Validator
- 输出首版 GEO 复盘，决定下阶段（例如是否做 hub 页、是否扩语言）

---

## 6. Definition of Done（验收标准）

- [ ] 全站无 `your-domain.com` 残留，`NEXT_PUBLIC_SITE_URL` 生产可用
- [ ] 首页 / `/guides` / 簇入口 / 文章 / 概念 / FAQ 均返回预期 JSON-LD（用 Schema Markup Validator 通过）
- [ ] `sitemap.xml` 中文章 `lastModified` 与 MDX `updatedAt` 一致
- [ ] `robots.txt` 与 `llms.txt` 明确 AI 策略并指向 `sitemap.xml`
- [ ] 所有文章头部有 TL;DR；所有概念页首段是 ≤ 2 句定义
- [ ] zh/ja 每条路由都有完整 `alternates.languages`（加 `x-default` 可选）
- [ ] `page_view` 事件能识别 `ai_source`，能在埋点后台查到首批 AI 来源记录
- [ ] 连续 2 周复盘会能回答：哪些簇/文章最被 AI 引用、AI 流量转化率是多少

---

## 7. 风险与控制

- **过度结构化导致内容僵硬**：骨架作为"下限"，不是"天花板"；允许在步骤之上加段落补充
- **AI 爬虫策略反复**：把 `robots.txt` 与 `llms.txt` 的策略记录到本文件"变更日志"，任何调整都留痕
- **多语言内容同质化**：zh/ja 必须本地化改写而非机翻；必要时同一 slug 保留不同例子
- **被引用但不转化**：CTA 文案与 AI 来源用户意图分层（信息型先给「框架/FAQ」，再推 trial/partner）

---

## 8. 参考的文件位置（改动入口）

- 全局 metadata：`src/app/layout.tsx`、`src/app/[locale]/layout.tsx`
- 页面 metadata / JSON-LD：`src/app/[locale]/**/page.tsx`
- SEO 组件：`src/components/seo/*`（需要新增 Website/Breadcrumb/Collection/DefinedTerm/Article）
- 站点地图：`src/app/sitemap.ts`
- 爬虫策略：`public/robots.txt`、`public/llms.txt`（待建）
- 内容：`content/{zh,ja}/**/*.mdx`
- 内容工具：`src/lib/content.ts`
- 埋点：`src/lib/tracking.ts`、`src/components/tracking/TrackingProvider.tsx`

---

## 9. 变更日志

| 日期 | 变更 | 备注 |
| --- | --- | --- |
| 2026-04-17 | 初稿：GEO 优先的优化方案 | 阶段3 MVP 之后的可见性升级 |
