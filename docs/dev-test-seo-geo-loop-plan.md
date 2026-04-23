# kibouFlow Harness Engineering Plan

## 1. 文档定位

这不是一份普通的“开发测试流程”文档，而是一份面向 **Harness Engineering** 的落地计划。

在本仓库中，Harness Engineering 的目标不是只让 AI “会写代码”，而是让 agent 在这个仓库里：

1. 能快速建立正确上下文
2. 知道哪些边界不能碰
3. 有稳定的工具入口可以执行任务
4. 改动后能被自动验证
5. 失败后能得到可回馈的信号
6. 经验可以反哺成文档、规则、脚本和模板

这份文档既包含 **目标状态**，也包含 **当前进度**，后续可以持续在此文档上增量推进。

---

## 2. 项目目标与 Harness 目标

## 2.1 项目目标

`kibouFlow` 是一个面向“在日本发展”主题的双语内容与转化站点，当前核心由以下几部分组成：

- 中日双语内容站
- `trial` / `partner` 转化链路
- SEO/GEO 结构化输出
- GEO 体检后台与治理链路

## 2.2 Harness 目标

本仓库的 Harness Engineering 最终要支持两种主要工作模式：

### A. 代码型任务

例如：

- 改页面或组件
- 改 API 或会话逻辑
- 改 SEO / GEO 输出逻辑
- 改 admin GEO audit 功能

要求：

- agent 能读懂结构
- 改动边界明确
- 验证命令明确
- 回归风险可控

### B. 内容型任务

例如：

- 新增文章
- 修改 MDX
- 修内链
- 修 frontmatter
- 提升 GEO 可抽取性 / 可引用性

要求：

- agent 能理解内容模型
- 知道文章模板要求
- 能跑内容规则检查
- 能把问题落成 warning / checklist / SOP / 脚本

---

## 3. Harness 的六层结构

本仓库的 Harness 按以下六层组织：

1. `Context Harness`
2. `Constraint Harness`
3. `Tool Harness`
4. `Verification Harness`
5. `Feedback Harness`
6. `Memory / Governance Harness`

下面每一层都分为：

- 目标状态
- 当前进度
- 还缺什么

---

## 4. Context Harness

## 4.1 目标状态

让 agent 在开始任务前，就能快速回答这些问题：

- 这个仓库是做什么的
- 站点的路由和信息架构是什么
- 内容模型是什么
- SEO/GEO 关键入口是什么
- admin GEO audit 相关代码在哪里
- 改完后该跑哪些验证

## 4.2 当前进度

这一层已经有明显进展。

### 已完成

- [AGENTS.md](/e:/workspace/kibouFlow/AGENTS.md:1) 已从一句提醒扩成第一版 agent workstation
- 已补充：
  - project overview
  - success criteria
  - repository map
  - domain model
  - protected areas / forbidden moves
  - coding and editing rules
  - task playbooks
  - verification matrix
  - GEO audit / manual validation
  - environment expectations
- 已新增两个专章：
  - `Content Editing Chapter`
  - `Admin GEO Chapter`

### 当前作用

这意味着新 agent 进入仓库后，不需要再从零摸索：

- 内容目录
- SEO/GEO 风险点
- admin GEO 路径
- 基础验证方法

都已经有统一入口。

## 4.3 还缺什么

- 内容编辑章节还没有细化到“不同内容类型的模板差异”
  - 例如 `faq / framework / concept / cluster / case`
- admin GEO 章节还没有沉淀“常见故障排查路径”
- 还缺一个更明确的“任务接手模板”
  - 例如：收到任务后先看哪些文件、先跑哪些命令

---

## 5. Constraint Harness

## 5.1 目标状态

让 agent 不只是“能改”，还要知道“不能乱改什么”。

重点包括：

- 禁区
- 高风险区域
- 变更边界
- 依赖升级边界
- 数据库迁移边界
- 内容 taxonomy 边界

## 5.2 当前进度

这一层已经初步形成。

### 已完成

`AGENTS.md` 中已经写入：

- 不要动 `.env*`
- 不要动 `node_modules/`、`.next/`、生成产物
- 不要随意改 locale 路由结构
- 不要随意升级依赖或改 `package-lock.json`
- 不要随意改迁移顺序
- 不要破坏 `category / contentType / cluster`
- 不要用 LLM-only 校验替代 deterministic checks

还明确标出了高风险区域：

- `src/lib/content.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/llms.txt/route.ts`
- `src/app/[locale]/guides/[category]/[slug]/page.tsx`
- `src/app/api/admin/geo-audit/*`
- `src/lib/admin-session.ts`
- `src/lib/geo-*`

## 5.3 还缺什么

- 还没有把“哪些 warning 目前允许存在”写成显式基线
- 还没有把内容层的“允许推断值”和“必须显式写 frontmatter 的值”彻底区分开
- 还没有形成“什么时候可以新增 migration，什么时候只能改现有逻辑”的实例规则

