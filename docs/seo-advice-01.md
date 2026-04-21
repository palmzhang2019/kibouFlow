# kibouflow 上线后 SEO / GEO 检测方法

## 目标

对于 `https://kibouflow.com/zh` 和 `https://kibouflow.com/ja` 这样的中日双语内容站，最实用的检测方式，不是只看一个“SEO 分数工具”，而是建立一套 **可重复执行的 SEO + GEO 体检流程**。

这个项目本身已经具备很好的基础设施：

- 中日双语路由
- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `llms-full.txt`
- JSON-LD
- MDX 内容体系
- `admin/geo-audit` 后台

因此，最适合的做法，是把 **技术可抓取、页面可理解、内容可抽取、内容可引用** 这四层串起来做检测。

---

## 一、先明确：到底检测什么

不要把 SEO 和 GEO 混成一个分数。建议拆成 4 层。

### 1. 技术可发现

检查搜索引擎和 LLM 爬虫能不能发现你的网站内容。

重点检查这些地址是否正常：

- `https://kibouflow.com/robots.txt`
- `https://kibouflow.com/sitemap.xml`
- `https://kibouflow.com/llms.txt`
- `https://kibouflow.com/llms-full.txt`

这一层主要关注：

- 是否可访问
- 返回是否为 200
- 是否输出正确内容
- 是否包含站点真实域名
- 是否能列出核心页面

---

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

---

### 3. 内容可抽取

这是 GEO 非常关键的一层。不是页面“能打开”就够了，而是模型能不能顺手把答案抽出来。

重点检查：

- 页面有没有 TL;DR
- 有没有结论区
- 有没有 `suitableFor`
- 有没有 `notSuitableFor`
- 有没有 `next steps`
- 段落是不是过长
- FAQ / framework / cluster / case 等内容类型是否清晰
- 页面开头能不能迅速说清“这页解决什么问题”

---

### 4. 内容可引用

这是 GEO 比传统 SEO 更难的一层。不是“有内容”就够，而是模型是否愿意引用你。

重点检查：

- 有没有作者 / 组织归因
- 结论是否明确
- 有没有边界说明
- 是否避免空泛长段落
- 是否有案例、FAQ、框架、定义页等可引用结构
- 是否有站内内链支持理解上下文

---

## 二、最省事的检测方法：分三步走

## 第一步：跑站内 GEO 体检后台

这是最适合你项目的方法。

### 操作入口

- `https://kibouflow.com/zh/admin/login`
- 登录后进入 `/{locale}/admin/geo-audit`
- 再进入 `/{locale}/admin/geo-audit/run` 运行体检

### 这一步会帮你做什么

后台会输出：

- 五维分数
- 历史记录
- 结构化问题列表（issues）
- 问题代码、严重度、层级
- 修复建议
- 后续复检能力

### 重点看什么

优先查看以下问题类型：

- sitemap / robots / llms 是否正常
- 页面是否缺 TL;DR
- 是否缺结论区
- 是否缺 `suitableFor`
- 是否缺 `notSuitableFor`
- 是否缺 `next steps`
- 长段落是否过多
- 文章类型是否标记不清
- JSON-LD 是否不一致

### 建议

如果后台已经给出 issue code，优先按 issue code 修，不要先凭感觉改文案。

---

## 第二步：做一轮外部可见性检查

后台体检能说明站内结构是否合格，但真正 SEO / GEO 还需要检查“外部入口是否正常”。

### 建议手动检查这些页面

- `https://kibouflow.com/robots.txt`
- `https://kibouflow.com/sitemap.xml`
- `https://kibouflow.com/llms.txt`
- `https://kibouflow.com/llms-full.txt`
- `https://kibouflow.com/zh`
- `https://kibouflow.com/ja`
- `https://kibouflow.com/zh/guides`
- `https://kibouflow.com/ja/guides`
- 抽查 3～5 篇文章页
- 抽查 1 个 FAQ 页
- 抽查 1 个 framework / cluster 页

### 检查标准

#### 技术面

- 状态码是 200
- 页面 HTML 首屏能看到正文
- 没有明显 hydration error
- 页面 source 中能找到 title、description、canonical、hreflang
- 页面 source 中能找到 JSON-LD script

#### GEO 面

- 页面开头能快速看懂主题
- 有明确结论，不需要滚很久才知道答案
- 内容块标题清楚，适合被切片
- FAQ / 步骤 / 判断框架 / 适合谁 / 不适合谁 等块明显存在
- 页尾有“下一步建议”

