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

## 第七步：模拟 LLM 引用验证

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

## 第八步：输出总结报告

请按以下格式输出最终报告：

```
## 体检总结

### 各层得分（满分 100）
- 技术可发现（20分）：__ / 20
- 页面可理解（30分）：__ / 30
- 内容可抽取（30分）：__ / 30
- 内容可引用（20分）：__ / 20
- 总分：__ / 100

### 发现的问题清单
按严重度排序：

#### 错误（必须修复）
1. ...

#### 警告（建议修复）
1. ...

#### 建议（锦上添花）
1. ...

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
```

---

## 执行说明

- 请逐步执行，不要跳过任何步骤
- 每一步给出具体的检查结果，不要只说「正常」，要写出看到了什么
- 如果某个页面加载失败或超时，记录为错误并继续下一项
- 如果某些检查需要查看页面源代码，请查看（比如 JSON-LD、meta 标签）
- 检查完成后给出完整的总结报告
- 如果发现特别严重的问题，在该步骤就立即指出

---

*本检测脚本版本: v1.0*
*适用站点: kibouflow.com*
*最后更新: 2026-04-22*
