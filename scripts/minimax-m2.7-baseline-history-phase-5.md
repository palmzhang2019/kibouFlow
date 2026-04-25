# kibouFlow Harness Engineering 下一步执行任务（Phase 5：baseline 历史留存与趋势分析，适配 MiniMax M2.7）

> 请你作为一个 **Harness Governance 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness engineering。
> 当前项目已经完成：
> - Phase 1：content warning 结构化 / baseline / diff
> - Phase 1-A / 1-B / 1-C：内容 warning 清零，`verify:content` 当前为 **0 warnings**
> - Phase 2：content governance CI：`.github/workflows/content-governance.yml`
> - Phase 3：SEO/GEO governance CI：`.github/workflows/seo-geo-governance.yml`
> - Phase 4：Admin GEO governance CI：`.github/workflows/admin-geo-governance.yml`
>
> 这一阶段不再优先新增新的 CI workflow，而是要把 **baseline 的历史留存与趋势分析** 做成最小可用落地，避免 baseline 只剩“当前快照”，没有可追溯历史。
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小可用落地，不要把“以后可以做 baseline 历史留存”只留在文档里。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **governance / observability 收口任务**，你可以修改脚本、少量文档、少量 package.json 命令，但不要做无关重构。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/content-warning-remediation-plan.md`
  - `package.json`
  - `scripts/content-harness-check.mjs`
  - `scripts/content-warning-baseline.mjs`
  - `scripts/content-warning-diff.mjs`
  - `scripts/baselines/content-warning-baseline.json`
  - `.github/workflows/content-governance.yml`

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要升级依赖，不要修改 `package-lock.json`。
- 不要大规模改动内容文章；这一阶段重点不是 MDX 内容治理。
- 不要引入数据库或外部存储。
- 不要把实现做成很重的历史系统；优先最小可用。
- 不要破坏现有 `audit:content:baseline` / `audit:content:diff` / `audit:content:diff:strict` 的使用方式。

### 0.3 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现某个历史留存能力已经部分存在，请明确写出来，不要重复建设。
- 最终输出必须包含：
  - 修改文件清单
  - 新增或更新的命令 / 脚本
  - baseline 历史是如何保存的
  - 如何查看趋势或历史
  - 执行过的验证命令
  - 遗留问题

---

## 1. 当前已知现状（请先核实）

请先带着以下事实进入任务：

1. 仓库已经有：
   - `scripts/content-warning-baseline.mjs`
   - `scripts/content-warning-diff.mjs`
   - `scripts/baselines/content-warning-baseline.json`
   - `npm run audit:content:baseline`
   - `npm run audit:content:show`
   - `npm run audit:content:diff`
   - `npm run audit:content:diff:strict`
2. 当前 baseline 机制已经支持：
   - 生成“当前 baseline”
   - 展示 baseline
   - 将当前结果与 baseline 做 diff
3. 当前还没有一个明确落地的 **baseline 历史留存机制**，也没有稳定的趋势视图或历史索引。
4. `docs/dev-test-seo-geo-loop-plan.md` 已把“baseline 历史留存与趋势分析”列为下一步方向。

如果你检查后发现以上任一点不成立，请以实际情况为准，并在最终输出中说明。

---

## 2. 本阶段目标

这次任务的目标不是新增新的 CI 守卫，而是让 baseline 从“单一快照”变成“可追溯、有最小趋势能力的治理资产”。

### 2.1 核心目标

1. 为 content warning baseline 新增最小可用的历史留存机制
2. 能查看最近几次 baseline 的关键趋势或摘要
3. 同步文档，明确当前 baseline / diff / history 三者的职责边界

### 2.2 期望结果

理想情况下：

- 仓库中存在一个约定好的历史目录，例如：
  - `scripts/baselines/history/`
- 能通过新增或扩展脚本：
  - 保存带时间戳或可识别标签的 baseline 历史快照
  - 查看历史快照列表或摘要
  - 查看 warnings / blockingErrors 的趋势
- `package.json` 中出现清晰可用的命令入口

### 2.3 非目标

本阶段不要求你：

- 接入数据库
- 接入外部 dashboard
- 做复杂的 HTML 报表
- 把历史趋势接进 GitHub Actions artifact
- 处理 SEO/GEO 或 Admin GEO 新 workflow

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实现有 baseline 能力边界

先检查：

- `scripts/content-warning-baseline.mjs`
- `scripts/content-warning-diff.mjs`
- `scripts/baselines/content-warning-baseline.json`
- `package.json`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/content-warning-remediation-plan.md`

