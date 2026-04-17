# GEO（Generative Engine Optimization）原理详解

> 本文解释 GEO 的底层工作机制，作为 [`geo-seo-optimization-plan.md`](./geo-seo-optimization-plan.md) 的理论支撑。
> 读完本文，你应当能独立判断任何一项 GEO 动作"为什么做、做不做、做了有多大收益"。

---

## 一、生成式引擎的工作流程（RAG 管线）

GEO 不是 SEO 的"改名版"，两者优化对象截然不同。要讲清原理，需要先拆开"生成式引擎**到底怎么给答案**"这个黑盒。

以 Perplexity、Google AI Overviews、ChatGPT Search、Bing Copilot 为代表的生成式搜索，本质都是同一套 **Retrieval-Augmented Generation（RAG）** 管线：

```
用户提问
  ↓
① 查询改写 / 拆解（Query Rewriting）
  ↓
② 多路召回（Retrieval：Web + 向量库 + 知识图谱）
  ↓
③ 片段抽取与重排（Chunking + Reranking）
  ↓
④ 证据注入 Prompt（Context Stuffing）
  ↓
⑤ LLM 生成答案 + 引用标注（Citation）
  ↓
返回给用户
```

**GEO 的全部工作，就是让你的页面在 ①–⑤ 这五个环节里都不掉队**。对应下去就是 GEO 的五大原理。

---

## 二、GEO 的五大核心原理

### 原理 1：可召回（Retrievability）——"先被捞出来"

第 ② 步召回时，引擎不看 PageRank，而是看**三条并行通道**：

| 通道 | 引擎看什么 | 对应 GEO 动作 |
|---|---|---|
| **传统 Web 索引** | Google / Bing 已索引的页面 | 保留 SEO 底盘：sitemap、robots、hreflang、内链 |
| **LLM 训练 / 抓取语料** | 自家爬虫（GPTBot、ClaudeBot、PerplexityBot、Google-Extended）能不能抓 | `robots.ts` 白名单 + `llms.txt` |
| **知识图谱 / 实体库** | Wikidata、Wikipedia、schema.org 标注的实体关系 | schema.org `about` / `mentions` / `sameAs` 指向 Wikidata QID |

> **关键结论**：SEO 能让你进 Google 索引，但 GEO 还要让你进 LLM 的"独立语料池"。这是为什么 `llms.txt` 重要——它是一条**绕开搜索引擎、直达 LLM 爬虫**的通道。

### 原理 2：可切块（Chunkability）——"能被干净地切下来"

第 ③ 步是 RAG 里最"物理"的一步：引擎把页面切成 **200–800 token 的片段**，再按相关度重排。切片算法对页面结构极其敏感：

- **有清晰 H2 / H3 的页面** → 每个标题下自然成为一块，语义完整
- **散文式长段落** → 被硬切，上下文破碎，相关度评分下降
- **代码块、列表、表格** → 通常作为一整块保留（高信息密度）
- **定义式句子**（"X 是 ……"）→ 被独立识别为"可摘录 atom"

所以 GEO 写作要求：

1. **每个 H2 都是一个独立可读单元**（不要跨 H2 依赖上下文）
2. **关键结论句独立成段**，不埋在长段中间
3. **FAQ 每条问答控制在 1–3 句答**（刚好一个 chunk）
4. **首段就是答案**（会被第一个 chunk 摘录到）

这解释了为什么方案里强调 `tldr`、步骤化框架、定义块——它们都在**主动降低被切碎的风险**。

### 原理 3：可抽取（Extractability）——"机器能看懂说了啥"

第 ③ 步重排时，引擎用**向量相似度 + 规则打分**混合。规则打分里权重最高的就是 **schema.org 结构化数据**，因为它让机器免于"猜"：

- 一页上写了十段，哪段是问题、哪段是答案？→ `FAQPage` 明确告诉它
- 一段步骤到底是菜谱还是决策流程？→ `HowTo.step[]` 明确
- "先整理希望"这个词组是动词短语还是术语？→ `DefinedTerm` 明确
- 这篇文章的主体是"在日求职"还是"日语学习"？→ `Article.about` 明确

> **schema.org 对 GEO 的意义 > 对 SEO 的意义**。
> SEO 时代 schema 只是"锦上添花"（换个富媒体摘要），GEO 时代它是**语义解释的唯一权威来源**——因为 LLM 不会读你的 CSS 类名，它只读结构化信号。

### 原理 4：可信（Citation-Worthiness）——"值不值得引用"

第 ⑤ 步生成答案时，LLM 会在多个候选片段里选"最值得挂 `[1][2]` 引用的那几段"。选择标准是**可信度启发式**：

- **时效性**：`datePublished` / `dateModified` 越新权重越高 → 所以 sitemap 的 `lastModified` 不能撒谎
- **作者权威性**：`author.@type = Person` + 作者页 > 光秃秃的 Organization
- **实体一致性**：同一站点反复正确提及同一组实体 → 被识别为"这个话题的专业站"
- **反向断言**：写了"什么情况不适用 / 我们不处理什么"的页面可信度远高于"什么都能做"的页面（LLM 对过度自信的内容有惩罚）
- **双语一致**：中日双语同步，且 hreflang 正确 → 区域权威度加权
- **匿名但可归因的案例**：比"成功学故事"更被信任

