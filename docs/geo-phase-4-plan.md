# GEO 第四阶段实施计划：内容层改造（LLM 友好结构）

> 本文件是 [`geo-implementation-phases.md`](./geo-implementation-phases.md) 中 **阶段 4** 的展开版。
> 目标读者：**工程（frontmatter、渲染、校验、与 schema 对接）** + **编辑（文案、tldr、结构统一）**。
>
> 本阶段的特征：**工程先行、内容分批回填**；与阶段 3（JSON-LD / 抽取器）**解耦**——阶段 3 可先上线，阶段 4 在 `ArticleJsonLd` 已存在的前提下扩展 `abstract` 等字段即可。

---

## 0. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | Phase 4 / 内容层改造 |
| 预估工时 | **工程 2–4 人日** + **内容 3–8 人日**（视双语是否同一人、是否并行） |
| 改动类型 | **工程 + 内容**（MDX 批量改 frontmatter + 部分正文结构） |
| 风险等级 | 低（工程）；中（内容质量与双语一致性） |
| 优先级 | P0（GEO「可切块 / 首段结论」的核心落地） |
| 前置依赖 | **阶段 3 建议已完成**（`ArticleJsonLd` 等已组件化，便于挂 `abstract`）；未合并时可在本阶段 PR 内一并补 `abstract`。 |
| 后置阻塞 | **阶段 5**（`author: slug`、Person schema）会复用本阶段 frontmatter 扩展位 |

**一句话目标**：让每篇 MDX 具备 **可被 LLM 稳定摘录的「结论前置」信号**（`tldr` + 页面展示 + schema），并把 **framework / concept / case** 三类模板的正文结构统一到抽取器与人工阅读都友好的形态。

---

## 1. 现状与范围（与仓库对齐）

### 1.1 Frontmatter 现状（`src/lib/content.ts`）

当前 `ArticleFrontmatter` 已含：`title`、`description`、`category`、`slug`、`publishedAt`、`updatedAt?`、`contentType?`、`cluster?`、`audience?`、`suitableFor?`、`notSuitableFor?`、`relatedSlugs?`、`ctaType?`。

**本阶段新增（首版）**
- `tldr?: string` — 40–120 字，**结论 + 条件**句式，中日各自撰写
- （可选，为阶段 5 预埋，可不写）`author?: string` — 作者 slug，阶段 5 再强制

### 1.2 内容体量（截至当前 `content/**`）

| 类型 | 说明 | 文件数（约） |
|---|---|---|
| 全库 MDX | zh + ja 对称 | **46**（23 locale × 2） |
| `contentType: "framework"` | 当前仅 **2 个 slug** × 双语 = **4 文件** | `framework-japanese-or-job-first`、`framework-not-ready-signals` |
| `contentType: "concept"` | **2 个 slug** × 双语 = **4 文件** | `concept-hope-sorting`、`concept-path-judgment` |
| `contentType: "case"` | **3 个 slug** × 双语 = **6 文件** | 含 `case-library` 索引页 |

> 历史文档中「5 篇 framework」与当前仓库不一致：**以本表为准**；若后续新增第 3 个 framework slug，模板与验收清单同步追加即可。

### 1.3 渲染与 SEO 现状

- `ArticleLayout`（`src/components/article/ArticleLayout.tsx`）当前**无** `tldr` 展示区。
- 文章页 `generateMetadata` 仍可使用 `description`；**可选**将 OG `description` 与 `tldr` 对齐（需产品确认是否取代长 `description`）。

---

## 2. 任务清单（工程 E1–E5 + 内容 C1–C4）

### E1　扩展类型与归一化：`ArticleFrontmatter.tldr?`

**文件**：`src/lib/content.ts`

**动作**
- 在 `ArticleFrontmatter` 增加 `tldr?: string`
- `normalizeFrontmatter` 中**不**填默认值；保持 `undefined` 即「尚未回填」

**验收**
- 无 `tldr` 的旧 MDX 仍能 `getArticleBySlug` 正常加载

---

### E2　校验与 CI 信号：`warn` → `error` 两档

**文件（择一或组合）**
- `tests/unit/content.test.ts`：新增 `describe("tldr coverage")`，**第一阶段**仅 `console.warn` 或收集缺失列表 `expect(failures).toEqual([])` 前先 `test.skip` / 用 env `STRICT_TLDR=1` 控制
- 或 `scripts/check-tldr.mjs`：`node scripts/check-tldr.mjs` 在 CI 中调用

**推荐策略**
1. **PR A（工程）**：合并类型 + 布局 + schema，**不**强制 46 篇全有 `tldr`，CI 为 **warn**（打印缺失 slug 列表，exit 0）
2. **PR B–D（内容分批）**：每批合并后缺失数下降
3. **收尾 PR**：缺失为 0 时，将单测改为 **error**（缺失即红）

---

### E3　`ArticleLayout`：展示 `tldr` + 可选「更新」文案

