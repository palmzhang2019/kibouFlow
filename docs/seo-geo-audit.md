# kibouflow SEO / GEO 审计方法与发现

> 本文档整合自 `seo-advice-01.md`（检测方法论）与 `seo-advice-02.md`（审计发现）。

---

## 一、检测方法论

### 目标

对于 `https://kibouflow.com/zh` 和 `https://kibouflow.com/ja` 这样的中日双语内容站，最实用的检测方式不是只看一个"SEO 分数工具"，而是建立一套 **可重复执行的 SEO + GEO 体检流程**。

项目本身已具备的基础设施：
- 中日双语路由
- `robots.txt` / `sitemap.xml` / `llms.txt` / `llms-full.txt`
- JSON-LD 结构化数据
- MDX 内容体系
- `admin/geo-audit` 后台

---

## 二、四层检测框架

不要把 SEO 和 GEO 混成一个分数。建议拆成 4 层。

### 1. 技术可发现

检查搜索引擎和 LLM 爬虫能不能发现你的网站内容。

重点检查这些地址是否正常：
- `https://kibouflow.com/robots.txt`
- `https://kibouflow.com/sitemap.xml`
- `https://kibouflow.com/llms.txt`
- `https://kibouflow.com/llms-full.txt`

这一层主要关注：是否可访问、返回是否为 200、是否输出正确内容、是否包含站点真实域名。

### 2. 页面可理解

检查页面对搜索引擎和大模型来说，是不是结构清楚、语义明确。

重点看：
- 页面 title 是否独立
- description 是否独立
- canonical 是否正确
- hreflang 是否正确区分 `zh` / `ja`
- 是否有 JSON-LD
- 是否存在面包屑
- H1 / H2 / H3 层级是否清晰

### 3. 内容可抽取

这是 GEO 非常关键的一层。不是页面"能打开"就够了，而是模型能不能顺手把答案抽出来。

重点检查：
- 页面有没有 TL;DR
- 有没有结论区
- 有没有 `suitableFor` / `notSuitableFor` / `next steps`
- 段落是不是过长
- FAQ / framework / cluster / case 等内容类型是否清晰
- 页面开头能不能迅速说清"这页解决什么问题"

### 4. 内容可引用

这是 GEO 比传统 SEO 更难的一层。不是"有内容"就够，而是模型是否愿意引用你。

重点检查：
- 有没有作者 / 组织归因
- 结论是否明确
- 有没有边界说明
- 是否避免空泛长段落
- 是否有案例、FAQ、框架、定义页等可引用结构
- 是否有站内内链支持理解上下文

---

## 三、检测执行步骤

### 第一步：跑站内 GEO 体检后台

操作入口：`https://kibouflow.com/zh/admin/login`，登录后进入 `/{locale}/admin/geo-audit/run` 运行体检。

后台会输出：五维分数、历史记录、结构化问题列表（issues）、问题代码、严重度、修复建议。

### 第二步：做一轮外部可见性检查

手动检查这些页面：
- `https://kibouflow.com/robots.txt`
- `https://kibouflow.com/sitemap.xml`
- `https://kibouflow.com/llms.txt`
- `https://kibouflow.com/llms-full.txt`
- `https://kibouflow.com/zh` 和 `/ja` 首页
- `https://kibouflow.com/zh/guides` 和 `/ja/guides`
- 抽查 3～5 篇文章页
- 抽查 1 个 FAQ 页
- 抽查 1 个 framework / cluster 页

### 第三步：做一轮真实搜索 / 真实提问验证

**SEO 验证**（去搜索引擎测试）：
- `site:kibouflow.com 简历 日语 日本 就职`
- `site:kibouflow.com 希望整理`
- `site:kibouflow.com 日本 求职 路径`

**GEO 验证**（拿真实问题去问大模型）：
- 在日本找工作应该先改简历还是先补日语？
- 日语学习和求职准备怎么并行？
- 什么情况下不适合立刻投简历？
- 路径判断和希望整理有什么区别？

---

## 四、自检打分表

每个页面都可以按这个表自检。

| 维度 | 分值 | 检查项 |
| --- | --- | --- |
| **技术层** | 20分 | 200 正常访问、title 独立、description 独立、canonical 正确、hreflang 正确、JSON-LD 存在、robots/sitemap/llms 可发现 |
| **内容结构层** | 30分 | 有 TL;DR、有结论区、有 suitableFor、有 notSuitableFor、有 next steps、H2/H3 清楚、段落不过长 |
| **GEO 抽取层** | 30分 | 开头 3～5 句能说明核心问题、页面可被切成多个清晰信息块、FAQ/框架/步骤/案例/定义等块足够明确、内容不是只有观点还有判断依据、结论不是模糊空话 |
| **可引用层** | 20分 | 有组织/作者归因、有边界说明、有相关页面内链、有案例或可验证判断、不是纯营销页 |

**评分解释**：
- **80 分以上**：可视为合格上线
- **90 分以上**：可视为优先推给搜索和模型的核心页

---

## 五、审计发现（来自 seo-advice-02.md）

### 1. 网站结构（Site Architecture）

