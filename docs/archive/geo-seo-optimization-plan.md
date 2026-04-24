# GEO & SEO 优化方案（以 GEO 为主）

> 面向 `kibouFlow / GEO` 站点（中日双语、在日发展内容与转化）的机器可读性与生成式引擎可见性改造方案。
> 本方案以 **GEO（Generative Engine Optimization）** 为主，SEO 仅保留与 GEO 共用底座的部分，避免重复投入。

---

## 0. 关键定义：这里的"GEO"是什么

项目里 `GEO` 既是**品牌名**，又恰好是本轮主攻方向——

**GEO = Generative Engine Optimization**：让 ChatGPT / Claude / Perplexity / Gemini / Google AI Overviews / Bing Copilot 这类**生成式搜索**在回答"在日本发展、日语和求职怎么并行、方向不清如何整理……"这类问题时，**引用本站页面、复述本站的判断框架**。

与 SEO 的关键差异：

- **SEO** 优化的是"被点进来"（排序、CTR）。
- **GEO** 优化的是"被引用、被抄进回答里"（可抽取性 extractability、可归因性 citation-worthiness、可信度 E-E-A-T）。

项目定位天然适配 GEO：内容是"**判断框架 / FAQ / 案例**"三件套，而这恰是生成式引擎最爱摘录的三种结构。本方案的目标就是把这个天然优势**放大到可被 LLM 索引与引用**的程度。

---

## 1. 现状诊断（仓库审计）

| 项目 | 现状 | 评估 |
|---|---|---|
| 双语 + hreflang | `src/app/sitemap.ts` 带 `alternates.languages` | ✅ 已就位，但缺 `x-default` |
| Organization JSON-LD | `src/components/seo/OrganizationJsonLd.tsx`，仅 4 字段 | ⚠️ 太薄，`sameAs` 还是占位 |
| Article JSON-LD | `guides/[category]/[slug]/page.tsx` 内联 | ⚠️ 缺 `author.url / image / inLanguage / about / mainEntityOfPage` |
| FAQ schema | `faq-*.mdx` 多篇纯问答结构，**未输出 `FAQPage`** | ❌ GEO 高价值缺口 |
| HowTo / 判断框架 schema | `framework-*.mdx` 未标注 | ❌ 缺 |
| Breadcrumb schema | 无 | ❌ 缺 |
| `robots.txt` | `public/robots.txt` 里 `your-domain.com` 占位 | ❌ 未迁成 `robots.ts` 动态生成 |
| Root `layout.tsx` | `title: "GEO"`，无 `metadataBase`，无 Twitter card，无默认 OG | ❌ 大幅影响 AI 抓预览 |
| `llms.txt` / `llms-full.txt` | 无 | ❌ GEO 核心缺口 |
| OG Image | 仅 static `next.svg` | ❌ 无动态 OG |
| Sitemap `lastModified` | 恒等于 `new Date()` | ⚠️ 抹掉了"新鲜度"信号 |
| 作者 / 专家署名（E-E-A-T） | 全部 `{"@type":"Organization","name":"GEO"}` | ❌ 缺可信度来源 |
| 内容内链 `relatedSlugs` | 已在 frontmatter | ✅ 基础牢固 |
| 案例匿名化 + 判断依据叙事 | `cases/*.mdx` 写法正确 | ✅ GEO 友好 |

**一句话结论**：内容结构（簇 / FAQ / 判断框架 / 案例）已经是 GEO 最理想的骨架，但**机器可读层（schema / llms.txt / 元数据 / 可信度）严重欠缺**，导致当前的好内容在 LLM 眼中几乎"不可识别"。

---

## 2. GEO 主方案（P0–P2 分优先级）

### 2.1 建立 `llms.txt` 与 `llms-full.txt`（P0，必做）

这是 2025 年起被 Anthropic / OpenAI 抓取器、Perplexity、Mintlify 等普遍尊重的事实标准，等同于"专供 LLM 的 sitemap"。

**落地动作**：在 `src/app/` 下新增 Route Handler：

- `/llms.txt` — 站点骨架 + 关键页列表 + 品牌定位一段话
- `/llms-full.txt` — 把所有 MDX 的 frontmatter + 正文以**纯 Markdown**拼接输出（LLM 爱纯 MD 远胜 HTML）

建议动态生成，直接复用 `getAllArticleSlugs / getArticleBySlug`：

