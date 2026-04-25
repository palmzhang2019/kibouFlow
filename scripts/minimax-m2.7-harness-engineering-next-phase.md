# kibouFlow 下一阶段 Harness Engineering 执行任务（项目根目录执行版，适配 MiniMax M2.7）

> 请你作为一个 **Harness Engineering 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness 工程。
> 这不是一份“只做分析”的任务，而是一份 **允许你直接改代码、改脚本、改文档，并完成验证** 的执行型任务。
> 目标项目是一个面向“在日本发展”主题的中日双语站点，技术栈为 `Next.js 16 + React 19 + TypeScript + next-intl + MDX + PostgreSQL + Vitest + Playwright`。
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，减少主观发挥；先核实现状，再做最小可用落地，不要把文档里的“计划状态”直接当成已经实现。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **harness 工程实施任务**，你可以修改文件，但必须保持改动小而聚焦。
- 优先依据以下来源建立判断，不要凭印象写：
  - `AGENTS.md`
  - `docs/docs-index.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/content-warning-remediation-plan.md`
  - `docs/project-overview.md`
  - `docs/new-post-sop.md`
  - `docs/testing-strategy.md`
  - `package.json`
  - `scripts/content-harness-check.mjs`
  - `scripts/run-harness-verify.mjs`
- 如果文档和实现不一致，以**当前代码与脚本实际状态**为准，然后把差异收敛掉。

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要随意升级依赖，不要修改 `package-lock.json`。
- 不要改变 `zh / ja` 路由结构。
- 不要大规模重写 `content/zh/**` 或 `content/ja/**` 文章；这一阶段的重点是 **harness**，不是批量修内容。
- 不要删除或重塑内容 taxonomy：`category / contentType / cluster / ctaType`。
- 不要用“LLM 自己判断”替代 deterministic checks。

### 0.3 高风险区域

若必须触碰这些区域，务必保持最小变更，并同步更新验证或文档：

- `src/lib/content.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/llms.txt/route.ts`
- `src/app/[locale]/guides/[category]/[slug]/page.tsx`
- `src/app/api/admin/geo-audit/*`
- `src/lib/admin-session.ts`
- `src/lib/geo-*`

本任务默认 **不应** 需要改动这些高风险文件，除非你确认某个 harness 目标无法通过脚本/文档层落地。

### 0.4 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果发现“文档声称已完成，但代码未实现”，请明确记为 **文档-实现不一致**，并说明你如何收敛。
- 最终输出必须包含：
  - 修改文件清单
  - 执行过的命令
  - 结果摘要
  - 未完成项 / 风险项

---

## 1. 项目背景与当前已确认状态

请先带着下面这些事实进入任务：

### 1.1 项目目标

`kibouFlow` 的核心是：

- 中日双语内容站
- `trial / partner` 转化链路
- SEO / GEO 结构化输出
- GEO 体检后台与治理链路

### 1.2 Harness 已完成的部分

根据 `docs/dev-test-seo-geo-loop-plan.md` 与现有仓库，以下部分已经有第一版基础：

- `Context Harness`
- `Constraint Harness`
- `Tool Harness`
- `Verification Harness`

项目内已经有这些命令入口：

- `npm run verify:local`
- `npm run verify:content`
- `npm run verify:seo-geo`
- `npm run verify:admin-geo`
- `npm run verify:flows`
- `npm run verify:publish`
- `npm run audit:geo:repo`
- `npm run audit:geo:repo:json`
- `npm run audit:seo-geo:local`
- `npm run audit:admin:selenium`

### 1.3 Phase 1 已有成果

`docs/content-warning-remediation-plan.md` 表明：

- 已经完成过一次 **content warning structuring** 产出
- 当前基线大致是：
  - 48 篇 MDX
  - blocking errors = 0
  - warnings = 69
- warning 已经被归类为：
  - template-level
  - article-level
  - translation-level
- 已经明确下一步要做 baseline / diff / known debt 治理机制

### 1.4 当前真实缺口（执行前必须亲自核实）

你需要特别核实以下几件事，因为它们很可能存在 **文档已写、代码未跟上** 的情况：

1. `scripts/content-harness-check.mjs` 是否真的已经支持：
   - warning code
   - severity
   - category
   - `--json`
   - `--verbose`
2. 仓库中是否真的已经存在：
   - `docs/content-warning-baseline.md`
   - baseline 的机器可读文件
   - `audit:baseline` / `audit:diff` 或等价命令
3. 当前 docs 是否仍引用不存在的 phase 文档：
   - `docs/使用指南.md`
   - `docs/testing-strategy.md`

如果你检查后发现这些仍未落地，请把它们视为 **本阶段的真实工作内容**。

---

## 2. 本阶段目标：把 Feedback Harness 推进到可治理状态，并初步补上 Memory / Governance Harness

本阶段不是继续泛泛谈计划，而是做出 **最小可用、能持续使用的治理闭环**。

### 2.1 核心目标

把当前 `verify:content` 暴露出来的 warning，从“控制台里一串文本”推进到“可比较、可留档、可治理”的状态。

### 2.2 你要优先落地的能力

优先级从高到低如下：

1. **结构化 warning 输出**
2. **warning baseline**
3. **warning diff / 趋势对比**
4. **known debt 的正式记录**
5. **文档与实现重新对齐**

### 2.3 非目标

本阶段不要求你：

- 一次性修完 69 条内容 warning
- 大规模改写所有 MDX
- 做复杂 CI 平台接入
- 重做 GEO 策略或产品信息架构

---

## 3. 具体任务清单

请按顺序执行，优先做能形成闭环的最小集合。

### 任务 A：核对“文档说已完成”的功能，确认实际缺口