---

## 第三步：做一轮真实搜索 / 真实提问验证

这一步最接近实际 SEO / GEO 效果。

### SEO 验证

去搜索引擎测试：

- `site:kibouflow.com 简历 日语 日本 就职`
- `site:kibouflow.com 希望整理`
- `site:kibouflow.com 日本 求职 路径`
- `site:kibouflow.com kibouflow`

重点观察：

- 页面是否被收录
- 收录标题和描述是否正常
- 中日页面是否串错
- 是否有不该收录的后台页被收录

### GEO 验证

拿真实问题去问大模型，例如：

- 在日本找工作应该先改简历还是先补日语？
- 日语学习和求职准备怎么并行？
- 什么情况下不适合立刻投简历？
- 路径判断和希望整理有什么区别？

重点观察：

- 网站里的结论是否容易被复述
- 页面结构是否容易被抽成答案
- FAQ / framework / cluster 页是否更容易被吸收
- 是否能体现出页面的边界说明和下一步建议

### 判断标准

如果内容方向没问题，但模型总是抽不到，通常不是主题错了，而是页面结构不够“可抽取”。

---

## 三、建议给自己做一个固定打分表

每个页面都可以按这个表自检。

## A. 技术层（20分）

- 200 正常访问
- title 独立
- description 独立
- canonical 正确
- hreflang 正确
- JSON-LD 存在
- robots / sitemap / llms 可发现

## B. 内容结构层（30分）

- 有 TL;DR
- 有结论区
- 有 `suitableFor`
- 有 `notSuitableFor`
- 有 `next steps`
- H2 / H3 清楚
- 段落不过长

## C. GEO 抽取层（30分）

- 开头 3～5 句能说明核心问题
- 页面可被切成多个清晰信息块
- FAQ / 框架 / 步骤 / 案例 / 定义等块足够明确
- 内容不是只有观点，还有判断依据
- 结论不是模糊空话

## D. 可引用层（20分）

- 有组织 / 作者归因
- 有边界说明
- 有相关页面内链
- 有案例或可验证判断
- 不是纯营销页

### 建议评分解释

- **80 分以上**：可视为合格上线
- **90 分以上**：可视为优先推给搜索和模型的核心页

---

## 四、对 kibouflow 最推荐的实际执行顺序

建议按下面顺序执行：

### 1. 先检查站点级基础文件

优先检查：

- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`
- `/llms-full.txt`

这是站点级基础能力，应该最先确认。

---

### 2. 登录后台跑一次 `geo-audit`

查看：

- 五维分数
- issues 列表
- 严重度分布
- 历史记录
- 当前最突出的结构问题

---

### 3. 抽查关键页面

建议抽查：

- 首页
- guides 索引页
- 3 篇文章页
- 1 篇 FAQ
- 1 篇 framework
- 1 篇 cluster

---

### 4. 优先修最常见、最影响 GEO 的结构问题

特别优先处理：

- 缺 TL;DR
- 缺结论区
- 缺 `suitableFor` / `notSuitableFor`
- 缺 `next steps`
- 长段落太多

---

### 5. 修完后复检

再跑一次 `geo-audit`，确认：

- 分数是否上升
- issues 是否减少
- 关键问题是否关闭

然后再做真实搜索和真实提问验证。

---

## 五、最重要的一点

**SEO 更偏“能不能被发现”，GEO 更偏“被发现后能不能被理解和引用”。**

所以检测方法不能只看这些传统项：

- title
- description
- sitemap
- 收录

还必须检查这些 GEO 项：

- 页面是否一上来就能回答问题
- 内容块是否适合抽取
- 文章是否有明确结论和边界
- 网站是否提供 `llms.txt` / `llms-full.txt`
- FAQ / framework / cluster / case 等内容类型是否形成“引用友好结构”

---

## 六、一句话总结

对于 `kibouflow.com`，最合适的检测方法不是只依赖第三方 SEO 工具，而是：

1. **先检查站点级入口是否正常**
2. **再用自己的 `admin/geo-audit` 跑规则体检**
3. **再用人工抽查验证页面结构**
4. **最后用真实搜索和真实问答验证 SEO / GEO 效果**

这样做，才能同时覆盖：

- 技术抓取
- 页面理解
- 内容抽取
- 内容引用

这套方法也最适合你当前这个已经具备 GEO 后台和结构化内容体系的项目。