输出简短结论：

1. 当前 baseline 已经支持什么
2. 历史留存缺什么
3. 你准备扩展现有 baseline 脚本，还是新增一个独立历史脚本

**建议默认选择：尽量复用现有 baseline 脚本。**

原因：

- 保持命令入口集中
- 减少治理能力分散
- 更符合“最小可用落地”

如果你决定新增独立脚本，必须说明理由。

### 任务 B：定义最小可用历史方案

请基于仓库现状设计一个最小合理方案。

建议优先考虑：

- 在 `scripts/baselines/history/` 下保存历史 JSON 快照
- 历史文件名包含时间戳，必要时可带标签
- 保留一个简单索引文件，或通过扫描目录得到历史列表
- 提供一个“show history”或“trend”命令，输出：
  - 最近 N 次 baseline
  - 每次的 `totalWarnings`
  - 每次的 `blockingErrors`
  - 与前一份相比的变化摘要

要求：

1. 不要设计成过重系统
2. 输出要适合本地开发和后续 CI/人工查看
3. 目录和命令命名要清晰

### 任务 C：落地最小可用脚本与命令

你可以选择以下其中一种实现路径：

1. 扩展 `scripts/content-warning-baseline.mjs`
2. 新增配套脚本，但保持与 baseline 命令体系一致

建议至少有这些能力：

- 生成当前 baseline
- 保存历史 baseline 快照
- 查看历史列表或趋势摘要

建议命令风格：

- `npm run audit:content:baseline`
- `npm run audit:content:baseline:history`
- `npm run audit:content:baseline:trend`

要求：

1. 命令名要和现有 `audit:content:*` 风格一致
2. 不要破坏已有命令
3. 输出尽量机器可读 + 人可读

### 任务 D：同步文档

至少更新：

- `docs/dev-test-seo-geo-loop-plan.md`

建议同步：

- `docs/content-warning-remediation-plan.md`
- `docs/docs-index.md`

需要明确写清：

1. 当前 baseline / diff / strict diff 已完成什么
2. baseline history 本次完成了什么
3. 还没做的趋势治理有哪些

### 任务 E：本地验证

至少运行：

1. `npm run audit:content:baseline`
2. 你新增的 history / trend 命令

如果你修改了 diff / baseline 脚本，也建议补：

3. `npm run audit:content:diff`
4. `npm run audit:content:diff:strict`

如果命令输出中涉及历史文件创建，请在最终输出中说明生成了哪些文件。

---

## 4. 推荐实施顺序

建议按这个顺序推进：

1. 先检查现有 baseline / diff 边界
2. 确定历史目录与命令方案
3. 落地脚本和命令
4. 同步文档
5. 跑 baseline / history / trend 验证

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 能力层

- 仓库中存在明确的 baseline 历史留存机制
- 能查看至少最近几次 baseline 的摘要或趋势

### 5.2 设计层

- 新能力与现有 `baseline / diff / strict diff` 分工清晰
- 命令命名与现有 `audit:content:*` 风格一致

### 5.3 文档层

- `docs/dev-test-seo-geo-loop-plan.md` 已同步
- 文档中清楚写出 baseline / diff / history 的分工

### 5.4 验证层

- baseline 命令可运行
- 你新增的 history / trend 命令可运行

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/content-warning-remediation-plan.md`
- `.github/workflows/content-governance.yml`
- `scripts/content-harness-check.mjs`
- `scripts/content-warning-baseline.mjs`
- `scripts/content-warning-diff.mjs`
- `scripts/baselines/content-warning-baseline.json`

如果需要，请创建：

- `scripts/baselines/history/`
- 配套索引文件或历史说明文件

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 5 的最小闭环

### 2. 已确认的现状缺口
- baseline / diff 已覆盖什么
- baseline history / trend 之前缺什么

### 3. 本次改动
- 按文件列出改动点

### 4. 新增或更新的命令 / 脚本
- 每个命令或脚本的用途
- baseline 历史如何保存
- 如何查看趋势

### 5. 验证结果
- 跑了哪些命令
- 哪些通过
- 哪些失败

### 6. 剩余问题 / 下一步
- 还没做的内容
- 下一阶段最值得继续推进的 1～3 件事

---

## 8. 一句话任务总结

这次任务的本质是：

**把 kibouFlow 的治理能力从“只有当前 baseline 快照”推进到“baseline 可留存历史、可查看趋势”，让 harness 的 Memory / Governance 层更完整。**
