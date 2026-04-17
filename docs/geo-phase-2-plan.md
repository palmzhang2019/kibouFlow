# GEO 第二阶段实施计划：LLM 入口通道

> 本文件是 [`geo-implementation-phases.md`](./geo-implementation-phases.md) 中 **阶段 2** 的展开版，直接面向工程落地。
> 目标读者：接手实现的开发者（一人可完成）。
>
> 本阶段的特征：**独立的新路由、不改任何既有页面、不动 MDX 内容、可随时回滚**。

---

## 0. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | Phase 2 / LLM 入口通道 |
| 预估工时 | 2–3 人日（1 人） |
| 改动类型 | 纯工程（新增路由 + 一个工具函数） |
| 风险等级 | 低（两条只读路由，不影响现有页面） |
| 优先级 | P0（必做） |
| 前置依赖 | **阶段 1 已上线**（依赖 `NEXT_PUBLIC_SITE_URL` 与 `metadataBase`，以及阶段 1 PR #2 的 sitemap 真域名） |
| 后置阻塞 | 无（阶段 3 与本阶段并行即可） |

**一句话目标**：打开 GEO 主闸门 —— 让 GPTBot / ClaudeBot / PerplexityBot 等 LLM 爬虫**一次性**摄入整个站点的结构与全文。

**核心产出**
- `/llms.txt` — 给 LLM 看的站点索引（骨架）
- `/llms-full.txt` — 给 LLM 看的全站全文（正文拼接）

---

## 1. 现状快照（审计）

### 1.1 阶段 1 留下的可用资产

| 资产 | 可用性 | 用途 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ 已配置，带默认兜底 | 用于拼绝对 URL |
| `src/app/robots.ts` | ✅ 已开通 AI 爬虫白名单 | 本阶段增加对 `llms.txt` 的 sitemap-like 引用 |
| `src/app/sitemap.ts` | ✅ `priorityOf` / `getAllArticles` 读 frontmatter | 本阶段复用分组思路 |
| `src/lib/content.ts` | ✅ 导出 `getAllArticles / getArticleBySlug / getArticlesByContentType` | 本阶段读内容 |

### 1.2 阶段 2 尚缺的东西

| 缺口 | 具体表现 |
|---|---|
| MDX → 纯 MD 工具 | `getArticleBySlug` 返回 `Article.content` 是带 MDX 语法的字符串。LLM 友好的 MD 应**剥离 frontmatter、保留正文**，若存在 JSX 组件需要保守降级（阶段 2 内不启用 JSX，通过约定规避） |
| `/llms.txt` 路由 | 无 |
| `/llms-full.txt` 路由 | 无 |
| 集成测试 | `tests/integration/` 下无对应测试 |
| robots 引用 | `src/app/robots.ts` 当前只声明 `sitemap`，未声明 `llms.txt`（非强制，但建议） |

### 1.3 内容侧状态（仅确认，不改动）

- 46 篇 MDX 全量可用（zh 23 + ja 23）
- 所有 MDX 都是 **纯 Markdown + frontmatter**，未使用 JSX / 自定义组件 → 可直接透传（Phase 4 若引入 JSX 组件，需在本阶段工具里加过滤，届时再补）
- frontmatter 字段齐全：`title / description / publishedAt / contentType / cluster / relatedSlugs`，足够 llms.txt 摘要需要

---

## 2. 任务清单（T1–T4）

### T1　MDX → MD 工具：`src/lib/content.ts` 新增 `getArticleMarkdown`

**为什么**：`llms-full.txt` 需要每篇文章的"纯 MD 正文"，不能直接复用 `Article.content`——后续若有 MDX 组件（阶段 4 可能加）会污染输出。先在工具层统一出口。

> 说明：`getArticleBySlug` 已经通过 `gray-matter` 完成 frontmatter 与正文的分离，`Article.content` 返回值即为纯正文。因此本函数的职责是：**在正文顶部追加最小元信息头，并做 `.trim()` + 末尾换行归一化**，不再做 frontmatter 剥离。阶段 4 若引入 JSX 组件，则在此处追加过滤逻辑。

**改动文件**：`src/lib/content.ts`