```ts
// src/app/llms.txt/route.ts
import { NextResponse } from "next/server";
import { getAllArticles } from "@/lib/content";

export async function GET() {
  const zh = getAllArticles("zh");
  const lines = [
    "# GEO (kibouFlow)",
    "",
    "> 面向"在日本发展"方向不清的人，先整理希望、再判断路径、再导向下一步。中日双语。",
    "",
    "## Primary",
    "- [首页 (zh)](https://kibouflow.com/zh)",
    "- [首页 (ja)](https://kibouflow.com/ja)",
    "- [指南总览](https://kibouflow.com/zh/guides)",
    "",
    "## Judgment Frameworks",
    ...zh.filter(a => a.contentType === "framework")
       .map(a => `- [${a.title}](https://kibouflow.com${a.href}): ${a.description}`),
    "",
    "## FAQ",
    ...zh.filter(a => a.contentType === "faq")
       .map(a => `- [${a.title}](https://kibouflow.com${a.href}): ${a.description}`),
    "",
    "## Cases",
    ...zh.filter(a => a.contentType === "case")
       .map(a => `- [${a.title}](https://kibouflow.com${a.href}): ${a.description}`),
  ];
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

`llms-full.txt` 则把每篇 frontmatter 摘要 + 正文 MD 顺序拼出来，这样 Claude / GPT 只要抓一次就能全量摄入判断体系。

### 2.2 结构化数据全面补齐（P0）

**GEO 的摘录率强相关于 schema.org 完整度**。建议将 SEO 组件独立化：

在 `src/components/seo/` 新增：

- `ArticleJsonLd.tsx`（替换现有内联版本）
- `FAQPageJsonLd.tsx`（挂到所有 `contentType === "faq"` 的页面）
- `HowToJsonLd.tsx`（挂到 `framework` 和 "推荐阅读顺序" 型 cluster 入口页）
- `BreadcrumbJsonLd.tsx`（全站路径面包屑）
- `WebSiteJsonLd.tsx`（根布局，含 `potentialAction.SearchAction`，即使暂无站内搜索也应声明）

