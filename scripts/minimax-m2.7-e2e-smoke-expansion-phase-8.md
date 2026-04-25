# kibouFlow Harness Engineering 下一步执行任务（Phase 8：Selective E2E Smoke Expansion，适配 MiniMax M2.7）

> 请你作为一个 **E2E Smoke Guardrail 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness engineering。
> 当前项目已经完成：
> - Phase 1：content warning 结构化 / baseline / diff
> - Phase 1-A / 1-B / 1-C：内容 warning 清零，`verify:content` 当前为 **0 warnings**
> - Phase 2：content governance CI：`.github/workflows/content-governance.yml`
> - Phase 3：SEO/GEO governance CI：`.github/workflows/seo-geo-governance.yml`
> - Phase 4：Admin GEO governance CI：`.github/workflows/admin-geo-governance.yml`
> - Phase 5：baseline 历史留存与趋势分析
> - Phase 6：Core Flows Playwright CI：`.github/workflows/flows-governance.yml`
> - Phase 7：CI path filter refinement / workflow consistency
>
> 这一阶段不再优先新增新的 guardrail 类型，而是把 **现有 Playwright E2E 覆盖做一轮选择性扩展**，让低成本、稳定、已有价值的 E2E spec 得到更明确的自动化守卫。
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小可用落地，不要把“以后可以扩展全量 E2E”只留在文档里。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **E2E / guardrail 收口任务**，你可以修改 workflow、少量测试、少量文档和必要的命令入口，但不要做无关重构。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/testing-strategy.md`
  - `docs/manual-exploratory-checklist.md`
  - `package.json`
  - `scripts/run-harness-verify.mjs`
  - `tests/e2e/core-flows.spec.ts`
  - `tests/e2e/geo-phase3-health.spec.ts`
  - `tests/e2e/geo-rules-preview.spec.ts`
  - `playwright.config.*`
  - 现有 `.github/workflows/*.yml`

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要升级依赖，不要修改 `package-lock.json`。
- 不要把所有 E2E 一次性接进 CI；优先做 **低成本 smoke 扩展**。
- 不要创建复杂矩阵、多浏览器并行、artifact 上传等重型方案。
- 不要为了让 CI 通过而弱化关键断言。
- 不要把明显不稳定、依赖环境状态强的 spec 硬塞进 smoke 套件。

### 0.3 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现某个 E2E spec 不适合纳入 smoke guardrail，请明确写出来，不要强行接入。
- 最终输出必须包含：
  - 修改文件清单
  - 新增或更新的 workflow / 命令
  - 哪些 E2E spec 被纳入 smoke 覆盖
  - 哪些路径变化会触发
  - 执行过的验证命令
  - 遗留问题

---

## 1. 当前已知现状（请先核实）

请先带着以下事实进入任务：

1. 仓库已经有：
   - `.github/workflows/flows-governance.yml`
   - `npm run verify:flows`
   - `tests/e2e/core-flows.spec.ts`
2. 仓库中还存在其他 Playwright spec：
   - `tests/e2e/geo-phase3-health.spec.ts`
   - `tests/e2e/geo-rules-preview.spec.ts`
3. 当前 `verify:flows` 主要守核心用户 flows，不一定覆盖所有现有 E2E spec。
4. 当前还没有明确的 **selective E2E smoke expansion** 策略或命令入口。

如果你检查后发现以上任一点不成立，请以实际情况为准，并在最终输出中说明。

---

## 2. 本阶段目标

这次任务的目标不是做全量 E2E CI，而是在现有 Playwright spec 中筛选出**低成本、稳定、值得守的 smoke 级 E2E**，把它们更明确地纳入自动化。

### 2.1 核心目标

1. 审核现有 Playwright spec，判断哪些适合 smoke guardrail
2. 为合适的 spec 提供清晰的命令入口
3. 以最小可用方式接入 CI 或现有 workflow
4. 同步文档，明确 core flows 与 selective smoke 的边界

### 2.2 期望结果

理想情况下：

- 你会明确说明：
  - 哪些 spec 适合纳入 smoke
  - 哪些 spec 暂不适合
- 仓库中出现一个清晰的入口，例如：
  - 扩展 `verify:flows`
  - 或新增 `verify:e2e:smoke`
- workflow 侧有对应最小落地：
  - 可以扩展现有 `flows-governance.yml`
  - 或新增一个很轻量的 smoke workflow（仅在确有必要时）

### 2.3 非目标

本阶段不要求你：

- 接入全量 `tests/e2e/**/*.spec.ts`
- 上多浏览器矩阵
- 做截图回归
- 引入复杂 CI 分层

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实现有 E2E spec 边界

先检查：

- `package.json`
- `scripts/run-harness-verify.mjs`
- `tests/e2e/core-flows.spec.ts`
- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`
- `playwright.config.*`
- `.github/workflows/flows-governance.yml`
- `docs/testing-strategy.md`