**新增函数**
```ts
/**
 * 返回一篇文章的 "LLM-friendly" Markdown：
 *  - 剥离 frontmatter
 *  - 保留正文（当前全部为纯 Markdown，未来若引入 JSX 组件需在此降级）
 *  - 顶部附带最小元信息头（title / url / publishedAt）
 */
export function getArticleMarkdown(
  locale: string,
  category: string,
  slug: string,
  siteUrl: string,
): string | null {
  const article = getArticleBySlug(locale, category, slug);
  if (!article) return null;

  const url = `${siteUrl}/${locale}${article.href}`;
  const header = [
    `# ${article.title}`,
    "",
    `> ${article.description}`,
    "",
    `- URL: ${url}`,
    `- Locale: ${locale}`,
    `- Published: ${article.publishedAt}`,
    article.updatedAt ? `- Updated: ${article.updatedAt}` : null,
    article.contentType ? `- Type: ${article.contentType}` : null,
    article.cluster ? `- Cluster: ${article.cluster}` : null,
    "",
    "---",
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return header + article.content.trim() + "\n";
}
```

**约束**
- **不读 env**：`siteUrl` 由调用者注入，方便测试与纯函数化
- 不要在此处加 cache：由 Route Handler 统一处理

**验证**
- `content.test.ts` 已有 `getArticleBySlug` 测试；本函数的测试归 T4

---

### T2　`/llms.txt` Route Handler

**新建文件**：`src/app/llms.txt/route.ts`

**为什么**：`llms.txt` 是 LLM 爬虫的事实标准入口（类似 `robots.txt`），内容是**给 LLM 看的人类可读 Markdown 索引**，列出站点结构与关键页面。

**内容规格**（参考 [llmstxt.org](https://llmstxt.org/)）
- 标题：`# GEO (kibouFlow)`
- 简介（blockquote 一段）
- 分节列出，按 `contentType` 分组：Primary / Cluster Entries / Judgment Frameworks / Concepts / FAQ / Cases
- 每条条目格式：`- [<title>](<absolute-url>): <description>`
- 同时输出 zh + ja 两套（各自独立分节，不混排）

**参考实现**
```ts
import { NextResponse } from "next/server";
import {
  getAllArticles,
  getArticlesByContentType,
  type ArticleMeta,
  type ContentType,
} from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibouflow.com";

const LOCALES = [
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
] as const;

const SECTIONS: { heading: string; contentType: ContentType }[] = [
  { heading: "Cluster Entries", contentType: "cluster" },
  { heading: "Judgment Frameworks", contentType: "framework" },
  { heading: "Concepts", contentType: "concept" },
  { heading: "FAQ", contentType: "faq" },
  { heading: "Cases", contentType: "case" },
];

function renderItem(a: ArticleMeta, locale: string): string {
  return `- [${a.title}](${SITE_URL}/${locale}${a.href}): ${a.description}`;
}

function renderLocale(locale: string, label: string): string[] {
  const lines: string[] = [];
  lines.push(`## ${label} (${locale})`, "");
  lines.push("### Primary");
  lines.push(`- [Home](${SITE_URL}/${locale})`);
  lines.push(`- [Guides](${SITE_URL}/${locale}/guides)`);
  lines.push(`- [FAQ](${SITE_URL}/${locale}/faq)`);
  lines.push("");

  for (const { heading, contentType } of SECTIONS) {
    const items = getArticlesByContentType(locale, contentType);
    if (items.length === 0) continue;
    lines.push(`### ${heading}`);
    for (const a of items) lines.push(renderItem(a, locale));
    lines.push("");
  }

  // 其他未进入 SECTIONS 的文章（problem / path / boundary 等通用正文）
  const known = new Set(SECTIONS.map((s) => s.contentType));
  const rest = getAllArticles(locale).filter(
    (a) => !a.contentType || !known.has(a.contentType),
  );
  if (rest.length > 0) {
    lines.push("### Other Articles");
    for (const a of rest) lines.push(renderItem(a, locale));
    lines.push("");
  }

  return lines;
}

