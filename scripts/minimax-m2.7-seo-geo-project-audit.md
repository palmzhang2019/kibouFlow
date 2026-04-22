# kibouFlow SEO / GEO 项目体检任务（项目根目录执行版，适配 MiniMax M2.7）

> 请你作为一个 SEO / GEO 审计代理，在 **当前项目根目录** 中对 `kibouFlow` 进行一次完整体检。
> 这不是线上网站巡检，不要默认访问 `https://kibouflow.com`，而是基于 **仓库源码、内容文件、本地命令输出、测试结果** 做检查。
> 目标项目是一个面向「在日本发展」主题的中日双语站点，语言为 `zh` 和 `ja`，技术栈为 `Next.js 16 + React 19 + next-intl + MDX`。
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，减少主观发挥；每一步都输出 `通过 / 警告 / 失败 / 阻塞` 的判定，并附上具体证据。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界
- 工作目录必须是项目根目录。
- **不要把线上网站返回结果当作检查依据**。
- 优先依据以下来源：
  - 仓库源码
  - `content/` 下的 MDX 内容
  - `tests/` 下的自动化测试
  - `scripts/` 下的本地体检脚本
  - `package.json`、`README.md`、`.env.example`

### 0.2 允许的动作
- 可以读取文件、搜索代码、统计文件数量、运行构建和测试命令。
- 可以运行项目内现有审计脚本。
- **不要修改任何文件**，除非我明确要求你修复。
- 若某一步需要推断，请明确标注为“推断”，不要说成“已验证”。

### 0.3 建议命令
- 文件搜索：`rg`, `rg --files`
- 目录查看：`Get-ChildItem`
- 构建：`npm run build`
- 测试：`npm run test`, `npm run test:unit`, `npm run test:integration`
- GEO 仓库体检：`python scripts/geo_principles_audit.py --json`
- 可选交叉验证：`python scripts/seo-geo-audit.py --skip-online --content-dir content --output local-seo-geo-report.json`

### 0.4 输出纪律
- 每一步都要给出：
  - 判定：`通过 / 警告 / 失败 / 阻塞`
  - 证据：文件路径、命令输出摘要、关键代码片段、统计数字
- 不要只写“正常”“没问题”。
- 如果命令失败，保留错误信息摘要，记为 `阻塞` 或 `失败`，然后继续下一步。

---

## 第一步：项目基线与运行入口检查

请先检查以下项目基线信息：

### 1.1 基础环境
- 检查 `package.json`
- 记录：
  - `next` 版本
  - `react` 版本
  - Node 要求
  - 可用脚本：`dev` / `build` / `lint` / `test` / `test:unit` / `test:integration` / `test:e2e`

### 1.2 项目说明与约束
- 检查 `README.md`
- 检查 `.env.example`
- 检查是否明确说明：
  - 本地启动方式
  - SEO / GEO 相关环境变量
  - 管理后台和 GEO 体检脚本入口

### 1.3 多语言路由与根路径策略
- 检查 `src/proxy.ts`
- 检查 `src/i18n/routing.ts`
- 检查：
  - 是否配置 `zh`、`ja`
  - 默认语言是否为 `zh`
  - 根路径 `/` 是否会被语言中间件接管
  - 是否存在明显的根路径重定向/匹配遗漏风险

### 1.4 站点 URL 与环境兜底
- 检查 `src/lib/seo/site-url.ts`
- 检查：
  - 默认站点地址是否为真实域名
  - `NEXT_PUBLIC_SITE_URL` 未配置时的行为
  - 生产环境下是否避免使用 `localhost`
  - `og-image` 默认地址是否可推导

---

## 第二步：站点级基础设施的本地源码检查

本步骤不访问线上 URL，而是检查生成这些入口的源码与测试。

### 2.1 robots.txt 对应实现
- 检查 `src/app/robots.ts`
- 检查：
  - 是否允许 `User-agent: *`
  - 是否显式允许 GPTBot、ClaudeBot、PerplexityBot、Googlebot、Google-Extended 等
  - 是否屏蔽 `Bytespider`
  - `sitemap` 是否来自 `getSiteUrl()`
- 交叉检查：`tests/integration/robots.route.test.ts`

### 2.2 sitemap.xml 对应实现
- 检查 `src/app/sitemap.ts`
- 检查：
  - 是否同时输出 `zh` 与 `ja`
  - 静态页是否包含：首页、`/trial`、`/partner`、`/faq`、`/guides`
  - 文章页是否来自 `getAllArticles(locale)`
  - 是否输出 `alternates.languages`
  - `x-default` 指向是否合理
  - `priority` 是否按页面类型分级
  - `lastModified` 是否真实可靠，而不是“伪新鲜时间”
- 交叉检查：`tests/unit/sitemap.test.ts`

### 2.3 llms.txt 对应实现
- 检查 `src/app/llms.txt/route.ts`
- 检查：
  - 是否列出站点描述
  - 是否包含 `zh` 与 `ja`
  - 是否列出首页、Guides、FAQ
  - 是否对高价值内容类型进行了分组
  - 链接是否是完整绝对 URL