**FAQ 提取器（关键）**：`faq-*.mdx` 文章是 `## 问题` + 段落答案结构，非常容易从 MDX 源里正则抽取 `### / ##` 标题 + 随后文本，动态生成：

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "inLanguage": "zh-CN",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "学到什么程度适合求职？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "关键不是证书等级，而是是否能稳定完成'简历表达 + 面试沟通 + 岗位理解'。"
      }
    }
  ]
}
```

这是**让 Google AIO 与 Perplexity 直接引用 FAQ 答案的决定性一步**。

### 2.3 内容可抽取性改造（P0）

LLM 摘录页面时遵循的优先级：**清晰 H2/H3 → 有序列表 → 定义式句子 → 表格 → 散文**。针对项目做三件事：

1. **每篇 MDX 首段加"TL;DR / 一句话结论"**
   LLM 摘录最常抓首段。建议统一 frontmatter 新增 `tldr: string`，并在 `ArticleLayout` 渲染为 `<p class="lead">`，同时写进 Article schema 的 `abstract` 字段。

2. **"判断框架"类页面必须有显式步骤结构**
   `framework-*.mdx` 建议统一为：

   ```md
   ## 判断框架
   1. **第一步**：…
   2. **第二步**：…
   3. **第三步**：…

   ## 适用场景
   - …

   ## 不适用场景
   - …
   ```

   对应输出 `HowTo` schema 的 `step[]`。

3. **"定义 / 概念"类页面加 Definition Block**
   `concept-*.mdx` 开头固定模板：

   > **希望整理（hope sorting）**：在方向不清时，把"想要 / 约束 / 时间窗口"分项写下来，再判断路径，而不是直接行动。

   LLM 回答"希望整理是什么"时会**整段摘录**这种句式。

### 2.4 E-E-A-T 可信度信号（P1）

生成式引擎越来越重可信度，尤其涉及"就业、学习建议"这类 **YMYL 邻近话题**。行动：

- 新增 `content/authors/*.mdx`（中日双语作者页 + 机构介绍），含资历、联系方式、X 链接
- Article JSON-LD 的 `author` 从 `Organization` 升级为 `Person`，带 `url` 指向作者页
- `OrganizationJsonLd` 补齐：`logo`, `foundingDate`, `founder`, `contactPoint`, `areaServed: JP`，去掉占位 `sameAs`
- 所有案例页加"**判断者**：XX / 判断日期：YYYY-MM"，提升可归因性
- 在 Footer 暴露"更新频率 / 最近更新"徽标（复用 `publishedAt / updatedAt`）

### 2.5 语义与实体层（P1）

让 LLM 把本站识别为"**在日求职 / 日语学习路径判断**"领域的实体来源：

- 首页和 `/guides` 加 `about: [{"@type":"Thing","name":"在日本求职"}, {"@type":"Thing","name":"日语学习路径"}]`
- 每篇文章 Article schema 加 `about` + `mentions`（从 frontmatter 的 `cluster` 映射）
- 引入 **Wikidata 对齐**：判断框架、概念页的关键术语在首次出现时链接到 Wikidata / Wikipedia（如"JLPT"、"在留資格"），schema 里 `sameAs` 引用 Wikidata QID。这是生成式引擎做实体消歧的核心信号。

### 2.6 对 AI 爬虫的策略性开放（P1）

在新的 `src/app/robots.ts` 里**明确允许**主流 AI 抓取器，并告诉它们 `llms.txt` 位置：

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";
const BASE = process.env.NEXT_PUBLIC_SITE_URL!;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Bytespider", disallow: "/" }, // 视业务决策
    ],
    sitemap: [`${BASE}/sitemap.xml`],
    host: BASE,
  };
}
```

> 注意：需要**删除** `public/robots.txt`，否则 Next.js 会优先返回静态文件，覆盖 Route Handler。

### 2.7 "答案优先"的信息架构（P2）

为被 AI 抓取当"权威答案"，建议再补两种页面形态：

- `/{locale}/answers/<question-slug>`：一页一问，800–1200 字，**H1 即原问题**，首段 40–80 字给结论，后续是"判断依据 / 何时不适用 / 相关术语"。从现有 FAQ 拆分出来。
- `/{locale}/glossary/<term>`：术语页，每条 `DefinedTerm` schema。生成式引擎做解释时非常依赖这种页面。

### 2.8 GEO 监测指标（P2）

没有监测就没有 GEO。建议在 `src/lib/tracking-events.ts` 新增事件：

- `ai_referrer_visit`：在 middleware 或 `TrackingProvider` 里识别 `referer` 含 `chat.openai.com / perplexity.ai / gemini.google.com / copilot.microsoft.com / duckduckgo.com/?t=ai` 等，单独打一个事件
- 每月人工在 GPT / Perplexity / Gemini 里跑一份 **15 条核心 query 清单**（和 cluster 一一对应），记录"是否被引用 / 是否命中 URL / 回答是否准确"

核心 query 示例（zh）：

1. "在日本先学日语还是先找工作"
2. "方向不清时该怎么整理希望"
3. "日语学到什么程度适合求职"
4. "想做在日求职不知道从哪开始"
5. "在日求职机构合作怎么选"
   …（覆盖 `job-prep / japanese-path / direction-sorting / partner-needs` 四簇）

---

## 3. SEO 辅助方案（与 GEO 共用底座）

### 3.1 元数据层（P0）

- `src/app/layout.tsx` 补齐 `metadataBase: new URL(NEXT_PUBLIC_SITE_URL)`、默认 OG、Twitter card、`themeColor`
- 所有 `alternates.languages` 加上 `x-default: "/zh"`（或主语言）
- 标题模板统一 `title.template = "%s | GEO"`，避免文章页里手写拼接

### 3.2 动态 OG Image（P1）

利用 Next.js 的 `opengraph-image.tsx`（每个路由自动识别），动态渲染：标题 + cluster 标签 + 语言徽标。既服务 SEO 又服务 GEO（LLM 抓取时用作 `image`）。

### 3.3 Sitemap 新鲜度修复（P0，低成本高收益）

当前 `sitemap.ts` 里所有 `lastModified: new Date()` 等于给 Google 撒谎。应改为：

```ts
lastModified: article.updatedAt || article.publishedAt,
```

对应读取 MDX frontmatter。文章 priority 建议按 `contentType` 分层：`cluster=0.9 / framework=0.85 / faq=0.8 / case=0.75 / problem|path|boundary=0.7`。

### 3.4 内链矩阵化（P1）

`relatedSlugs` 已有，但目前**只上不下**：案例 → 框架 → FAQ。建议补"下游 → 上游"链接（每篇 FAQ 文末反向链到所属 cluster 入口），形成**闭环内链**。可以在 `getRelatedArticles` 里加一步"自动补 cluster 入口为相关项"。

### 3.5 Core Web Vitals / 渲染层（P2）

- `guides/[category]/[slug]` 的 MDXRemote 是 RSC 渲染，CLS / LCP 基本无忧，保持即可
- 首页 `HeroSection` 若有大图，补 `priority` + 显式宽高
- 关闭生产环境的 `suppressHydrationWarning`（目前 locale layout 里加了，建议只在开发里留）

### 3.6 关键词页布局（P2）

从"以品牌为中心"→"以问题为中心"。建议新建：

- `/zh/topics/job-in-japan`
- `/zh/topics/japanese-learning-path`
- `/zh/topics/direction-sorting`

这些是 **cluster hub 的长内容版**（3000–5000 字），聚合当前 cluster 入口 + 全 FAQ + 全案例摘要。SEO 和 GEO 都会把这种"one page, one topic"视为权威页。

---

## 4. 内容创作规范（GEO Writing Checklist）

每篇新 MDX 必须满足以下清单：

- [ ] frontmatter 包含 `tldr`（40–80 字，以"结论 + 条件"句式）
- [ ] H1 = 用户真实搜索问句（如"先学日语还是先求职？"而非"日语路径浅析"）
- [ ] 首段出现关键实体（"在日求职"、"JLPT"、"在留资格"……）
- [ ] 至少 1 个编号列表（对应 HowTo step）或 1 个定义块
- [ ] 至少 1 处 `## 何时不适用` 或 `## 常见误区`（反向断言，AI 极爱引用）
- [ ] 相关 slugs ≥ 3 条，至少 1 条指向 cluster 入口
- [ ] 有明确 `updatedAt`，文末显示"最近更新：YYYY-MM"
- [ ] 中日双语内容**同日 publish**，避免 hreflang 缺口
- [ ] 对有争议 / 边界话题：加"我们不处理什么 / 需进入进一步人工判断"段落（与 `boundaries` 目录呼应）

---

## 5. 执行路线图（6 周节奏）

| 周 | 目标 | 可交付 |
|---|---|---|
| W1 | GEO 基础设施 | `llms.txt` + `llms-full.txt` + `robots.ts`；`sitemap.ts` 新鲜度修复；root layout 元数据补齐 |
| W2 | Schema 升级 | `FAQPageJsonLd` / `HowToJsonLd` / `BreadcrumbJsonLd` / `WebSiteJsonLd` 组件化；全文章接入 |
| W3 | 内容可抽取性 | frontmatter 加 `tldr`；重构 5 篇 framework 为显式步骤；3 篇 concept 加定义块 |
| W4 | E-E-A-T + 实体层 | 作者页上线；Article schema 升级到 `Person`；关键术语接 Wikidata `sameAs` |
| W5 | 答案页 + 术语页 | 选 8 条高频问题建 `/answers/*`；建 10 条术语 `/glossary/*` |
| W6 | 监测 + 话题 hub | AI referer 埋点；建 3 个 topic hub 长内容；跑第一轮 AI 引用测试并记录基线 |

---

## 6. 如果只做 3 件事（ROI 最高）

1. **修 `public/robots.txt` 的占位域名**，并改为 `src/app/robots.ts` 动态版本，附带 AI 爬虫白名单。
2. **上线 `/llms.txt` 与 `/llms-full.txt`** —— 一晚上成本，直接打开 GEO 入口。
3. **给 5 篇 `faq-*.mdx` 输出 `FAQPage` JSON-LD** —— 几乎必被 Google AIO / Perplexity 摘录。

---

## 附：核心文件索引

| 改造点 | 目标文件 | 操作 |
|---|---|---|
| AI 爬虫策略 | `src/app/robots.ts` (新增) | 创建；删除 `public/robots.txt` |
| LLM 友好 sitemap | `src/app/llms.txt/route.ts` (新增) | 创建 |
| LLM 全文摄入 | `src/app/llms-full.txt/route.ts` (新增) | 创建 |
| 根元数据 | `src/app/layout.tsx` | 补 `metadataBase` / 默认 OG / title template |
| Sitemap 新鲜度 | `src/app/sitemap.ts` | 用 `updatedAt / publishedAt`；priority 分层 |
| Article schema | `src/components/seo/ArticleJsonLd.tsx` (新增) | 抽离 + 扩展字段 |
| FAQ schema | `src/components/seo/FAQPageJsonLd.tsx` (新增) | 从 MDX 抽取问答对 |
| HowTo schema | `src/components/seo/HowToJsonLd.tsx` (新增) | 框架/入口页使用 |
| 面包屑 | `src/components/seo/BreadcrumbJsonLd.tsx` (新增) | 全站接入 |
| 网站 schema | `src/components/seo/WebSiteJsonLd.tsx` (新增) | 根布局接入 |
| Organization | `src/components/seo/OrganizationJsonLd.tsx` | 扩字段，去占位 |
| 内容字段 | `src/lib/content.ts` + 所有 MDX | 新增 `tldr`、规范化步骤结构 |
| AI 来源埋点 | `src/lib/tracking-events.ts` + `TrackingProvider` | 新增 `ai_referrer_visit` |