export async function GET() {
  const body = [
    "# GEO (kibouFlow)",
    "",
    "> 面向"在日本发展"方向不清的人：先整理希望、再判断路径、再导向下一步。中日双语。",
    "",
    `- Site: ${SITE_URL}`,
    `- Full text: ${SITE_URL}/llms-full.txt`,
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
    ...LOCALES.flatMap(({ code, label }) => renderLocale(code, label)),
  ].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
```

> **Next 16 兼容性备注**：当前 `next.config.ts` 未启用 `cacheComponents`，因此 `export const dynamic = "force-static"` + `export const revalidate = 3600` 仍按 Route Segment Config 生效。若未来启用 Cache Components（`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md` 的 Version History 标注 v16.0.0 起 `dynamic / revalidate` 在 Cache Components 下移除），需迁移到 `'use cache'` + `cacheLife`。

**验证**
- `curl -I http://localhost:3000/llms.txt`：`Content-Type: text/plain; charset=utf-8`
- 正文包含 `# GEO (kibouFlow)` 与至少 2 个二级标题（中文 / 日本語）
- 所有 URL 绝对路径、以 `https://kibouflow.com` 开头（或 ENV 配置的域名）

---

### T3　`/llms-full.txt` Route Handler

**新建文件**：`src/app/llms-full.txt/route.ts`

**为什么**：`llms.txt` 让 LLM "看见路"，`llms-full.txt` 让 LLM "一次走完"。爬虫单次请求就能拿到所有正文，在 RAG 检索时直接命中 chunk。

**内容规格**
- 顶部站点简介 + 目录
- 按 locale 分段（`## Locale: zh` / `## Locale: ja`）
- 每篇文章用 `getArticleMarkdown()` 输出，文章间以 `\n\n---\n\n` 分隔
- 不做筛选，全量 46 篇

**参考实现**
```ts
import { NextResponse } from "next/server";
import { getAllArticles, getArticleMarkdown } from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kibouflow.com";

const LOCALES = ["zh", "ja"] as const;

export async function GET() {
  const chunks: string[] = [];

  chunks.push(
    [
      "# GEO (kibouFlow) — Full Content",
      "",
      "> 本文件是 kibouFlow 全站 Markdown 正文拼接，供生成式引擎一次性摄入。",
      `> 索引见 ${SITE_URL}/llms.txt，网站地图见 ${SITE_URL}/sitemap.xml。`,
      "",
    ].join("\n"),
  );

  for (const locale of LOCALES) {
    chunks.push(`\n\n## Locale: ${locale}\n`);
    const articles = getAllArticles(locale);
    for (const a of articles) {
      const [category, slug] = [a.category, a.slug];
      const md = getArticleMarkdown(locale, category, slug, SITE_URL);
      if (!md) continue;
      chunks.push(md);
      chunks.push("\n\n---\n\n");
    }
  }

  return new NextResponse(chunks.join(""), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
```

**边界处理**
- 文章按 `getAllArticles` 返回的默认排序（`publishedAt desc`），无需额外排序
- 若将来单篇 > 50KB，需考虑按 cluster 分片，但当前全量 < 200KB（46 篇 × 平均 2–4KB），不是问题
- `dynamic = "force-static"` + `revalidate = 3600` 让 Next.js 在构建时生成、每小时重校；内容极少变动，完全够用

> **Next 16 兼容性备注**：同 T2，当前未启用 `cacheComponents`，Route Segment Config 的 `dynamic / revalidate` 仍按常规语义生效；启用 Cache Components 后需迁移到 `'use cache'` + `cacheLife`。

**验证**
- `curl http://localhost:3000/llms-full.txt | wc -l`：行数 > 1000
- 随机 grep 一个已知句子（例如 `rg "先整理希望" llms-full.txt`），应至少命中 2 次（zh 首文章 + 可能的重复）
- 把输出直接丢给 ChatGPT / Claude，问"面向'在日本发展'方向不清的人"应能从中找到对应段落

---

### T4　集成测试：两条路由返回正确

**新建文件**：`tests/integration/llms.route.test.ts`

**测试点**
- `/llms.txt`：
  - 返回 200 + `text/plain`
  - 正文含 `# GEO`
  - 正文含至少一条已知 cluster 的 URL（例如 `/zh/guides/paths/job-prep-cluster-entry`）
  - 正文以 `NEXT_PUBLIC_SITE_URL`（或默认值）开头的绝对 URL
- `/llms-full.txt`：
  - 返回 200 + `text/plain`
  - 正文含某篇已知文章的标题（如 "日语学习路径 FAQ"）
  - 正文含对应文章的正文片段（如 "关键不是证书等级"）
  - 同时出现 zh 与 ja 分段标识

**参考骨架**

> 注：本仓库 `vitest.config.ts` 已启用 `globals: true`，测试文件内**不需要** `import { describe, it, expect }`，与 `tests/unit/content.test.ts`、`tests/integration/track.route.test.ts` 的现有风格保持一致。

```ts
import { GET as getLlms } from "@/app/llms.txt/route";
import { GET as getLlmsFull } from "@/app/llms-full.txt/route";

describe("/llms.txt", () => {
  it("returns plaintext index with known cluster entries", async () => {
    const res = await getLlms();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);

    const body = await res.text();
    expect(body).toContain("# GEO");
    expect(body).toContain("/zh/guides/paths/job-prep-cluster-entry");
    expect(body).toContain("/ja/guides/paths/job-prep-cluster-entry");
  });
});

describe("/llms-full.txt", () => {
  it("returns plaintext full corpus with zh and ja segments", async () => {
    const res = await getLlmsFull();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);

    const body = await res.text();
    expect(body).toContain("## Locale: zh");
    expect(body).toContain("## Locale: ja");
    expect(body).toContain("日语学习路径 FAQ");
    expect(body).toContain("关键不是证书等级");
  });
});
```

**同时新增**：在 `tests/unit/content.test.ts` 里追加一条 `getArticleMarkdown` 的基础断言（能读到一篇已知文章 + 头部含 URL + 不含 `---\ntitle:`）。

---

## 3. 推荐 PR 拆分

本阶段建议**单 PR** 提交：

### PR #3: `feat(geo): llms.txt and llms-full.txt routes`

包含：
- T1：`getArticleMarkdown`
- T2：`/llms.txt` 路由
- T3：`/llms-full.txt` 路由
- T4：集成测试 + 单测追加

**预估 diff**：约 200–300 行（绝大部分是路由实现与测试）。

> 不建议拆两个 PR——两条路由共享 `getArticleMarkdown`，分开会让 T1 单独上线时成为"无人使用的工具函数"，不优雅。

---

## 4. 执行顺序建议（1 人节奏）

| 天 | 任务 | 产出 |
|---|---|---|
| Day 1 上午 | T1 | `getArticleMarkdown` 实现 + 单测 |
| Day 1 下午 | T2 | `/llms.txt` 路由 + 本地验证 |
| Day 2 上午 | T3 | `/llms-full.txt` 路由 + 本地验证 |
| Day 2 下午 | T4 | 集成测试完成 + LLM 抽测 |
| Day 3 | Review + 修正 + 合并 | 生产环境可访问两条路由 |

---

## 5. 退出标准（Exit Checklist）

### 5.1 工程产出
- [ ] 访问 `https://<domain>/llms.txt` 返回 `text/plain; charset=utf-8`
- [ ] `llms.txt` 内容含 `# GEO (kibouFlow)` 与中日两套分节
- [ ] 访问 `https://<domain>/llms-full.txt` 返回 `text/plain; charset=utf-8`
- [ ] `llms-full.txt` 行数 > 1000，含全部 46 篇文章的标题
- [ ] 两条路由所有 URL 均为绝对路径，无 `localhost` / `your-domain.com`

### 5.2 内容质量
- [ ] 把 `llms-full.txt` 全文（或前 50KB）喂给 ChatGPT / Claude，询问 5 条核心 query，有 ≥ 4 条能从中找到直接答案：
  - "在日本先学日语还是先找工作？"
  - "方向不清时该怎么整理希望？"
  - "学到什么程度适合求职？"
  - "哪些信号说明暂不适合直接推进？"
  - "机构合作模式有哪几种？"

### 5.3 测试与 CI
- [ ] `npm run test:integration` 新增测试全绿
- [ ] `npm run test:unit` 新增 `getArticleMarkdown` 断言全绿
- [ ] 现有 E2E 未回归

### 5.4 可发现性
- [ ] `src/app/robots.ts` 的响应中**可以看到**（或下阶段补充）`llms.txt` 提示：
  - 可选做法：在 robots.ts 里加一条 `host` 后再 append 自定义 `LLM-Full: ${SITE_URL}/llms-full.txt` 注释——但 `MetadataRoute.Robots` 无官方字段，建议本阶段跳过，等阶段 3 或阶段 7 统一处理
  - **本阶段最小做法**：在 `llms.txt` 顶部放 `Full text: .../llms-full.txt`，互相引用就够了

### 5.5 性能
- [ ] `npm run build` 产物中 `/llms.txt` 与 `/llms-full.txt` 被识别为 static（或 ISR），不走动态 SSR
- [ ] 首字节时间 < 100ms：**必须在 `npm run build && npm run start` 或预览环境下验证**（`npm run dev` 会走动态执行路径，首字节不准，不作为验收依据）

---

## 6. 回滚方案

两条路由互不依赖，可单独回滚：

| 任务 | 回滚动作 |
|---|---|
| T1 `getArticleMarkdown` | `git revert`；无消费者会报错（其他位置未引用） |
| T2 `/llms.txt` | 删除 `src/app/llms.txt/route.ts`；`/llms.txt` 自动 404，爬虫行为退回阶段 1 状态 |
| T3 `/llms-full.txt` | 同上 |
| T4 测试 | `git revert` |

**整包回滚**：由于本阶段 PR 不改任何既有文件（只新增工具函数与路由），直接 `git revert` PR 即可，零副作用。

---

## 7. 本阶段"不做"的事（边界）

- ❌ 不引入 `remark` / `unified` / `strip-markdown` 等新依赖（当前 MDX 是纯 MD，直接透传即可）
- ❌ 不实现 JSX 组件过滤（本阶段 MDX 全为纯 MD，等阶段 4 引入 JSX 时再补）
- ❌ 不修改既有页面的 `<head>`（不加 `<link rel="alternate" type="text/plain" href="/llms.txt">`——目前无标准，避免验证器误报）
- ❌ 不新增 JSON-LD（阶段 3）
- ❌ 不按 cluster 分片生成 `llms-<cluster>.txt`（规模未到，YAGNI）
- ❌ 不对正文做 AI 摘要（保持 100% 人类可编辑内容，不引入生成环节）

> 抵抗"顺手加个 remark 做下 JSX 过滤"的冲动——当前 46 篇 MDX 全是纯 MD，加 remark 既拖慢构建又引入新依赖，阶段 4 真的需要时再做。

---

## 8. 与后续阶段的对接点

本阶段留下以下"接口"，供后续阶段直接使用：

| 资产 | 谁会用 |
|---|---|
| `getArticleMarkdown(locale, category, slug, siteUrl)` | 阶段 4 给 MDX 加 `tldr` 后，此函数需追加"头部补 tldr 到正文顶部"的一行，一处改动全量生效 |
| `/llms-full.txt` 稳定的绝对 URL 列表 | 阶段 6 的 `/answers` / `/glossary` 路由加入后，复用同一生成器扩展即可 |
| 集成测试 fixture（已知文章的正文片段断言） | 阶段 4 内容改造时用同一断言快速验证"正文是否仍可命中关键句" |

---

## 9. 上线后 48 小时观察项

1. **爬虫命中**：查看服务器/Vercel 访问日志，`/llms.txt` 与 `/llms-full.txt` 应被 `GPTBot` / `ClaudeBot` / `PerplexityBot` 命中（通常首次抓取发生在 24 小时内）
2. **CDN 缓存**：确认 `Cache-Control` 头生效，CDN 命中率 > 90%（两条路由访问频率低但响应体较大）
3. **内容正确性**：AI 抽测（阶段 5.2 的 5 条 query）结果稳定
4. **不产生 404**：旧版 `public/robots.txt` 被删后，robots.ts 中未意外保留对 `llms.txt` 的错误路径

48 小时稳定后可进入阶段 3（结构化数据组件层）。

---

## 附：关键命令速查

```powershell
# 本地验证（PowerShell 原生，仓库 shell 为 powershell）
Invoke-WebRequest http://localhost:3000/llms.txt -Method Head | Select-Object StatusCode, Headers
Invoke-WebRequest http://localhost:3000/llms-full.txt -Method Head | Select-Object StatusCode, Headers
(Invoke-WebRequest http://localhost:3000/llms.txt).Content | more
(Invoke-WebRequest http://localhost:3000/llms-full.txt).Content | Measure-Object -Line

# 首字节性能测量（需先 npm run build && npm run start）
Measure-Command { Invoke-WebRequest http://localhost:3000/llms.txt | Out-Null }
Measure-Command { Invoke-WebRequest http://localhost:3000/llms-full.txt | Out-Null }

# 打开浏览器查看
Start-Process http://localhost:3000/llms.txt
Start-Process http://localhost:3000/llms-full.txt

# 运行新增测试
npm run test:integration -- tests/integration/llms.route.test.ts
npm run test:unit -- tests/unit/content.test.ts

# 生产构建验证（确认被识别为静态/ISR）
npm run build
```

---

## 附：`llms.txt` 输出示例片段

```
# GEO (kibouFlow)

> 面向"在日本发展"方向不清的人：先整理希望、再判断路径、再导向下一步。中日双语。

- Site: https://kibouflow.com
- Full text: https://kibouflow.com/llms-full.txt
- Sitemap: https://kibouflow.com/sitemap.xml

## 中文 (zh)

### Primary
- [Home](https://kibouflow.com/zh)
- [Guides](https://kibouflow.com/zh/guides)
- [FAQ](https://kibouflow.com/zh/faq)

### Cluster Entries
- [求职准备主题入口](https://kibouflow.com/zh/guides/paths/job-prep-cluster-entry): …
- [日语学习路径主题入口](https://kibouflow.com/zh/guides/paths/japanese-learning-path-cluster-entry): …
…

### FAQ
- [日语学习路径 FAQ](https://kibouflow.com/zh/guides/boundaries/faq-japanese-path): 回答"学到什么程度适合求职、如何并行语言与求职"的高频问题。
…
```

这个结构让 LLM 爬虫能在**一次抓取**内理解整个站点的骨架，随后通过 `llms-full.txt` 一次性摄入全文，进入它自身的向量索引或训练语料。