---

## 6. Tool Harness

## 6.1 目标状态

让 agent 不需要拼命令，不需要凭记忆找脚本，而是直接调用项目内定义好的入口。

理想状态下，agent 应该能按任务类型直接使用：

- 日常回归
- 内容验证
- SEO/GEO 验证
- admin GEO 验证
- 发布前验证
- Python GEO 审计
- Selenium admin 流程

## 6.2 当前进度

这一层已经完成第一版落地。

### 已新增脚本

- [scripts/content-harness-check.mjs](/e:/workspace/kibouFlow/scripts/content-harness-check.mjs:1)
- [scripts/run-python-script.mjs](/e:/workspace/kibouFlow/scripts/run-python-script.mjs:1)
- [scripts/run-harness-verify.mjs](/e:/workspace/kibouFlow/scripts/run-harness-verify.mjs:1)

### 已新增命令入口

在 [package.json](/e:/workspace/kibouFlow/package.json:1) 中已提供：

- `verify:local`
- `verify:content`
- `verify:seo-geo`
- `verify:admin-geo`
- `verify:flows`
- `verify:publish`
- `audit:geo:repo`
- `audit:geo:repo:json`
- `audit:seo-geo:local`
- `audit:admin:selenium`

### 当前作用

agent 现在已经可以按任务类型直接选命令，而不需要临时拼：

- `vitest`
- `build`
- `playwright`
- `python`

## 6.3 还缺什么

- 还没有 `audit:baseline` / `audit:diff`
- 还没有“只针对内容 warning 生成结构化报告”的入口
- 还没有把 `content-harness-check` 输出标准化成 JSON 或 Markdown 报告

---

## 7. Verification Harness

## 7.1 目标状态

让 agent 改完后能立刻知道：

- 该跑哪类验证
- 最小验证集是什么
- 哪些验证已经可用且可信

## 7.2 当前进度

这一层已经真正跑通，不是只停留在命令命名。

### 已验证通过的入口

以下命令已经实际执行成功：

- `npm run verify:content`
- `npm run verify:seo-geo`
- `npm run verify:admin-geo`
- `npm run verify:publish`
- `npm run verify:flows`
- `npm run verify:local`

### 已修复的验证问题

[tests/e2e/core-flows.spec.ts](/e:/workspace/kibouFlow/tests/e2e/core-flows.spec.ts:44) 中原来对首页的 `"GEO"` 文案断言已经过时，现已改为 `"kibouFlow"`。

这很关键，因为它说明：

- Harness 不只是加命令
- 还包括修复已经失效的验证，让验证重新可信

## 7.3 当前验证矩阵

### 日常代码回归

- `npm run verify:local`

### 内容修改

- `npm run verify:content`

### SEO/GEO 结构修改

- `npm run verify:seo-geo`

### admin GEO 修改

- `npm run verify:admin-geo`

### 用户关键链路

- `npm run verify:flows`

### 发文 / 发布前综合验证

- `npm run verify:publish`

## 7.4 还缺什么

- 还没有把“不同任务类型对应哪些命令”写成单独的操作表
- 还没有 CI 层自动执行这些入口
- `verify:publish` 目前仍偏“验证汇总”，还没包含基线保存和 diff

---

## 8. Feedback Harness

## 8.1 目标状态

让 agent 不只是“跑命令”，而是能从失败和 warning 中获得高质量反馈。

也就是说，反馈要满足：

- 结构清晰
- 能直接定位文件
- 能区分 blocking error 和 warning
- 能反向指导下一步修改

## 8.2 当前进度

这一层已经开始形成。

### 已完成

[scripts/content-harness-check.mjs](/e:/workspace/kibouFlow/scripts/content-harness-check.mjs:1) 已具备基本反馈能力：

- 扫描全部 MDX
- 检查 frontmatter
- 检查 `relatedSlugs`
- 检查正文内链数量
- 检查 next-step section
- 检查双语配对情况
- 区分 blocking errors 与 warnings

### 当前输出状态

当前 `verify:content` 的实际结果是：

- blocking errors: `0`
- warnings: `69`

主要 warning 类型集中在部分 `ja` 内容：

- `only 0/1 internal links found in article body`
- `missing next-step section heading`
- `missing tldr frontmatter`
- `missing suitableFor frontmatter`
- `missing notSuitableFor frontmatter`

## 8.3 当前问题

虽然反馈已经有了，但还不够“工程化”：

- warning 还只是文本列表
- 还没有分级
- 还没有聚类
- 还没有区分“模板级问题”与“单篇问题”

## 8.4 下一步重点

这一层是下一阶段最值得继续做的部分。

建议先做：

1. 把 69 条 warning 聚类
2. 区分：
   - 模板级问题
   - 单篇文章问题
3. 给 warning 增加级别
   - 例如 `P1 / P2 / P3`
   - 或者 `template / article / translation`