**已做好**：
- URL 结构清晰，层级合理：`/{locale}/guides/{category}/{slug}`
- 分类明确（problems、paths、boundaries、cases）
- `generateStaticParams` 正确实现，所有文章页静态生成

**需要关注**：
- 根域名 `https://kibouflow.com/` 没有内容或重定向逻辑：需要确认根 `/` 是否 301 重定向到 `/zh`
- category 层级没有独立页面（`/zh/guides/problems`、`/zh/guides/paths`），目前只是锚点

### 2. 首页（Homepage）

**已做好**：
- 有 generateMetadata，包含 title、description、OG 标签、canonical、hreflang alternates
- OrganizationJsonLd 在首页输出
- 页面结构有 Hero → Problem → Value → Flow → Audience → GuidesPreview → CTA

**需要关注**：
- 首页 H1 标签：需要确认 HeroSection 组件中是否有语义清晰的 `<h1>`
- GuidesPreview 内链数量偏少（只链接了 3 个 cluster entry）
- **OG Image 缺失**：当链接被分享到社交媒体时，没有图片预览会显著降低点击率

### 3. 内容页（Article Pages）

**已做好**：
- 每篇文章都有 ArticleJsonLd、BreadcrumbJsonLd、FAQPageJsonLd、HowToJsonLd、DefinedTermJsonLd
- canonical URL、hreflang alternates 正确配置

**需要关注**：
- hreflang 假设 zh/ja 版本 slug 完全一致：如果某篇文章只有中文没有日文，hreflang 会指向 404
- Twitter Card 未显式配置
- meta description 长度需要控制在 120-160 字符（中文约 60-80 字）

### 4. 列表页（Guides Index Page）

**需要关注**：
- 列表页没有 CollectionPage 或 ItemList 结构化数据
- 分类锚点（`/zh/guides#problems`）不可被爬虫直接发现

### 5. 页面之间的内链（Internal Linking）

**需要关注**：
- Footer 内链偏少：只有 guides、faq、partner 三个链接
- **Footer 的 X 链接写死为 `https://x.com`**：应该指向实际 X 账号或环境变量未配置时不渲染
- 文章正文内的交叉链接：纯靠组件级的 relatedArticles 推荐是不够的

### 6. 技术 SEO

**做得好**：
- Sitemap 中每个 locale 的文章都独立出现并带有 hreflang alternates
- Robots.txt 显式允许主要 AI 爬虫，屏蔽 Bytespider
- llms.txt / llms-full.txt 实现非常规范
- JSON-LD 结构化数据覆盖了 WebSite、Organization、Article、BreadcrumbList、FAQPage、HowTo、DefinedTerm 七种 schema

**缺失的技术项**：
- `<html lang>` 值建议用 BCP 47 格式（如 "zh-Hans" 而非 "zh"）
- 没有看到自定义 404 页面的处理
- 没有看到图片优化策略（确保使用 `<Image>` 组件并填写有意义的 alt）

### 7. 页面性能（Core Web Vitals）

从代码结构看：
- SSG 静态生成 — 性能应该很好
- 客户端 JS 最小化 — 只有少量组件是 "use client"

建议在 Google PageSpeed Insights 跑一下 `https://kibouflow.com/zh` 和几个文章页。

---

## 六、优先级排序的行动建议

### 高优先级（建议尽快处理）

1. 确认根域名 `/` 的重定向行为是否正确
2. 验证 zh/ja 文章是否一一对应，避免 hreflang 指向 404
3. 修复 Footer 的 X 链接占位符
4. 为首页和主要页面添加 OG Image

### 中优先级（对排名有持续帮助）

5. 在 MDX 正文中增加文章间的交叉链接
6. Footer 增加 cluster entry 内链
7. 首页增加更多内容入口（"最近更新"/"热门问题"）
8. 为文章的 meta description 做长度检查和优化

### 低优先级（锦上添花）

9. 添加显式的 Twitter Card meta 标签
10. 为列表页添加 ItemList 结构化数据
11. 考虑自定义 404 页面
12. 等内容量增长后为分类创建独立页面

---

## 七、最重要的一点

**SEO 更偏"能不能被发现"，GEO 更偏"被发现后能不能被理解和引用"。**

检测方法不能只看传统项（title、description、sitemap、收录），还必须检查 GEO 项：
- 页面是否一上来就能回答问题
- 内容块是否适合抽取
- 文章是否有明确结论和边界
- 网站是否提供 `llms.txt` / `llms-full.txt`
- FAQ / framework / cluster / case 等内容类型是否形成"引用友好结构"

---

## 八、一句话总结

对于 `kibouflow.com`，最合适的检测方法是：

1. **先检查站点级入口是否正常**
2. **再用自己的 `admin/geo-audit` 跑规则体检**
3. **再用人工抽查验证页面结构**
4. **最后用真实搜索和真实问答验证 SEO / GEO 效果**

这样做，才能同时覆盖：技术抓取、页面理解、内容抽取、内容引用。

---

## 变更日志

| 日期 | 变更 | 备注 |
| --- | --- | --- |
| 2026-04-24 | 合并版：整合 seo-advice-01.md 与 seo-advice-02.md | 文档治理 |
