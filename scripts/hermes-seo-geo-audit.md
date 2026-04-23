# kibouFlow SEO / GEO 体检任务（Hermes 执行版）

> 请你作为一个 SEO / GEO 审计专家，对 https://kibouflow.com 进行一次完整的体检。
> 这是一个面向「在日本发展」主题的中日双语站点，语言为 zh 和 ja。
> 请严格按照以下步骤逐项检查，每一步都给出「通过 / 警告 / 失败」的判定和具体发现。

---

## 第一步：站点级基础设施检查

请依次访问以下 URL 并检查：

### 1.1 robots.txt
- 访问 `https://kibouflow.com/robots.txt`
- 检查：返回 200？内容是否为纯文本？
- 检查：是否包含 `Sitemap:` 指令且指向正确地址？
- 检查：是否对 `User-agent: *` 允许了 `/`？
- 检查：是否显式允许了 GPTBot、ClaudeBot、PerplexityBot、Googlebot？
- 检查：是否屏蔽了 Bytespider？
- 检查：域名是否为 `kibouflow.com` 而非占位符 `your-domain.com`？

### 1.2 sitemap.xml
- 访问 `https://kibouflow.com/sitemap.xml`
- 检查：返回 200？内容是否为 XML？
- 检查：总共包含多少个 `<url>` 条目？
- 检查：是否同时包含 `/zh/` 和 `/ja/` 的页面？
- 检查：是否包含 hreflang alternates（每个 URL 应有 zh、ja、x-default 三个 alternate）？
- 检查：x-default 指向哪里？
- 检查：文章页是否都有 `<lastmod>` 且日期合理（不是远未来的日期）？
- 检查：优先级（priority）是否合理？首页应为 1.0，其他页面 0.7-0.9。

### 1.3 llms.txt
- 访问 `https://kibouflow.com/llms.txt`
- 检查：返回 200？内容是否为纯文本？
- 检查：是否包含站点描述？
- 检查：是否列出了核心页面的链接和描述？
- 检查：是否覆盖了 zh 和 ja 两种语言？
- 检查：链接是否都是完整的绝对 URL（https://kibouflow.com/...）？

### 1.4 llms-full.txt
- 访问 `https://kibouflow.com/llms-full.txt`
- 检查：返回 200？
- 检查：内容是否包含完整的文章正文？
- 检查：长度是否合理（应该比 llms.txt 长很多）？

### 1.5 根域名重定向
- 访问 `https://kibouflow.com/`（注意不带语言前缀）
- 检查：是否自动重定向到 `/zh` 或 `/ja`？
- 检查：重定向状态码是什么？（建议 307 或 308）
- 检查：如果不重定向，根路径页面是什么内容？

---

## 第二步：首页检查

请分别检查中文和日文首页。

### 2.1 中文首页 `https://kibouflow.com/zh`
- 检查：HTTP 状态码是 200？
- 检查：`<html lang="zh">` 是否正确设置？
- 检查：`<title>` 是否有独立的、描述性的标题（不是通用的 "GEO"）？
- 检查：`<meta name="description">` 是否存在且有意义？长度是否在 40-160 字符之间？
- 检查：`<link rel="canonical">` 指向哪里？是否正确？
- 检查：是否有指向 `/ja` 的 `hreflang="ja"` 标签？
- 检查：是否有 `og:title`、`og:description`、`og:locale` 标签？
- 检查：是否有 `og:image`？如果没有，记为警告。
- 检查：页面是否有且仅有 1 个 `<h1>` 标签？内容是什么？
- 检查：是否有 JSON-LD `<script type="application/ld+json">`？如果有，包含哪些 @type？
- 检查：页面上有多少个指向 `/zh/guides/...` 的内链？列出它们。
- 检查：Footer 区域有哪些链接？是否有社交媒体链接？链接目标是否有效（不是 `https://x.com` 这样的占位符）？

### 2.2 日文首页 `https://kibouflow.com/ja`
- 执行与 2.1 相同的检查项
- 额外确认：`<html lang="ja">`、`og:locale` 应为 `ja_JP`

---

## 第三步：列表页检查

### 3.1 中文 Guides 页面 `https://kibouflow.com/zh/guides`
- 检查：HTTP 200？
- 检查：title、description、canonical、hreflang 是否正确？
- 检查：是否有 JSON-LD BreadcrumbList？面包屑层级是否为 首页 > 指南？
- 检查：页面上列出了多少篇文章？
- 检查：文章是否按类型分组展示（cluster、faq、framework、concept 等）？
- 检查：每篇文章是否都有可点击的链接？链接格式是否为 `/zh/guides/{category}/{slug}`？