这就是为什么方案里反复强调 **E-E-A-T + `boundaries` 目录 + 作者页**——它们是在直接喂"可信度特征"给打分器。

### 原理 5：可归因（Attributability）——"被引用时链回来"

第 ⑤ 步还做一件事：**决定把引用锚点放在哪个 URL 上**。这里有两种极端情况：

- **URL 结构混乱、一页多主题**：引擎可能引用你，但链接挂在某个笼统的列表页上，用户点进来找不到答案 → 转化率为 0
- **一页一问、H1 即问题、URL 含语义 slug**：引擎会**精准地把锚点挂到这一页**，用户点进来第一眼就看到答案 → 高转化

这是"答案优先信息架构"（`/answers/<question>`、`/glossary/<term>`）的底层原理——**URL 粒度要匹配 LLM 引用粒度**。

---

## 三、GEO 与 SEO 的原理差异

| 维度 | SEO | GEO |
|---|---|---|
| 目标动作 | 被点击 | 被引用 / 被摘录 |
| 主要信号 | 链接权重（外链、PageRank） | 语义权重（schema、实体、结构） |
| 关键资产 | 关键词 + 外链 | 判断框架 + 定义 + FAQ |
| 爬虫 | Googlebot / Bingbot | GPTBot / ClaudeBot / PerplexityBot / Google-Extended |
| 索引形式 | 倒排索引（词到 URL） | 向量索引（语义到 chunk） |
| 页面粒度 | 一页覆盖一组关键词 | 一页回答一个问题 |
| 内容理想形态 | 长文 + 关键词密度 | 结构化 + 结论前置 + 反向断言 |
| 成功信号 | CTR、排名、自然流量 | AI referer 访问、被引用率、查询命中率 |
| 时效敏感度 | 中（爬虫慢） | 高（AI 偏好近 6–12 个月内容） |
| E-E-A-T 权重 | 高 | 更高（直接影响是否被挂引用） |

---

## 四、GEO 的一条底层公理

整套原理可以压缩成一句话：

> **GEO 的本质，是把"一个网页"重构为"一组带可信度标签的、可独立摘录的语义原子"。**

- **语义原子** = chunk 友好的段落 / 定义 / FAQ 条目 / 步骤
- **可信度标签** = schema.org + 作者 + 时间 + 实体对齐 + 边界声明
- **可独立摘录** = 脱离页面上下文也能作为答案读

用这条公理可以快速判断任何 GEO 动作是否值得做：

> **它是否让页面更原子化、更可信、更能独立成答？**
> 是 → 做；否 → 不做。

---

## 五、对照本项目（kibouFlow / GEO）

用上面五原理反观当前站点：

| 原理 | 当前得分 | 短板 |
|---|---|---|
| 可召回 | 6 / 10 | `llms.txt` / AI 爬虫白名单缺失 |
| 可切块 | 7 / 10 | 首段无 TL;DR，部分框架页缺步骤结构 |
| 可抽取 | 3 / 10 | 除基础 Article schema 外，FAQ / HowTo / Breadcrumb 全缺 |
| 可信 | 4 / 10 | 作者是 Organization、sitemap 时效撒谎、无边界声明展示 |
| 可归因 | 6 / 10 | URL 结构合理，但 FAQ 未拆成单问答页，粒度偏大 |

优化方案里 W1–W6 的每一项动作，都在这个矩阵的某一格上加分：

- **W1（`llms.txt` / `robots.ts` / sitemap 新鲜度）** → 修复"可召回"与"可信"
- **W2（schema 升级）** → 修复"可抽取"
- **W3（内容可抽取性）** → 修复"可切块"
- **W4（E-E-A-T + 实体层）** → 修复"可信"
- **W5（答案页 / 术语页）** → 修复"可归因"
- **W6（监测 + topic hub）** → 形成闭环反馈

这样就能理解：**先做 `llms.txt` + schema 升级 + sitemap 修复**，是因为它们分别击中 "可召回 + 可抽取 + 可信" 三块最大的短板，投入产出比最高。

---

## 六、延伸阅读 / 验证方法

- **验证可召回**：用 `site:kibouflow.com` 在 Perplexity / Google AIO 里提问核心 query，看是否返回结果
- **验证可切块**：把页面 URL 丢给 ChatGPT / Claude，问"这篇文章的核心结论是什么"，看能否精准摘出 TL;DR
- **验证可抽取**：用 [Google 富媒体结果测试](https://search.google.com/test/rich-results) 和 [Schema Markup Validator](https://validator.schema.org/) 检查
- **验证可信**：在 Perplexity 问"在日求职机构合作怎么选"，看是否把本站列入引用清单
- **验证可归因**：检查 AI 返回引用时锚定的 URL，是否刚好是对应的问答页 / 框架页

建议每月跑一次上述 5 项验证，形成 GEO 体检报告。
