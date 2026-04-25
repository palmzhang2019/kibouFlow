# kibouFlow 内容治理下一步执行任务（Phase 1-A / 1-B，适配 MiniMax M2.7）

> 请你作为一个 **Content Governance / Harness Remediation 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段治理工作。
> 上一阶段已经完成了 content warning 的结构化输出、baseline、diff 和文档闭环；这一阶段不再重复做 harness 底座，而是要开始 **消化高价值 warning**。
> 目标项目是一个面向“在日本发展”主题的中日双语站点，技术栈为 `Next.js 16 + React 19 + TypeScript + next-intl + MDX + PostgreSQL + Vitest + Playwright`。
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小但真实有效的整改，不要把“下一阶段建议”当成已经完成。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **内容治理执行任务**，你可以修改内容、文档和必要的校验规则，但必须保持改动小而聚焦。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/content-warning-remediation-plan.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/new-post-sop.md`
  - `scripts/content-harness-check.mjs`
  - `scripts/baselines/content-warning-baseline.json`
- 如果文档、baseline 与当前文件内容不一致，以**当前仓库文件 + 实际命令输出**为准，并把差异收敛掉。

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要修改 `package-lock.json` 或升级依赖。
- 不要改动站点路由结构。
- 不要大规模重写全部 MDX；这一阶段只处理高价值、规则性强的 warning。
- 不要引入新的内容 taxonomy。
- 不要为了“让 warning 消失”而删掉对用户有价值的内容结构。

### 0.3 内容编辑硬规则

当你修改 `content/ja/**` 时，必须遵守：

1. 先阅读对应的 `zh` 配对文章（如果存在）。
2. 优先保持原文意图，不要擅自改主题立场。
3. 尽量做模板化修复：
   - 统一 heading
   - 补齐 frontmatter
   - 补最少必要内链
4. 保持 URL / slug 稳定。
5. 不要把内容修复转嫁到 UI 组件层。

### 0.4 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现某些 W010 实际是“标题变体未被识别”而不是“真的缺少下一步段落”，请明确说明，并决定一个**统一标准**。
- 最终输出必须包含：
  - 修改文件清单
  - 处理了哪些 warning 类型
  - warning 数量变化
  - 执行过的命令
  - 遗留问题

---

## 1. 上一阶段之后的已知现状

请带着以下事实进入任务：

### 1.1 已完成的底座

仓库现在已经具备：

- `content-harness-check` 的结构化 warning 输出
- `audit:content:baseline`
- `audit:content:diff`
- content warning baseline 文件
- 基本文档闭环

这一阶段**不要重复建设这些能力**，除非你发现它们阻碍本次目标。

### 1.2 当前 warning 基线

根据现有基线，当前主要 warning 为：

- `W009` `insufficient internal links`：36 条
- `W010` `missing next-step section heading`：23 条
- `W005` `missing tldr frontmatter`：6 条
- `W006` `missing suitableFor frontmatter`：1 条
- `W007` `missing notSuitableFor frontmatter`：1 条

### 1.3 本阶段最有价值的目标

优先处理这两类：

1. **Phase 1-A：W010 模板级问题**
   - 23 条
   - 全部集中在 `ja`
   - 属于最适合模板化、规则化处理的一类

2. **Phase 1-B：单篇高杠杆 frontmatter 问题**
   - `content/ja/boundaries/what-we-dont-handle-yet.mdx`
   - 一篇占了 `W005 + W006 + W007`

---

## 2. 本阶段目标

这次任务的目标不是“再做一个计划”，而是把 warning 真正往下打。

### 2.1 核心目标

把 `ja` 内容中的 **W010 template-level warning** 做一次系统性下降，并顺手处理 `what-we-dont-handle-yet.mdx` 的 3 个高杠杆 P2 warning。

### 2.2 期望结果

理想情况下：

- `W010` 从 23 明显下降，最好降到 0
- `W005 / W006 / W007` 至少减少 3 条
- `audit:content:diff` 显示 warning 总量为负增长
- 规则在文档中得到明确沉淀

### 2.3 非目标

本阶段不要求你：

- 一次性修完所有 `W009` 内链问题
- 批量重写 36 篇文章的结构
- 建 CI
- 改 SEO/GEO 代码逻辑

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实 W010 的真实成因

先检查：

- `scripts/baselines/content-warning-baseline.json`
- `scripts/content-harness-check.mjs`
- 被标记为 `W010` 的 `content/ja/**` 文件

你需要回答两个问题：

1. 哪些文章是真的**没有“下一步”段落**
2. 哪些文章其实已经有类似：
   - `## 次の一歩`
   - `## 次のステップ`
   - `## 次の行動`
   只是当前标准不统一

然后从以下两种路径中选择 **一个**，并在整个仓库内保持一致：

#### 路径 1：内容标准化优先

- 把相关 `ja` 文章的 heading 统一改成一个规范写法，推荐 `## 次のステップ`
- 优点：内容模板更统一，规则更稳定

#### 路径 2：规则兼容优先

- 若仓库里已经稳定使用 `## 次の一歩`，则可以把它正式纳入允许模式
- 但你必须同步更新：
  - `scripts/content-harness-check.mjs`
  - `AGENTS.md`
  - `docs/new-post-sop.md`
- 不能只改脚本，不改规范

**要求**：选一条，不要混着做。

### 任务 B：执行 Phase 1-A（W010 治理）

根据你在任务 A 选择的路径，处理当前 `W010` 相关的 `ja` 文件。

重点要求：

1. 修复真正缺少 next-step section 的文章
2. 统一 heading 标准
3. 不要只为了过检查而添加空洞结尾；“下一步”段落必须有真实导向价值
4. 修改内容时，尽量参考对应 `zh` 文章的收尾结构

如果文章已有合格内容，只是 heading 不统一，请优先做小改动，不要整篇重写。

### 任务 C：执行 Phase 1-B（高杠杆单篇补齐）

处理：

- `content/ja/boundaries/what-we-dont-handle-yet.mdx`

至少补齐：

- `tldr`
- `suitableFor`
- `notSuitableFor`
- 如果该文也缺 next-step，则一并修复

要求：

- 先对照 `content/zh/boundaries/what-we-dont-handle-yet.mdx`
- frontmatter 内容要贴合该文主题，不要填空式乱写

### 任务 D：把规则反哺回规范文档

至少更新这些文件中的必要部分：

- `AGENTS.md`
- `docs/new-post-sop.md`
- `docs/content-warning-remediation-plan.md`

需要明确写清：

1. `ja` 文章允许的 next-step heading 标准
2. 发布前必须检查的 frontmatter 要求
3. 新增内容不应再引入这类 template-level warning

如果你选择“规则兼容优先”路径，也必须把允许的 heading 变体写清楚。

### 任务 E：验证 warning 下降是否真实

至少运行：

1. `npm run verify:content`
2. `npm run audit:content:diff`

如果本次变更范围较大，建议再运行：

3. `npm run verify:publish`

如果 `audit:content:diff` 显示 warning 没下降，或者出现新增 warning，请不要把任务算作完成。

---

## 4. 推荐处理文件

优先关注这些文件：

### 文档 / 规则

- `AGENTS.md`
- `docs/new-post-sop.md`
- `docs/content-warning-remediation-plan.md`
- `scripts/content-harness-check.mjs`

### 高优先级内容文件

- `content/ja/boundaries/concept-hope-sorting.mdx`
- `content/ja/boundaries/concept-path-judgment.mdx`
- `content/ja/boundaries/faq-japanese-path.mdx`
- `content/ja/boundaries/faq-job-prep.mdx`
- `content/ja/boundaries/faq-partner-collaboration.mdx`
- `content/ja/boundaries/faq-resume-or-japanese-first.mdx`
- `content/ja/boundaries/what-we-dont-handle-yet.mdx`
- `content/ja/boundaries/when-to-use-hope-sorting.mdx`
- `content/ja/cases/case-library.mdx`
- `content/ja/cases/direction-unclear-sorted.mdx`
- `content/ja/cases/should-learn-japanese-first.mdx`
- `content/ja/paths/direction-sorting-cluster-entry.mdx`
- `content/ja/paths/four-preparation-paths.mdx`
- `content/ja/paths/framework-japanese-or-job-first.mdx`
- `content/ja/paths/framework-not-ready-signals.mdx`
- `content/ja/paths/japanese-learning-path-cluster-entry.mdx`
- `content/ja/paths/job-prep-cluster-entry.mdx`
- `content/ja/paths/push-forward-or-sort-first.mdx`
- `content/ja/problems/goal-unclear-kills-consulting.mdx`
- `content/ja/problems/job-seeking-vs-language.mdx`
- `content/ja/problems/resume-vs-japanese.mdx`
- `content/ja/problems/resume-writing-not-just-writing.mdx`
- `content/ja/problems/when-not-to-apply.mdx`

对应编辑时，请优先参考配对的 `content/zh/**` 文件。

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 内容层结果

- `W010` 数量明显下降，最好归零
- `what-we-dont-handle-yet.mdx` 不再触发 `W005 / W006 / W007`

### 5.2 规则层结果

- next-step 标准在 `AGENTS.md` 和 `docs/new-post-sop.md` 中明确可查
- 文档、内容、校验规则三者一致

### 5.3 验证结果

至少满足：

- `npm run verify:content` 通过
- `npm run audit:content:diff` 显示 warning 下降

若跑了 `verify:publish`，请也记录结果。

---

## 6. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 1-A / 1-B 的最小闭环

### 2. 已确认的成因
- W010 里哪些是真缺失，哪些是 heading 变体问题
- 你最终选择了哪条路径（内容标准化 / 规则兼容）

### 3. 本次改动
- 按文件列出改动点

### 4. warning 变化
- W010 变化
- W005 / W006 / W007 变化
- warning 总量变化

### 5. 验证结果
- 跑了哪些命令
- 哪些通过
- 哪些失败
- 失败原因

### 6. 剩余问题 / 下一步
- 仍未处理的 warning
- 下一阶段最值得继续推进的 1～3 件事

---

## 7. 一句话任务总结

这次任务的本质是：

**把 kibouFlow 的内容治理从“有 baseline / diff”推进到“开始系统消化高价值 warning”，优先解决 `ja` 的 next-step 模板问题，并补齐一篇高杠杆 frontmatter 缺失文章。**