### 3.2 日文 Guides 页面 `https://kibouflow.com/ja/guides`
- 执行与 3.1 相同的检查

---

## 第四步：内容页抽样检查

请从以下页面中**每种至少检查 1 个**，共检查 5-6 个页面：

**Cluster 入口页（选 1）：**
- `https://kibouflow.com/zh/guides/paths/job-prep-cluster-entry`
- `https://kibouflow.com/zh/guides/paths/japanese-learning-path-cluster-entry`
- `https://kibouflow.com/zh/guides/paths/direction-sorting-cluster-entry`

**问题类文章（选 1）：**
- `https://kibouflow.com/zh/guides/problems/resume-vs-japanese`
- `https://kibouflow.com/zh/guides/problems/when-not-to-apply`

**FAQ 类文章（选 1）：**
- `https://kibouflow.com/zh/guides/boundaries/faq-job-prep`
- `https://kibouflow.com/zh/guides/boundaries/faq-japanese-path`

**Framework 类文章（选 1）：**
- `https://kibouflow.com/zh/guides/paths/framework-japanese-or-job-first`

**Case 案例页（选 1）：**
- `https://kibouflow.com/zh/guides/cases/should-learn-japanese-first`

**日文对应页（选 1-2）：**
- `https://kibouflow.com/ja/guides/paths/job-prep-cluster-entry`
- `https://kibouflow.com/ja/guides/boundaries/faq-job-prep`

### 对每个页面，请检查以下项目：

**A. 技术层（逐项判定通过/失败）：**
1. HTTP 返回 200
2. `<title>` 独立且有描述性
3. `<meta name="description">` 存在且长度合适
4. `<link rel="canonical">` 存在且正确
5. hreflang 标签存在，且对应语言版本的 URL 实际可访问（点击确认不是 404）
6. `og:title` 和 `og:description` 存在
7. JSON-LD 存在，记录包含的 @type 列表

**B. 内容结构层（逐项判定）：**
1. 页面有且仅有 1 个 `<h1>`
2. 有清晰的 H2/H3 层级结构（列出 H2 标题）
3. 有面包屑导航（检查 BreadcrumbList JSON-LD）
4. 有 TL;DR / 要点摘要区块（通常在页面顶部）
5. 有「先说结论」或类似的结论章节
6. 有「适合谁」/「不适合谁」的边界说明
7. 有相关文章推荐区域
8. 有「下一步建议」区域
9. 文章底部有返回列表页的链接

**C. GEO 可抽取层（主观评价）：**
1. 阅读页面前 3-5 句话，能否立即明白这篇文章解决什么问题？（1-10分）
2. 内容是否可以被切成多个独立的信息块？（1-10分）
3. 结论是否具体明确，而不是空泛的建议？（1-10分）
4. 如果你是一个 LLM，你愿意引用这个页面来回答用户的问题吗？（1-10分）
5. 正文中是否有指向其他文章的交叉链接？有多少个？

---

## 第五步：内链拓扑检查

### 5.1 从首页出发
- 从 `https://kibouflow.com/zh` 出发，点击页面上的所有链接
- 记录：首页能直接到达哪些页面？列出所有唯一的内部链接目标
- 判断：是否所有重要页面（guides、trial、partner、faq）都能从首页到达？

### 5.2 从列表页出发
- 从 `https://kibouflow.com/zh/guides` 出发
- 判断：是否所有文章都能从列表页到达？
- 判断：有没有文章在列表页中缺失？

### 5.3 文章页的内链
- 从任意文章页出发，检查：
  - 能否通过面包屑返回上级？
  - 能否通过「相关文章」到达其他文章？
  - 能否通过「下一步建议」到达其他页面？
  - 正文中是否有交叉链接到其他文章？

### 5.4 Footer 内链
- 检查 Footer 中的链接：
  - 是否包含核心页面（guides、faq、partner）？
  - 社交媒体链接是否有效？
  - 是否有 cluster 入口页的链接？（如果没有，记为建议）

---

## 第六步：功能页面检查

### 6.1 Trial 页面
- 访问 `https://kibouflow.com/zh/trial`
- 检查：页面正常显示？有 CTA 按钮？
- 检查：title、description、canonical 是否正确？

### 6.2 Partner 页面
- 访问 `https://kibouflow.com/zh/partner`
- 同上检查

