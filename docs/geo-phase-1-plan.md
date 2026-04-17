# GEO 第一阶段实施计划：机器可读底座

> 本文件是 [`geo-implementation-phases.md`](./geo-implementation-phases.md) 中 **阶段 1** 的展开版，直接面向工程落地。
> 目标读者：接手实现的开发者（一人可完成）。
>
> 本阶段的特征：**纯工程改造、零内容改动、可随时回滚**。

---

## 0. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | Phase 1 / 机器可读底座 |
| 预估工时 | 3–5 人日（1 人） |
| 改动类型 | 纯工程（不动 MDX） |
| 风险等级 | 极低 |
| 优先级 | P0（必做） |
| 前置依赖 | 无 |
| 后置阻塞 | 阶段 2（`llms.txt`）、阶段 3（schema）都依赖本阶段的 `NEXT_PUBLIC_SITE_URL` 与 `metadataBase` |

**一句话目标**：不改一篇内容，让搜索引擎与 LLM 爬虫看到一个"**合规 / 有时效 / 有元信息 / 有 AI 爬虫白名单**"的站点。

---

## 1. 现状快照（审计已完成）

| 文件 | 现状 | 问题 |
|---|---|---|
| `public/robots.txt` | 静态文件，含 `your-domain.com` 占位 | ❌ 域名占位；无 AI 爬虫白名单；会覆盖 Next.js 动态 `robots.ts` |
| `src/app/sitemap.ts` | 使用 `BASE_URL` 默认 `"https://your-domain.com"` | ⚠️ 域名占位；`lastModified: new Date()` 全部撒谎；priority 统一 0.7，未分层 |
| `src/app/layout.tsx` | `title: "GEO"`、无 `metadataBase`、无默认 OG / Twitter | ❌ 相对路径 OG 在没有 `metadataBase` 时会构建告警；AI 预览裸奔 |
| `src/app/[locale]/page.tsx` | `alternates.languages` 只有 `zh` / `ja` | ⚠️ 缺 `x-default` |
| `src/app/[locale]/guides/page.tsx` | 同上 | ⚠️ 缺 `x-default` |
| `src/app/[locale]/guides/[category]/[slug]/page.tsx` | 同上 | ⚠️ 缺 `x-default` |
| `src/app/[locale]/faq/page.tsx` | 同上 | ⚠️ 缺 `x-default` |
| `src/app/[locale]/trial/page.tsx` | 同上 | ⚠️ 缺 `x-default` |
| `src/app/[locale]/partner/page.tsx` | 同上 | ⚠️ 缺 `x-default` |
| `src/components/seo/OrganizationJsonLd.tsx` | 仅 `name / url / description / sameAs: ["https://x.com"]` | ❌ `sameAs` 占位；缺 logo / contactPoint / areaServed / foundingDate |

---

## 2. 任务清单（T1–T7）

### T1　环境变量：配置 `NEXT_PUBLIC_SITE_URL`

**为什么先做**：`sitemap.ts`、`OrganizationJsonLd`、后续 `metadataBase` 都依赖它。

**改动文件**
- `.env.example`（新增或更新）
- `.env.local`（本地开发，不提交）
- Vercel / 部署平台环境变量

**内容**
```env
# 站点主域名（无尾斜杠）
NEXT_PUBLIC_SITE_URL=https://kibouflow.com
```

> **注意**：确认最终生产域名。当前文档临时使用 `https://kibouflow.com`，如不同请全局替换。

**验证**
- `echo $env:NEXT_PUBLIC_SITE_URL`（PowerShell）能读到值
- `npm run build` 无 "Missing env" 告警

---

### T2　动态 robots：新建 `src/app/robots.ts`，删除 `public/robots.txt`

**为什么**：静态 `robots.txt` 会**覆盖**同路径的 Next.js Route Handler，必须先删。

**新建文件**：`src/app/robots.ts`

```ts
import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibouflow.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },

      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },

      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },

      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Perplexity-User", allow: "/" },

      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },

      { userAgent: "Applebot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },

      { userAgent: "CCBot", allow: "/" },

      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

**删除文件**：`public/robots.txt`

**验证**
- `npm run dev` 后访问 `http://localhost:3000/robots.txt` 返回动态内容（带多个 User-agent）
- 不再包含 `your-domain.com`

---

### T3　sitemap 时效修复 + 优先级分层

**改动文件**：`src/app/sitemap.ts`