先检查：

- `scripts/content-harness-check.mjs`
- `package.json`
- `docs/content-warning-remediation-plan.md`
- `docs/dev-test-seo-geo-loop-plan.md`

输出一段简短结论：

- 哪些功能已经真实存在
- 哪些功能只写在文档里，还没落地
- 你准备把哪些缺口纳入本次实现

### 任务 B：增强 `content-harness-check`

若当前脚本仍是纯文本 warning，请将它增强到至少满足以下能力：

1. 每条 warning 都具备结构化字段，至少包括：
   - `code`
   - `severity`
   - `category`
   - `file`
   - `locale`
   - `categoryDir` 或等价字段
   - `slug`
   - `message`
2. 支持机器可读输出：
   - `--json`
3. 支持更完整的人类调试输出：
   - `--verbose`
4. 终端默认输出仍要保持易读，不要为了 JSON 牺牲默认可读性
5. blocking errors 与 warnings 仍要明确区分

要求：

- 优先沿用现有检查逻辑，不要大改规则本身
- 如果你新增 code / severity / category，请与 `docs/content-warning-remediation-plan.md` 尽量一致
- 不要引入新依赖

### 任务 C：加入 baseline 机制

把当前 warning 治理从“一次性扫描”推进到“可比较的基线”。

建议最小落地：

1. 新增一个机器可读 baseline 文件，建议路径类似：
   - `scripts/baselines/content-warning-baseline.json`
   - 或你认为更符合仓库风格的等价路径
2. 新增一个生成 baseline 的脚本或入口
3. baseline 内容至少包含：
   - 生成时间
   - 扫描文件总数
   - blocking error 数
   - warning 总数
   - 按 code / severity / category / locale 的聚合
   - 明细 warnings（如果体积可控）

如果你认为还需要一个给人看的摘要文档，也可以同时生成：

- `docs/content-warning-baseline.md`

但注意：**机器可读 baseline 优先于人工摘要文档**。

### 任务 D：加入 diff 机制

在 baseline 存在后，增加“本次结果 vs baseline”的对比能力。

最小要求：

1. 能比较 warning 总数变化
2. 能比较各 warning code 数量变化
3. 能指出：
   - 新增问题
   - 已消失问题
   - 数量上升的 warning 类型
   - 数量下降的 warning 类型
4. 输出既要适合终端阅读，也最好能输出 JSON

命令名可按项目风格决定，但要明确可用。

如果泛化命名 `audit:baseline` / `audit:diff` 太模糊，你可以采用更清晰的内容专用命名，例如：

- `audit:content:baseline`
- `audit:content:diff`

只要风格统一、可读性强即可。

### 任务 E：补 Memory / Governance 的最小落地

这一部分不需要做重系统，但至少要做到：

1. 正式记录“当前已知债务”
2. 说明哪些 warning 是当前可接受存量，哪些应该阻止新增
3. 给后续 agent 一条明确路径：
   - 如何更新 baseline
   - 如何看 diff
   - 何时接受 warning 变多
   - 何时必须回滚或修复

优先更新这些文档中的必要部分：

- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/content-warning-remediation-plan.md`
- `docs/new-post-sop.md`
- `docs/docs-index.md`

如果你发现 `docs/使用指南.md`、`docs/testing-strategy.md` 中的 phase 文档引用已经过时，可以在本次顺手收敛，但请保持改动小而明确。

---

## 4. 建议实施方案

你可以自行微调，但总体建议按这个顺序推进：

1. 读文档与代码，确认缺口
2. 先改 `scripts/content-harness-check.mjs`
3. 再新增 baseline / diff 脚本与 `package.json` 命令
4. 生成或更新 baseline 文件
5. 更新相关文档，确保文档与实现一致
6. 运行最小充分验证

不要先写很多文档再补代码；要先让脚本能力成立。

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段任务完成：

### 5.1 脚本能力

- `content-harness-check` 已能输出结构化 warning
- 已支持 `--json`
- baseline 可生成
- diff 可运行

### 5.2 仓库入口

- `package.json` 中存在清晰可用的命令入口
- 命令命名与现有 `verify:*` / `audit:*` 风格一致

### 5.3 文档对齐

- 文档不再声称某能力“已完成”，但代码里并不存在
- baseline / diff / known debt 的使用方式在 docs 中可查

### 5.4 验证

至少完成以下验证：

1. `npm run verify:content`
2. 新增的 baseline 命令
3. 新增的 diff 命令

如你的实现影响了更广的脚本入口或 content 校验逻辑，可补充：

4. `npm run verify:local`

如果某个命令因环境问题失败，请保留错误摘要并说明是否属于环境阻塞还是实现问题。

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `scripts/content-harness-check.mjs`
- `scripts/run-harness-verify.mjs`
- `docs/docs-index.md`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/content-warning-remediation-plan.md`
- `docs/new-post-sop.md`
- `docs/project-overview.md`
- `docs/testing-strategy.md`
- `docs/使用指南.md`

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成“下一阶段 harness 工程”的最小闭环

### 2. 已确认的现状差异
- 文档与实现有哪些不一致

### 3. 本次改动
- 按文件列出改动点

### 4. 新增或更新的命令
- 每个命令的用途

### 5. 验证结果
- 跑了哪些命令
- 哪些通过
- 哪些失败
- 失败原因

### 6. 剩余问题 / 下一步
- 还没做的内容
- 下一阶段最值得继续推进的 1～3 件事

---

## 8. 一句话任务总结

这次任务的本质是：

**把 kibouFlow 的 content warning 治理，从“有扫描结果”推进到“有结构化输出、有 baseline、有 diff、有文档闭环”的下一阶段 harness。**