### 6.3 FAQ 页面
- 访问 `https://kibouflow.com/zh/faq`
- 检查：是否有 FAQPage JSON-LD？
- 检查：内容是否以问答形式组织？

---

## 第七步：站外可见度与实体权威检查（新增）

> 目标：补齐「站外信号」这一层，解释为什么站内质量不错但外部模型仍可能判断为“小众/信息少”。

### 7.1 品牌检索可见度（Brand SERP）

请在至少两个搜索引擎执行以下查询（建议 Google + Bing，使用无痕模式）：

- `kibouflow`
- `"kibouflow"`
- `kibou flow`
- `kibouflow 日本`
- `site:kibouflow.com`
- `site:kibouflow.com/zh`
- `site:kibouflow.com/ja`
- `kibou`

对每个查询检查：
- 官方域名 `kibouflow.com` 首次出现位置（Top1/Top3/Top10/未出现）
- Top10 中官方结果数量
- Top10 中无关结果数量（同名品牌、无关词条、噪音页面）
- 是否出现明确品牌歧义（如仅搜 `kibou` 时被其他实体占满）

判定建议：
- 通过：核心查询 `kibouflow` 在 Top3 出现官方页面，且 Top10 官方结果 >= 5
- 警告：能出现官方页面，但排名靠后或 Top10 官方结果 <= 4
- 失败：核心查询 Top10 未出现官方页面，或无关结果显著占优

### 7.2 收录覆盖与索引质量（Index Coverage）

检查：
- `site:kibouflow.com` 是否返回稳定可见的收录结果
- 关键 URL 是否可被检索到（至少检查以下 12 个）：
  - `/zh`、`/ja`
  - `/zh/guides`、`/ja/guides`
  - `/zh/trial`、`/zh/partner`、`/zh/faq`
  - 任意 5 篇中文文章（`/zh/guides/...`）
- 搜索结果摘要是否显示正确标题与描述（非空、非乱码、非错误标题）
- 抽样 URL 是否与 sitemap 中声明一致（存在于 sitemap 且可访问）

判定建议：
- 通过：关键 URL 可检索率 >= 80%
- 警告：关键 URL 可检索率在 40%-79%
- 失败：关键 URL 可检索率 < 40%，或 `site:` 几乎无结果

### 7.3 第三方实体锚点（Off-site Entity Anchors）

检查是否存在可被搜索引擎识别的第三方“实体锚点”，并记录链接：
- GitHub（组织/仓库/README）
- X（Twitter）账号主页
- LinkedIn（公司页或明确归属的个人职业页）
- 公开文档平台（如独立文档站、Notion 公布页、开发者平台）
- 媒体/社区提及（采访、播客、专栏、论坛高质量帖子）

对每个锚点检查：
- 是否明确提到 `kibouFlow` / `kibouflow`
- 是否指向官方域名 `https://kibouflow.com`
- 品牌描述是否与官网定位一致（不是冲突描述）

判定建议：
- 通过：>= 3 个独立域名的有效锚点，且描述一致
- 警告：仅有 1-2 个有效锚点，或一致性一般
- 失败：无有效第三方锚点

### 7.4 实体一致性（Entity Consistency）

对比官网、结构化数据、llms.txt、第三方资料，检查：
- 名称写法是否稳定（`kibouFlow` / `KibouFlow`，是否混用导致歧义）
- 一句话定位是否一致（给谁用、解决什么问题）
- `Organization` JSON-LD 是否包含足够 `sameAs`（建议 >= 2 个真实官方资料页）
- 是否有清晰的“谁在运营”信息（团队/主体/联系方式至少其一）
- 文章作者与发布主体是否自洽（避免 Person/Organization 混乱）

判定建议：
- 通过：命名、定位、主体信息高度一致
- 警告：存在轻度不一致或主体信息不够完整
- 失败：命名/定位明显冲突，无法建立稳定实体认知

### 7.5 名称歧义与混淆风险（Disambiguation）

围绕 `kibou`、`kibou flow`、`kibouflow` 分别检查：
- 是否容易与其他品牌/词条混淆
- 哪些修饰词能显著提高命中（如“在日本发展”“希望整理”“路径判断”）
- 官网标题与描述是否包含足够区分词

输出：
- 混淆风险评级：低 / 中 / 高
- 推荐品牌限定词（中日文各 3-5 个）

### 7.6 LLM 外部引用入口（Citation Entry Points）

检查是否有“站外可引用入口”可供模型建立信任链：
- 第三方页面是否出现对 kibouFlow 的引用或介绍
- 官方第三方资料是否反链到官网
- 是否存在“官网 -> 第三方资料 -> 官网”的闭环