**文件**：`src/components/article/ArticleLayout.tsx`  
**文案**：`src/messages/zh.json` / `ja.json`（如 `guides.tldrLabel`、`guides.publishedAt`）

**UI 建议**
- 在 `h1` 下方、`description` 或正文前，增加 `<p className="… lead">` 或 `<aside>`，展示 `tldr`（若存在）
- 展示 `publishedAt`，若存在 `updatedAt` 且与 `publishedAt` 不同，展示「更新于 …」（与阶段 5 的完整 E-E-A-T 块可并存，本阶段保持轻量）

**无障碍**
- 若用 `aside`，保证标题层级不乱跳

---

### E4　`ArticleJsonLd`：`abstract` ← `tldr`

**文件**：`src/components/seo/ArticleJsonLd.tsx`（阶段 3 已抽离的前提下）

**动作**
- 当 `article.tldr` 存在时，输出 `abstract: article.tldr`（schema.org `Article` 支持 `abstract`）
- 不存在时省略 `abstract`，避免空字符串

**与 `description` 关系**
- `description` 继续用 frontmatter `description`（偏 SEO 摘要）；`abstract` 用 `tldr`（偏 LLM 首段摘录）

---

### E5　`getArticleMarkdown`（阶段 2）：头部注入 `tldr`

**文件**：`src/lib/content.ts` —— `getArticleMarkdown`

**动作**
- 在元信息头中增加一行：`- TL;DR: …`（当 `article.tldr` 存在时）

**验收**
- `tests/unit/content.test.ts` 或 `tests/integration/llms.route.test.ts` 抽样断言 `llms-full` 或单函数输出含 `TL;DR`

---

### C1　`tldr` 写作规范（编辑 SOP）

**长度**：40–120 字（中日分别计数；日文按字符数大致同量级）。

**句式模板（中文示例）**
- 「若你 {状态}，应先 {动作 A}，再 {动作 B}；若 {条件}，则不适合 {动作 C}。」
- 避免营销套话、避免「联系我们」类 CTA 写进 `tldr`。

**与 `description` 分工**
- `description`：仍可稍长，用于卡片 / meta description
- `tldr`：**仅回答**「读完这篇我应记住的一句话判断是什么」

**双语**
- zh / ja **语义对齐**；允许日文更敬体，但**判断条件**须一致，避免 hreflang 语义漂移

---

### C2　分批回填 `tldr`（推荐顺序）

| 批次 | 范围 | 篇数（每 locale） | 理由 |
|---|---|---|---|
| **Batch 1** | 全部 `contentType: "faq"` + 全部 `cluster` 入口 | 高优先级摘录面 | |
| **Batch 2** | 全部 `framework` + `concept` | HowTo / 定义块依赖 | 当前每 locale 约 2+2 篇 |
| **Batch 3** | 其余 `problem` / `path` / `boundary` / `case`（含 `case-library`） | 扫尾 | |

每批建议：**同一 PR 内 zh + ja 对称提交**，避免一半语言缺 `tldr`。

---

### C3　`framework-*` 正文模板统一（4 文件 × 结构一致）

**目标**：阶段 3 的 **HowTo 抽取器**能稳定抽出 **≥ 3** 个 `step`（若阶段 3 阈值是 2，以阶段 3 文档为准；本阶段以 **≥3** 为内容验收推荐值）。

**推荐 Markdown 骨架（中文标题可换成日文同构）**

```md
## 判断框架

1. **第一步**：…
2. **第二步**：…
3. **第三步**：…

## 适用场景

- …

## 不适用场景

- …

## 常见误区

- …

## 下一步建议

…
```

**注意**
- 「推荐阅读顺序」若保留，请使用 **有序列表 `1.`**，与 cluster 入口一致，便于抽取器复用

---

### C4　`concept-*` 与 `cases/*` 模板

**Concept（4 文件）**
- 在正文首段前增加 **Definition Block**（引用块或加粗定义行），示例：
  > **希望整理**：在方向不清时，把「想要 / 约束 / 时间窗口」分项列出，再判断路径，而不是直接行动。

**Case（6 文件中除索引外的叙事页 + 索引页）**
- 对 **案例叙事页**（如 `should-learn-japanese-first`、`direction-unclear-sorted`）：增加短字段块（可用二级标题统一）：
  - `## 判断摘要` 或 frontmatter 扩展 `judgmentBy` / `judgedAt`（**若走 frontmatter**，需工程在 E1 增加字段并在 Layout 展示；**首版建议仅用正文标题**，减少工程扩散）
- 对 **`case-library`**：保持索引性质；`tldr` 写清「本页是案例库导航，不是单一案例」

---

## 3. PR / 分支策略（推荐）