**变更点**
1. 读取 MDX frontmatter 的 `publishedAt` / `updatedAt` 作为 `lastModified`
2. 按 `contentType` 设置 `priority` 分层
3. `BASE_URL` 默认值改为与 T1 一致，避免分叉

**核心改写示例**（供参考，实际以 diff 为准）：

```ts
import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import type { ContentType } from "@/lib/content";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibouflow.com";

const STATIC_PAGES = ["", "/trial", "/partner", "/faq", "/guides"] as const;
const LOCALES = ["zh", "ja"] as const;

function priorityOf(contentType?: ContentType): number {
  switch (contentType) {
    case "cluster": return 0.9;
    case "framework": return 0.85;
    case "faq": return 0.8;
    case "case": return 0.75;
    default: return 0.7;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(), // 静态页保留当前时间
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : page === "/guides" ? 0.9 : 0.8,
        alternates: {
          languages: {
            "x-default": `${BASE_URL}/zh${page}`,
            zh: `${BASE_URL}/zh${page}`,
            ja: `${BASE_URL}/ja${page}`,
          },
        },
      });
    }
  }

  for (const locale of LOCALES) {
    const articles = getAllArticles(locale);
    for (const a of articles) {
      const lastMod = a.updatedAt ?? a.publishedAt;
      entries.push({
        url: `${BASE_URL}/${locale}${a.href}`,
        lastModified: new Date(lastMod),
        changeFrequency: "monthly",
        priority: priorityOf(a.contentType),
        alternates: {
          languages: {
            "x-default": `${BASE_URL}/zh${a.href}`,
            zh: `${BASE_URL}/zh${a.href}`,
            ja: `${BASE_URL}/ja${a.href}`,
          },
        },
      });
    }
  }

  return entries;
}
```

**验证**
- `npm run dev` 访问 `/sitemap.xml`，检查：
  - 每条 URL 的 `<lastmod>` 不是当天
  - 文章条目 `<priority>` 按 contentType 有差异
  - 每条带 `xhtml:link rel="alternate"` 三条（x-default / zh / ja）

---

### T4　根 Layout 元数据补齐

**改动文件**：`src/app/layout.tsx`

**目标字段**
- `metadataBase`：让所有相对路径 OG / canonical 自动补全
- `title.template` + `title.default`：文章页不用再手写 `| GEO`
- `description.default`
- `openGraph.default`：站点默认分享卡
- `twitter`：`summary_large_image`
- `icons`：favicon / apple-touch-icon（若资源已就位）

**参考实现**

```ts
import type { Metadata } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibouflow.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GEO | kibouFlow",
    template: "%s | GEO",
  },
  description: "先整理希望，再判断路径，再导向下一步。面向在日本发展但方向不清的人的判断与咨询入口。",
  openGraph: {
    type: "website",
    siteName: "GEO",
    url: "/",
    title: "GEO | kibouFlow",
    description: "先整理希望，再判断路径，再导向下一步。",
    locale: "zh_CN",
    alternateLocale: ["ja_JP"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GEO | kibouFlow",
    description: "先整理希望，再判断路径，再导向下一步。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
```

> **注意**：子页面已有 `generateMetadata`，它们会**合并**（非覆盖）根元数据，不会破坏现有翻译 title。但要确认子页面的 `title` 直接使用翻译字符串（不再拼 `| GEO`），否则会重复。

**可选清理**：`guides/[category]/[slug]/page.tsx` 中的 `title: \`${article.title} | GEO\`` 可以简化为 `title: article.title`，让 `template` 自动拼接。

---

### T5　所有 `alternates.languages` 补 `x-default`

