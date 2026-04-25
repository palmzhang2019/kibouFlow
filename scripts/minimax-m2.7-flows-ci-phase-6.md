# kibouFlow Harness Engineering 下一步执行任务（Phase 6：核心 flows / Playwright CI 守卫，适配 MiniMax M2.7）

> 请你作为一个 **Core Flows Guardrail 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness engineering。
> 当前项目已经完成：
> - Phase 1：content warning 结构化 / baseline / diff
> - Phase 1-A / 1-B / 1-C：内容 warning 清零，`verify:content` 当前为 **0 warnings**
> - Phase 2：content governance CI：`.github/workflows/content-governance.yml`
> - Phase 3：SEO/GEO governance CI：`.github/workflows/seo-geo-governance.yml`
> - Phase 4：Admin GEO governance CI：`.github/workflows/admin-geo-governance.yml`
> - Phase 5：baseline 历史留存与趋势分析
>
> 这一阶段不再优先扩展 baseline 或新增内容治理规则，而是把 **核心用户 flows 的 Playwright 回归** 以最小可用方式接入 CI。
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小可用落地，不要把“以后可以接 verify:flows”只留在文档里。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **CI / guardrail 收口任务**，你可以修改 workflow、少量测试、少量文档和必要的脚本入口，但不要做无关重构。
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
  - `playwright.config.*`（如果存在）
  - 现有 `.github/workflows/*.yml`

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要升级依赖，不要修改 `package-lock.json`。
- 不要把 workflow 做成复杂矩阵；优先最小可用。
- 不要把所有 E2E 一次性接进 CI；优先只守核心 flows。
- 不要为了让 CI 通过而静默降低关键断言价值。
- 不要把不稳定的浏览器流程硬塞进 CI 而不说明风险。

### 0.3 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现某个 flows 风险点已经有现成自动化覆盖，请明确写出来，不要重复建设。
- 最终输出必须包含：
  - 修改文件清单
  - 新增或更新的 workflow / 命令
  - 哪些路径变化会触发 flows 守卫
  - Playwright 浏览器安装 / 运行方式
  - 执行过的验证命令
  - 遗留问题

---

## 1. 当前已知现状（请先核实）

请先带着以下事实进入任务：

1. 仓库已经有：
   - `npm run verify:flows`
   - `scripts/run-harness-verify.mjs`
   - `tests/e2e/core-flows.spec.ts`
2. `verify:flows` 当前应主要运行：
   - `tests/e2e/core-flows.spec.ts`
3. 当前三套 governance workflow 已完成：
   - content governance
   - SEO/GEO governance
   - Admin GEO governance
4. 当前还没有明确落地的 **flows / Playwright 专用 workflow**。
5. `docs/dev-test-seo-geo-loop-plan.md` 已把 `verify:flows` / Playwright 是否接入 CI 列为后续方向。

如果你检查后发现以上任一点不成立，请以实际情况为准，并在最终输出中说明。

---

## 2. 本阶段目标

这次任务的目标不是把全量 E2E 体系做重，而是让最关键的用户 flows 有一条最小 CI 回归防线。

### 2.1 核心目标

1. 为核心用户 flows 新增最小可用 CI workflow
2. 让 `verify:flows` 在相关路径变化时自动执行
3. 同步文档，明确 content / SEO-GEO / admin-geo / flows 四条 guardrail 的职责边界

### 2.2 期望结果

理想情况下：

- 仓库中新增一个独立的 workflow，例如：
  - `.github/workflows/flows-governance.yml`
- 在相关路径变化时自动触发：
  - `npm run verify:flows`
- workflow 中包含 Playwright 运行所需的最小浏览器安装步骤
- 文档明确写清：
  - content workflow 管什么
  - SEO/GEO workflow 管什么
  - admin GEO workflow 管什么
  - flows workflow 管什么

### 2.3 非目标

本阶段不要求你：

- 跑全量 E2E
- 接入多浏览器矩阵
- 处理所有 Playwright 测试文件
- 处理视觉回归
- 处理手动测试清单自动化

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实现有 flows 验证边界

先检查：

- `package.json`
- `scripts/run-harness-verify.mjs`
- `tests/e2e/core-flows.spec.ts`
- `docs/testing-strategy.md`
- 现有 `.github/workflows/*.yml`

输出简短结论：

1. `verify:flows` 当前已经守住了什么
2. 哪些关键链路已经有 Playwright 覆盖
3. 还缺少什么 CI 自动化
4. 你准备新增独立 workflow，还是扩展现有 workflow

**建议默认选择：新增独立 workflow。**

原因：