4. 输出一份结构化报告
   - Markdown 或 JSON 都可以

---

## 9. Memory / Governance Harness

## 9.1 目标状态

让项目不再每次都“重新发现同样的问题”，而是：

- 问题被记住
- 规则被沉淀
- 文档被更新
- 模板被收紧
- 审计结果可对比

## 9.2 当前进度

这一层目前有基础，但还远未完整。

### 已有基础

- [docs/new-post-sop.md](/e:/workspace/kibouFlow/docs/new-post-sop.md:1) 已定义发文前、发布当天、发布后 1～3 天、每周治理动作
- `AGENTS.md` 已明确：同类错误反复出现时，要回头加固 harness
- 已有 GEO 审计脚本和 admin GEO audit 历史机制

### 目前仍缺

- warning 基线文件
- 内容问题整改台账
- 审计 diff 机制
- 模板级规则沉淀机制
- “哪些 warning 是当前已知债务”的正式记录

## 9.3 下一步重点

建议这里先不要做得太重。

最小可用落地方式：

1. 先产出一份内容 warning 整改文档
2. 标记：
   - 已知债务
   - 计划修复
   - 模板级规则
3. 把其中高频项再反哺进：
   - `AGENTS.md`
   - `content-harness-check.mjs`
   - `docs/new-post-sop.md`

---

## 10. 当前进度总览

| 层 | 当前状态 | 说明 |
|------|------|------|
| Context Harness | 已完成第一版 | `AGENTS.md` 已成为 agent 入口地图 |
| Constraint Harness | 已完成第一版 | 禁区、高风险区、边界规则已写入 |
| Tool Harness | 已完成第一版 | `verify:*` / `audit:*` 入口已落地 |
| Verification Harness | 已跑通 | 6 个主要入口已实际验证成功 |
| Feedback Harness | 已开始 | 内容检查器已产生 blocking/warning 反馈 |
| Memory / Governance Harness | 基础存在，未收口 | SOP 有了，但 warning 基线和治理机制还没成型 |

---

## 11. 已完成工作清单

这部分用于记录“当前已经做了什么”，避免后续重复劳动。

### 已完成

1. 扩写 `AGENTS.md`
2. 新增内容编辑与 admin GEO 专章
3. 新增 content harness 检查器
4. 新增 Python 脚本调用器
5. 新增 harness verify 编排器
6. 新增 `verify:*` / `audit:*` 命令
7. 修复 Playwright 首页过时断言
8. 实际跑通关键验证入口

### 已知结果

- 所有 `verify:*` 命令已能执行
- `verify:content` 暴露出 69 条内容 warning
- 这些 warning 是下一阶段最值得处理的 Harness 输入

---

## 12. 下一阶段执行建议

如果你想按这份文档继续慢慢执行，推荐按下面顺序推进。

## 阶段 1：内容 warning 结构化

目标：

- 把 `verify:content` 的 69 条 warning 变成可治理资产

建议动作：

1. warning 分类
2. warning 分级
3. 区分模板问题与单篇问题
4. 形成一份整改清单文档

这是下一步最推荐先做的事情。

## 阶段 2：模板级规则沉淀

目标：

- 把高频 warning 反哺成更强的 harness

优先考虑的高频项：

- missing next-step section
- internal links < 2
- missing `tldr`
- missing `suitableFor`
- missing `notSuitableFor`

建议动作：

1. 修改内容模板
2. 更新 `new-post-sop`
3. 强化 `content-harness-check.mjs`

## 阶段 3：基线与差异机制

目标：

- 让 warning 不只是“看到一次”，而是能追踪前后变化

建议动作：

1. 引入 warning baseline
2. 记录“当前已知债务”
3. 增加 `audit:baseline` / `audit:diff` 类型入口

## 阶段 4：CI / 自动触发

目标：

- 把已经跑通的 Harness 接进提交或 PR 流程

建议动作：

1. 自动跑 `verify:local`
2. 针对内容变更自动跑 `verify:content`
3. 针对 SEO/GEO 相关改动自动跑 `verify:seo-geo`

---

## 13. 当前最推荐的下一步

如果只做一件事，最推荐的是：

**把 `verify:content` 的 69 条 warning 先整理成结构化整改清单。**

原因：

- 这是当前最清晰的 feedback 输入
- 它直接关系到内容站的 GEO 质量
- 它最适合继续反哺成第三层 Harness
- 它不会要求你立刻大面积修改所有文章

---

## 14. 使用方式

后续你完全可以把这份文档当成长期执行底稿。

建议方式：

1. 每完成一层 Harness，就更新一次“当前进度总览”
2. 每进入下一阶段，就在“已完成工作清单”里打勾或追加
3. 每次新开窗口继续工作时，把这份文档当作上下文主文件之一

这样它就不再是一份“一次性计划”，而会逐渐变成这个项目的 **Harness 演进记录**。