- 交叉检查：`tests/integration/llms.route.test.ts`

### 2.4 llms-full.txt 对应实现
- 检查 `src/app/llms-full.txt/route.ts`
- 检查：
  - 是否按 locale 拼接全文
  - 是否使用 `getArticleMarkdown`
  - 是否带 `version`、`last_updated`
  - 是否声明为 `text/plain`
  - 是否设置缓存头

### 2.5 本地体检脚本入口
- 检查 `scripts/geo_principles_audit.py`
- 检查 `scripts/seo-geo-audit.py`
- 判定：
  - 哪个脚本更适合“仓库根目录体检”
  - 哪个脚本依赖更少、更适合默认执行
  - 是否已经具备输出 Markdown/JSON 的能力

---

## 第三步：首页、列表页、详情页的源码级 SEO/GEO 检查

### 3.1 中文/日文首页
- 检查 `src/app/[locale]/page.tsx`
- 检查 `src/components/home/HeroSection.tsx`
- 检查：
  - `generateMetadata` 是否为首页生成独立 title / description
  - `og:locale` 是否区分 `zh_CN` / `ja_JP`
  - `alternates` 是否同时包含 `zh` / `ja` / `x-default`
  - 首页是否有且仅有一个明确的 `<h1>`
  - 是否输出 `OrganizationJsonLd`
  - 首页是否有足够的内容入口，而不是只有很少的 guides 内链

### 3.2 Guides 列表页
- 检查 `src/app/[locale]/guides/page.tsx`
- 检查：
  - 是否有独立 metadata
  - 是否有 `BreadcrumbJsonLd`
  - 是否按 `cluster` / `faq` / `framework` / `concept` / category 分组
  - 是否每个卡片都有可点击链接
  - 是否存在“分类只靠锚点而没有独立分类页”的 SEO 风险

### 3.3 文章详情页
- 检查 `src/app/[locale]/guides/[category]/[slug]/page.tsx`
- 检查：
  - `generateStaticParams` 是否覆盖全部文章
  - `generateMetadata` 是否正确生成 title / description / canonical / hreflang
  - hreflang 是否默认假设 `zh/ja` slug 完全一致
  - 是否根据内容类型输出：
    - `ArticleJsonLd`
    - `BreadcrumbJsonLd`
    - `FAQPageJsonLd`
    - `HowToJsonLd`
    - `DefinedTermJsonLd`
  - 是否存在 `relatedArticles`、`clusterEntry`、`faqSuggestions`

### 3.4 全站布局与通用信号
- 检查 `src/app/[locale]/layout.tsx`
- 检查 `src/components/layout/Footer.tsx`
- 检查 `src/components/seo/OrganizationJsonLd.tsx`
- 检查：
  - `<html lang={locale}>` 是否存在
  - 是否输出 `WebSiteJsonLd`
  - Footer 是否有核心页面链接
  - Footer 是否有 cluster 入口链接
  - 社交链接是否只接受真实 profile URL，而不是平台首页占位符
  - 是否存在自定义 `not-found.tsx`

---

## 第四步：内容仓库 `content/` 的 GEO 可抽取性检查

请直接检查 `content/zh` 与 `content/ja` 下的 MDX 文件，不要只看渲染层。

### 4.1 内容规模与中日对齐
- 统计：
  - `content/zh/**/*.mdx` 数量
  - `content/ja/**/*.mdx` 数量
  - 每个 category 的数量
- 检查：
  - `zh` 和 `ja` 是否一一对应
  - 是否存在只有中文或只有日文的 slug
  - 这些缺口是否会导致 hreflang 指向不存在页面

### 4.2 frontmatter 完整性
- 重点检查 `src/lib/content.ts` 中真正会消费的字段：
  - `title`
  - `description`
  - `category`
  - `slug`
  - `publishedAt`
  - `updatedAt`
  - `contentType`
  - `cluster`
  - `audience`
  - `suitableFor`
  - `notSuitableFor`
  - `tldr`
  - `relatedSlugs`
  - `ctaType`
- 检查：
  - 是否存在缺字段
  - 是否存在枚举值异常但被 normalize 掩盖的情况
  - `description` 长度是否明显过长或过短
  - `updatedAt` / `publishedAt` 是否像真实日期

### 4.3 内容结构可切块性
- 从每类内容至少抽查 1 篇：
  - `cluster`
  - `framework`
  - `faq`
  - `concept`
  - `case`
  - `problem`
- 检查：
  - 是否有 TL;DR 或等价摘要
  - 是否有「先说结论 / 結論」类章节
  - 是否有「适合谁 / 不适合谁」
  - 是否有「下一步建议」
  - 是否存在过长段落，不利于 LLM chunking

### 4.4 内容内链与引用友好度
- 检查 MDX 正文本身，而不只是页面组件：
  - 是否有正文交叉链接
  - `relatedSlugs` 是否都能解析到真实文章
  - cluster 内部是否形成稳定的主题内链
  - FAQ 是否适合拆成独立引用块