- Playwright 依赖、运行时、失败模式都与 Vitest/next build 不同
- path filter 更容易维护
- 失败信号更清晰

如果你决定不拆分，必须说明理由。

### 任务 B：定义 flows workflow 的触发范围

请基于仓库现状，为 flows workflow 设定最小合理的 path filter。

优先考虑这些路径：

- `tests/e2e/core-flows.spec.ts`
- `scripts/run-harness-verify.mjs`
- `package.json`
- `playwright.config.*`（如果存在）
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/trial/**`
- `src/app/[locale]/partner/**`
- `src/app/api/trial/**`
- `src/app/api/partner/**`
- `src/app/api/track/**`
- 直接影响 core flow 的组件 / lib 文件

要求：

1. 不要过宽到几乎所有改动都触发
2. 也不要窄到明显漏掉关键 trial / partner 流程
3. 如果需要把共享组件或埋点逻辑纳入，请说明理由

### 任务 C：落地最小可用 flows workflow

新增一个最小 workflow，建议：

- 文件名：`.github/workflows/flows-governance.yml`
- 触发：
  - `pull_request` to `main`
  - `push` to `main`
  - 带 path filter
- 步骤：
  1. checkout
  2. setup node
  3. install dependencies
  4. 安装 Playwright 所需浏览器（最小可用即可）
  5. `npm run verify:flows`

要求：

1. 优先用 GitHub Actions 原生能力
2. 风格与现有 governance workflows 保持一致
3. 不要过度优化 artifact、并行、矩阵
4. 如果当前 `verify:flows` 在 CI 环境不可直接运行，请做最小必要修正

### 任务 D：必要时收紧或修复 flows 测试入口

只有在以下情况才考虑修改测试或 verify 入口：

- 当前 `verify:flows` 不适合 CI 使用
- 当前 spec 对现有 UI copy / 选择器明显过时
- 必须补一个极小修正才能让核心 flows 稳定表达真实回归风险

默认倾向：

- **不新增新测试套件**
- 直接复用 `npm run verify:flows`

### 任务 E：同步计划文档与职责边界

至少更新：

- `docs/dev-test-seo-geo-loop-plan.md`

建议同步：

- `docs/testing-strategy.md`
- `docs/docs-index.md`

需要明确写清：

1. flows governance workflow 已完成（如果你本次完成）
2. 四条 workflow 的职责分工
3. 下一步真正还没做的是什么

### 任务 F：本地验证

至少运行：

1. `npm run verify:flows`

如果你新增或修改了 workflow 文件，虽然本地不能真实跑 GitHub Actions，也要至少检查：

2. workflow YAML 结构合理
3. Playwright 浏览器安装与命令引用没有明显拼写错误

如果你额外改了脚本或测试，也要补对应验证。

---

## 4. 推荐实施顺序

建议按这个顺序推进：

1. 先检查现有 flows 验证边界
2. 确定 path filter
3. 新增独立 flows workflow
4. 必要时做最小测试 / 入口修正
5. 同步计划文档
6. 跑 `npm run verify:flows`

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 CI 层

- 仓库中存在独立的 flows workflow 文件
- 相关路径变化会自动触发 `verify:flows`

### 5.2 设计层

- workflow 与 content / SEO-GEO / Admin GEO governance 的职责边界清晰
- path filter 合理，不明显过宽或过窄

### 5.3 文档层

- `docs/dev-test-seo-geo-loop-plan.md` 已同步
- 文档中清楚写出四条 workflow 的分工

### 5.4 验证层

- `npm run verify:flows` 通过

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `scripts/run-harness-verify.mjs`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/testing-strategy.md`
- `docs/docs-index.md`
- `.github/workflows/content-governance.yml`
- `.github/workflows/seo-geo-governance.yml`
- `.github/workflows/admin-geo-governance.yml`
- `tests/e2e/core-flows.spec.ts`
- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`
- `playwright.config.*`（如果存在）

如果不存在，请创建：

- `.github/workflows/flows-governance.yml`

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 6 的最小闭环

### 2. 已确认的现状缺口
- content / SEO-GEO / Admin GEO governance 已覆盖什么
- flows CI 自动化之前缺什么

### 3. 本次改动
- 按文件列出改动点

### 4. 新增或更新的 workflow / 命令
- 每个 workflow 或命令的用途
- 哪些路径变化会触发
- Playwright 在 CI 中如何安装 / 运行

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

**把 kibouFlow 的自动化守卫从 content / SEO-GEO / Admin GEO 三条 deterministic CI 防线，继续扩展到核心用户 flows 的 Playwright 回归防线。**