**改动文件**（6 个 generateMetadata 位置）
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/guides/page.tsx`
- `src/app/[locale]/guides/[category]/[slug]/page.tsx`
- `src/app/[locale]/faq/page.tsx`
- `src/app/[locale]/trial/page.tsx`
- `src/app/[locale]/partner/page.tsx`

**统一改法**：在 `languages` 对象里插入 `"x-default"`，值通常等于主语言 URL。

**示例**（以 `/[locale]/page.tsx` 为例）：

```ts
alternates: {
  languages: {
    "x-default": "/zh",
    zh: "/zh",
    ja: "/ja",
  },
},
```

文章页：
```ts
alternates: {
  canonical: url,
  languages: {
    "x-default": `/zh/guides/${category}/${slug}`,
    zh: `/zh/guides/${category}/${slug}`,
    ja: `/ja/guides/${category}/${slug}`,
  },
},
```

> 建议后续统一通过一个小工具 `buildLanguageAlternates(path: string)` 集中管理，避免散落。本阶段可以先手工改，工具化放到阶段 3。

---

### T6　OrganizationJsonLd 字段扩充

**改动文件**：`src/components/seo/OrganizationJsonLd.tsx`

**目标**：去除占位 `sameAs: ["https://x.com"]`，补齐 E-E-A-T 信号。

**参考实现**

```tsx
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibouflow.com";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "GEO",
    alternateName: "kibouFlow",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`, // 上线前确认资源
      width: 512,
      height: 512,
    },
    description:
      "面向在日本发展但方向不清的人，先整理希望、再判断路径、再导向下一步。",
    areaServed: { "@type": "Country", name: "Japan" },
    knowsAbout: [
      "在日本求职",
      "日语学习路径",
      "希望整理",
      "方向判断",
    ],
    foundingDate: "2025-09",
    sameAs: [
      // 上线前替换为真实账号；若暂无，整条删除
      // "https://x.com/kibouflow",
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

> `sameAs` 若暂时没有真实账号，**宁可不写也不要用占位**。占位会直接降低可信度评分。

---

### T7　单元测试：sitemap 生成器

**新建文件**：`tests/unit/sitemap.test.ts`

**覆盖点**
1. 每条 URL 以 `BASE_URL` 开头
2. 文章条目 `lastModified` 来自 frontmatter（不等于当前时间）
3. `cluster` 条目的 `priority ≥ 0.9`
4. 所有条目都有 `x-default` / `zh` / `ja` 三语 alternates
5. 至少包含 zh 和 ja 各一条首页条目

**示例骨架**

```ts
import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  const entries = sitemap();

  it("contains home entries for both locales", () => {
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/zh"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/ja"))).toBe(true);
  });

  it("all entries include x-default alternate", () => {
    for (const e of entries) {
      expect(e.alternates?.languages).toHaveProperty("x-default");
    }
  });

  it("cluster articles have priority >= 0.9", () => {
    const clusterEntries = entries.filter((e) =>
      e.url.includes("-cluster-entry"),
    );
    expect(clusterEntries.length).toBeGreaterThan(0);
    for (const e of clusterEntries) {
      expect(e.priority).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("article lastModified is not all today", () => {
    const today = new Date().toDateString();
    const articleEntries = entries.filter((e) => e.url.includes("/guides/"));
    const nonTodayCount = articleEntries.filter(
      (e) => new Date(e.lastModified!).toDateString() !== today,
    ).length;
    expect(nonTodayCount).toBeGreaterThan(0);
  });
});
```

> 现有 `tests/unit/content.test.ts` 已经验证了 `getAllArticles`，可以放心依赖其行为。

---

## 3. 推荐 PR 拆分（2 个 PR）

保持每个 PR ≤ 400 行 diff，便于 review：

### PR #1: `feat(seo): bootstrap robots.ts + env + sitemap freshness`

包含：
- T1：ENV
- T2：`robots.ts` + 删 `public/robots.txt`
- T3：`sitemap.ts` 重写
- T7：`tests/unit/sitemap.test.ts`

### PR #2: `feat(seo): metadataBase, x-default, organization schema`

包含：
- T4：根 layout 元数据
- T5：6 处 `x-default` 补齐
- T6：OrganizationJsonLd 扩充

---

## 4. 执行顺序建议（1 人节奏）

| 天 | 任务 | 产出 |
|---|---|---|
| Day 1 | T1 + T2 + T3 | 本地 `/robots.txt` `/sitemap.xml` 输出正确 |
| Day 2 | T7（测试）+ PR #1 提交 | CI 通过 |
| Day 3 | T4 + T5 | 本地 `view-source` 检查所有页面 `<head>` |
| Day 4 | T6 + 预发验证 + PR #2 提交 | Rich Results Test 通过 |
| Day 5 | Review、修正、发版 | 正式上线 |

---

## 5. 退出标准（Exit Checklist）

部署到生产后逐项验证：

### 5.1 工程产出
- [ ] `NEXT_PUBLIC_SITE_URL` 已在 `.env.example` / `.env.local` / 生产环境全部配置
- [ ] `public/robots.txt` 已删除
- [ ] 访问 `https://<domain>/robots.txt` 返回动态内容，含全部 AI 爬虫白名单
- [ ] 访问 `https://<domain>/sitemap.xml`：
  - [ ] 所有 URL 使用真实域名（无 `your-domain.com`）
  - [ ] 文章条目 `<lastmod>` 对应 MDX 的 `publishedAt`
  - [ ] 所有条目包含 `xhtml:link rel="alternate" hreflang="x-default"`
  - [ ] 文章 `<priority>` 按 contentType 分层
- [ ] 所有页面 `<head>` 内：
  - [ ] OG 链接为绝对路径（`metadataBase` 生效）
  - [ ] `<link rel="alternate" hreflang="x-default">` 存在

### 5.2 第三方验证
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) 对首页识别出 `Organization`
- [ ] [Schema Markup Validator](https://validator.schema.org/) 对首页无错误
- [ ] Google Search Console 提交新 sitemap（若已接入 GSC）

### 5.3 测试与 CI
- [ ] `npm run test` 全绿
- [ ] `tests/unit/sitemap.test.ts` 覆盖 4 项断言以上
- [ ] 现有 E2E（`tests/e2e/core-flows.spec.ts`）未因本阶段改动红

### 5.4 兼容性
- [ ] 手测：4 个核心页面（`/zh`、`/ja`、`/zh/guides`、文章详情）title 显示正常，无重复 `| GEO`
- [ ] 首次打开无 Hydration warning（本就有 `suppressHydrationWarning`，排除已知情况）

---

## 6. 回滚方案

每个任务都是独立改动，可单独回滚：

| 任务 | 回滚动作 |
|---|---|
| T1 ENV | 保留或移除变量均不影响运行（有默认值） |
| T2 robots | 恢复 `public/robots.txt`；删除 `src/app/robots.ts`（静态会再次优先） |
| T3 sitemap | `git revert` 对应 commit |
| T4 根 layout | `git revert`；子页面不受影响 |
| T5 x-default | `git revert`；不影响主功能 |
| T6 Organization | `git revert`；回到旧的最小实现 |

**建议**：PR #1 与 PR #2 各自独立合并，任一出问题都可回滚且不影响另一个。

---

## 7. 本阶段"不做"的事

明确划出边界，避免范围蔓延到后续阶段：

- ❌ 不新增 `llms.txt` / `llms-full.txt`（阶段 2）
- ❌ 不新增 FAQPage / HowTo / Breadcrumb JSON-LD 组件（阶段 3）
- ❌ 不改 MDX frontmatter，不加 `tldr`（阶段 4）
- ❌ 不新增作者体系，不升级 Article 的 author（阶段 5）
- ❌ 不新增 `/answers` `/glossary` 路由（阶段 6）
- ❌ 不增加 AI referer 埋点（阶段 7）

> 如果在实施中发现"顺手改了好像也没多大成本"的冲动，请抵抗它——会让 PR 变大，测试面扩散，阶段 1 的"极低风险"属性会丢失。

---

## 8. 与后续阶段的对接点

本阶段会留下以下"接口"，供后续阶段直接使用：

| 资产 | 谁会用 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 阶段 2 的 `llms.txt` 生成器；阶段 3 所有 JSON-LD 组件 |
| `metadataBase` | 阶段 2 `llms.txt` 里文章 URL 拼接；阶段 3 的 canonical |
| `priorityOf(contentType)` 思路 | 阶段 6 的 `/answers` `/glossary` 路由加入 sitemap 时复用 |
| `OrganizationJsonLd` 完整版 | 阶段 5 的 `author.worksFor` 引用本 `@id` |

---

## 9. 上线后 48 小时观察项

部署完成后不要立即进入阶段 2。先观察：

1. **Search Console**：是否出现"索引错误"突增（异常 hreflang、canonical 问题）
2. **Vercel / 服务器日志**：`GPTBot / ClaudeBot / PerplexityBot` 是否开始命中
3. **核心页面 CWV**：`metadataBase` 新增了 meta，不应影响 LCP；若有退化立即排查
4. **表单转化**：`/trial` 和 `/partner` 提交成功率应保持不变（本阶段不碰表单路径，如变化则是回归）

48 小时稳定后即可进入阶段 2。

---

## 附：关键命令速查

```powershell
# 本地开发（已在终端 1 运行）
npm run dev

# 生产构建（验证 metadataBase 无告警）
npm run build

# 只跑 sitemap 单测
npm run test:unit -- tests/unit/sitemap.test.ts

# 全量单测
npm run test:unit

# 打开本地 robots 与 sitemap
start http://localhost:3000/robots.txt
start http://localhost:3000/sitemap.xml
```