---

## 第五步：Schema、元数据、可信度信号检查

### 5.1 Schema 组件完整性
- 检查 `src/components/seo/`
- 至少确认以下组件是否存在并被真实使用：
  - `ArticleJsonLd`
  - `BreadcrumbJsonLd`
  - `FAQPageJsonLd`
  - `HowToJsonLd`
  - `DefinedTermJsonLd`
  - `OrganizationJsonLd`
  - `WebSiteJsonLd`

### 5.2 作者、组织、sameAs、about 信号
- 检查 `ArticleJsonLd` 与 `OrganizationJsonLd` 的实现
- 检查：
  - `author` 是 `Person` 还是 `Organization`
  - `sameAs` 是否只接收可信 profile URL
  - 是否有 `about` / `mentions` / `keywords` 一类实体锚点
  - 是否存在 Wikidata / 知识图谱对齐信号

### 5.3 Breadcrumb 与分类层级
- 检查 `buildBreadcrumbItems`
- 检查文章页是否把分类层指向 `/guides#category`
- 判断：
  - 这种做法是否对 SEO / GEO 有价值
  - 是否更适合改成 `/guides` 或未来独立分类页

---

## 第六步：本地自动化验证

请在项目根目录尽量执行以下验证；若环境缺失则记为 `阻塞`，但仍要输出已得到的结论。

### 6.1 GEO 仓库体检脚本
- 首选执行：
  - `python scripts/geo_principles_audit.py --json`
- 记录：
  - 是否成功执行
  - 输出报告位置
  - 是否给出结构化 issues / heuristic scores

### 6.2 构建检查
- 执行：
  - `npm run build`
- 检查：
  - 是否能通过构建
  - 是否出现 Next.js 路由、metadata、类型、内容解析相关报错

### 6.3 重点测试
- 优先执行以下测试，若时间或环境有限可至少跑这一组：
  - `tests/unit/content.test.ts`
  - `tests/unit/article-jsonld.test.ts`
  - `tests/unit/organization-jsonld.test.ts`
  - `tests/unit/seo-site-url.test.ts`
  - `tests/unit/sitemap.test.ts`
  - `tests/integration/llms.route.test.ts`
  - `tests/integration/robots.route.test.ts`
- 记录：
  - 通过数 / 失败数
  - 失败测试名
  - 失败是否与 SEO / GEO 信号直接相关

### 6.4 可选扩展验证
- 如环境允许，可补充：
  - `npm run test:unit`
  - `npm run test:integration`
- 不要求默认跑 E2E；只有在需要验证最终渲染时再说明原因。

---

## 第七步：模拟 LLM 引用验证（基于本地内容，不基于线上抓取）

请你扮演一个不了解 kibouFlow 的用户，**只基于本地内容文件、llms 路由实现、内容结构与相关脚本输出**，回答以下问题：

### 测试问题（中文）
1. 在日本找工作，应该先改简历还是先学日语？
2. 什么情况下不应该立刻开始投简历？
3. 日语学习和求职准备可以同时进行吗？怎么安排？
4. 希望整理和路径判断有什么区别？
5. 有没有具体的案例可以参考？

### 对每个问题，必须回答
- 本地仓库中是否有足够内容支撑回答？
- 最相关的文件是哪些？请写出文件路径。
- 最适合被引用的段落/结构是什么？
- 引用时有什么困难？
  - 例如：结论不够靠前、信息分散、无 TL;DR、边界不足、双语不对齐
- 改进建议是什么？

---

## 第八步：输出总结报告

请按以下格式输出最终报告：

```md
## 项目体检总结

### 各层得分（满分 100）
- 技术可发现（20分）：__ / 20
- 页面可理解（30分）：__ / 30
- 内容可抽取（30分）：__ / 30
- 内容可引用（20分）：__ / 20
- 总分：__ / 100

### 执行上下文
- 工作目录：
- 是否访问线上网站：否
- 是否执行构建：
- 是否执行测试：
- 是否执行 GEO 脚本：
- 阻塞项：

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
- 仅展开 1 组：即上面优先级最高且影响范围最大的错误组
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
  "audit_mode": "project-root-local",
  "model": "minimax-m2.7",
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

- 必须逐步执行，不要跳步。
- 每一步都要写出你实际检查了哪些文件、运行了哪些命令、看到了什么。
- 如果某个结论来自“源码推断”而不是“命令验证”，必须写清楚。
- 不要只复述代码，要给出 SEO / GEO 含义。
- 如果发现特别严重的问题，在对应步骤就立即指出。
- 如果存在错误，务必优先展开「最高优先级错误组详单」，并给出可以直接进入修复排期的建议。

---

*本检测脚本版本: v1.0*
*适用仓库: kibouFlow*
*执行模式: project-root-local*
*适配模型: MiniMax M2.7*
*最后更新: 2026-04-22*