判定建议：
- 通过：存在 >= 3 条可追溯引用链
- 警告：仅有 1-2 条引用链
- 失败：几乎无站外引用链

---

## 第八步：模拟 LLM 引用验证

请你扮演一个不了解 kibouflow 的用户，用以下问题分别在心里搜索刚才看到的网站内容，然后评估：

**测试问题（中文）：**
1. 在日本找工作，应该先改简历还是先学日语？
2. 什么情况下不应该立刻开始投简历？
3. 日语学习和求职准备可以同时进行吗？怎么安排？
4. 希望整理和路径判断有什么区别？
5. 有没有具体的案例可以参考？

**对每个问题，回答：**
- 网站中是否有能回答这个问题的页面？是哪个？
- 如果要引用该页面来回答用户，最适合引用的内容片段是什么？
- 引用时有什么困难？（比如结论不明确、信息分散在多个页面、缺少具体判断等）
- 改进建议是什么？

---

## 第九步：输出总结报告

请按以下格式输出最终报告：

```
## 体检总结

### 各层得分（满分 100）
- 技术可发现（15分）：__ / 15
- 页面可理解（25分）：__ / 25
- 内容可抽取（25分）：__ / 25
- 内容可引用（15分）：__ / 15
- 站外可见度与实体权威（20分）：__ / 20
- 总分：__ / 100

### 站外可见度快照（新增必填）
- brand_serp:
  - 核心查询：`kibouflow`
  - 官方首条结果位置：__
  - Top10 官方结果数：__
  - Top10 无关结果数：__
- index_coverage:
  - `site:kibouflow.com` 是否有稳定结果：是/否
  - 抽样关键 URL 总数：__
  - 可检索 URL 数：__
- entity_anchors:
  - 第三方有效锚点数：__
  - 代表性锚点链接（至少 3 条）：...
- disambiguation:
  - 混淆风险等级：低/中/高
  - 主要混淆对象：...
  - 推荐品牌限定词：...

### 发现的问题清单
按严重度排序：

#### 错误（必须修复）
1. ...

#### 警告（建议修复）
1. ...

#### 建议（锦上添花）
1. ...

### 错误优先级分组（用于修复排期）
- P0（阻断级，优先级最高）：
- P1（高优先级）：
- P2（中优先级）：

### 最高优先级错误组详单（如果存在错误则必填）
- 仅展开 1 组：即上面优先级最高且影响范围最大的错误组（通常是 P0）
- 必须写明：为什么它是当前最高优先级（影响面、风险、阻断性）
- 必须包含以下字段（字段名不要改）：
  - group_name:
  - priority:
  - impact_scope:
  - why_top_priority:
  - common_symptom:
  - likely_root_cause:
  - global_fix_strategy:
  - verification_plan:
- error_instances（至少 3 条，若不足则全列出），每条必须包含：
  - code:
  - page_or_file:
  - observed_evidence:
  - expected_behavior:
  - actionable_fix:

### 优先修复建议（Top 5）
1. ...
2. ...
3. ...
4. ...
5. ...

### 与上次检查的对比（如果适用）
- 新增问题：
- 已修复问题：
- 持续存在的问题：

### 机器可解析块（给后续 LLM 直接消费）
{
  "highest_priority_error_group": {
    "group_name": "...",
    "priority": "P0|P1|P2",
    "impact_scope": "...",
    "why_top_priority": "...",
    "likely_root_cause": "...",
    "global_fix_strategy": ["...", "..."],
    "verification_plan": ["...", "..."],
    "error_instances": [
      {
        "code": "...",
        "page_or_file": "...",
        "observed_evidence": "...",
        "expected_behavior": "...",
        "actionable_fix": "..."
      }
    ]
  }
}
```

---

## 执行说明

- 请逐步执行，不要跳过任何步骤
- 每一步给出具体的检查结果，不要只说「正常」，要写出看到了什么
- 如果某个页面加载失败或超时，记录为错误并继续下一项
- 如果某些检查需要查看页面源代码，请查看（比如 JSON-LD、meta 标签）
- 检查完成后给出完整的总结报告
- 如果发现特别严重的问题，在该步骤就立即指出
- 如果存在错误，务必优先展开「最高优先级错误组详单」，并提供可直接用于修复的证据与动作

---

*本检测脚本版本: v1.1*
*适用站点: kibouflow.com*
*最后更新: 2026-04-23*