| PR | 内容 | 合并策略 |
|---|---|---|
| **PR-E1** | E1 + E3 + E4 + E5 + messages + 单测（warn 档） | 可立即合并，不要求全文 `tldr` |
| **PR-C1** | Batch 1：仅 MDX（zh+ja） | 内容 review |
| **PR-C2** | Batch 2 + C3 结构统一 | 合并后跑阶段 3 HowTo 单测 / Rich Results 抽测 |
| **PR-C3** | Batch 3 + C4 | 收尾 |
| **PR-E2** | E2 升级为 strict：缺 `tldr` CI 即红 | 仅当 46/46 齐备后合并 |

---

## 4. 执行顺序（建议）

```
E1 类型扩展
  → E3 布局展示
  → E4 schema abstract
  → E5 llms-full 头部
  → E2 warn 档单测/脚本
        ↓
C1 规范对齐（编辑）
        ↓
C2 Batch 1 MDX PR
        ↓
C3 framework 模板 + Batch 2
        ↓
C4 concept/case + Batch 3
        ↓
E2 strict 收尾
```

---

## 5. 退出标准（Exit Checklist）

### 5.1 数据完整性
- [ ] 全部 **46** 个 MDX 文件均含非空 `tldr`（zh 23 + ja 23）
- [ ] 任意一篇 `tldr` 不在正文重复粘贴整段（避免重复惩罚；允许与首段语义接近但字面不同）

### 5.2 结构与抽取
- [ ] 全部 **framework** MDX（当前 4 文件）采用 C3 骨架，HowTo 抽取 **≥3 steps**（以阶段 3 单测为准）
- [ ] 全部 **concept** MDX（4 文件）含 Definition Block
- [ ] **case** 叙事页（4 文件，排除纯索引的 2 个 `case-library` 若算叙事则 4 叙事——实际 2 slug 叙事 ×2 locale=4 + case-library 2）——验收表建议简化为：**2 篇叙事案例 × 双语** 有「判断摘要」类小节；**case-library** 有导航向 `tldr`

### 5.3 工程与测试
- [ ] 文章页可见 `tldr`（有字段时）
- [ ] `ArticleJsonLd` 在存在 `tldr` 时含 `abstract`
- [ ] `getArticleMarkdown` 输出含 `TL;DR` 行（存在时）
- [ ] CI：`STRICT_TLDR=1` 或等价单测全绿

### 5.4 人工抽检（GEO）
- [ ] 随机抽 **5** 篇，将正文（或 `llms-full` 片段）喂给 ChatGPT / Claude，问「这篇文章一句话结论是什么？」——回答应与该文 `tldr` **语义一致**（允许措辞不同）

---

## 6. 回滚方案

| 变更 | 回滚 |
|---|---|
| 仅增加可选 `tldr` 字段 | 移除 frontmatter 行即可；类型回退 `git revert` |
| Layout / schema | `git revert` 对应 PR |
| 已 strict 的 CI | 改回 warn 档，不删内容 |

---

## 7. 本阶段「不做」清单

- ❌ 不上线作者页、不把 `author` 改为 `Person`（**阶段 5**）
- ❌ 不加 `entities` / Wikidata（**阶段 5**）
- ❌ 不新建 `/answers`、`/glossary`（**阶段 6**）
- ❌ 不大改 MDX 内链策略（仅允许为模板结构服务的小改）
- ❌ 不用 LLM 批量生成全站 `tldr` 不经人工审（若使用 AI 辅助，必须 **逐篇人工校对**）

---

## 8. 与相邻阶段对接

| 本阶段产出 | 消费者 |
|---|---|
| `tldr` + `abstract` | 搜索引擎摘要实验、LLM 首段摘录 |
| `getArticleMarkdown` 中的 TL;DR 行 | `/llms-full.txt` 摄入质量提升 |
| framework 统一列表结构 | 阶段 3 `HowTo` 抽取稳定 |
| 可选 `author` frontmatter（若提前加） | 阶段 5 `ArticleJsonLd` 切换 `Person` |

---

## 9. 编辑协作清单（可复制到 Issue）

- [ ] 确认 `tldr` 字数与语气规范（C1）
- [ ] Batch 1：faq + cluster（每文 zh + ja）
- [ ] Batch 2：framework + concept + 模板统一（C3/C4）
- [ ] Batch 3：其余类型 + case-library 文案
- [ ] 双人交叉校对：随机 10 篇中日语义对齐
- [ ] 合并收尾 PR 前：全量 grep `tldr:` 非空

---

## 附：关键路径索引

| 用途 | 路径 |
|---|---|
| Frontmatter 类型 | `src/lib/content.ts` |
| 文章布局 | `src/components/article/ArticleLayout.tsx` |
| 文案 | `src/messages/zh.json`、`src/messages/ja.json` |
| Article JSON-LD | `src/components/seo/ArticleJsonLd.tsx` |
| LLM 全文导出 | `src/lib/content.ts` → `getArticleMarkdown`；`src/app/llms-full.txt/route.ts` |
| 内容库 | `content/zh/**`、`content/ja/**` |
| 单测 / 校验 | `tests/unit/content.test.ts`、`scripts/check-tldr.mjs`（若建） |