输出简短结论：

1. 当前 `verify:flows` 已经守住了什么
2. 其他现有 E2E spec 各自测什么
3. 哪些 spec 适合纳入 smoke 套件
4. 哪些 spec 暂时不适合纳入，以及为什么

### 任务 B：设计最小可用 smoke 扩展方案

请基于仓库现状，在以下两种路径中选一个更合理的默认方案：

1. 扩展现有 `verify:flows`
2. 新增独立的 smoke 命令，例如 `verify:e2e:smoke`

**建议默认倾向：新增独立 smoke 命令，避免混淆 core flows 与其他轻量 E2E。**

原因：

- `verify:flows` 语义已经相对稳定
- 新命令更利于逐步扩展
- workflow 也更容易保持职责清晰

如果你决定直接扩展 `verify:flows`，必须说明理由。

### 任务 C：落地最小可用命令 / workflow

如果你判断现有 `geo-phase3-health.spec.ts`、`geo-rules-preview.spec.ts` 中有适合纳入 smoke 的内容，请做最小可用落地。

可接受的落地方式：

- 新增命令：
  - `npm run verify:e2e:smoke`
- 或扩展 `scripts/run-harness-verify.mjs`
- workflow 侧：
  - 优先扩展现有 `flows-governance.yml`
  - 只有在职责明显冲突时才新增新 workflow

要求：

1. 保持方案轻量
2. 不要破坏现有 `verify:flows`
3. Playwright 浏览器安装复用现有最小方案
4. 如果某些 spec 需要很特殊的环境，请不要硬纳入 smoke

### 任务 D：同步文档

至少更新：

- `docs/dev-test-seo-geo-loop-plan.md`

建议同步：

- `docs/testing-strategy.md`
- `docs/docs-index.md`

需要明确写清：

1. core flows guardrail 已完成什么
2. selective E2E smoke 本次扩展了什么
3. 还没纳入 smoke 的 spec 是什么、为什么

### 任务 E：本地验证

至少运行：

1. 你更新后的 `verify:flows` 或新 smoke 命令

如果你改了 workflow：

2. 检查 YAML 结构合理
3. 检查 Playwright 安装和命令引用没有明显错误

---

## 4. 推荐实施顺序

建议按这个顺序推进：

1. 审查现有 E2E spec
2. 决定 smoke 扩展路径
3. 落地命令 / workflow
4. 同步文档
5. 跑本地验证

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 能力层

- 现有 E2E spec 中适合 smoke 的部分已经被更明确纳入自动化
- 入口命令清晰，不混乱

### 5.2 设计层

- core flows 与 selective smoke 的边界清晰
- 没有把明显不稳定 spec 硬纳入 smoke

### 5.3 文档层

- `docs/dev-test-seo-geo-loop-plan.md` 已同步
- 文档中清楚写出本次 smoke 扩展范围

### 5.4 验证层

- 对应的 flows / smoke 命令通过

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `scripts/run-harness-verify.mjs`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/testing-strategy.md`
- `docs/docs-index.md`
- `.github/workflows/flows-governance.yml`
- `tests/e2e/core-flows.spec.ts`
- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`
- `playwright.config.*`

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 8 的最小闭环

### 2. 已确认的现状缺口
- 现有 flows guardrail 已覆盖什么
- selective E2E smoke 之前缺什么

### 3. 本次改动
- 按文件列出改动点

### 4. 新增或更新的 workflow / 命令
- 每个命令或 workflow 的用途
- 哪些 E2E spec 被纳入 smoke
- 哪些路径变化会触发

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

**把 kibouFlow 已有的 Playwright 能力从“只有 core flows guardrail”推进到“有选择地扩展到更完整的 smoke E2E 覆盖”，但依然保持轻量和稳定。**
