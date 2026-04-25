# kibouFlow Harness Engineering 下一步执行任务（Phase 2：CI / 防回归收口，适配 MiniMax M2.7）

> 请你作为一个 **Harness Consolidation / CI Guardrail 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness engineering。
> 当前项目已经完成了 content warning 的结构化、baseline、diff，以及 Phase 1-A / 1-B / 1-C 的内容治理，`verify:content` 当前为 **0 warnings**。
> 这一阶段不再优先修内容，而是要把“现在已经清零的状态”变成 **可持续守住的自动化约束**。
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小可用落地，不要把“建议接入 CI”只停留在文档层。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **harness / CI 收口任务**，你可以修改脚本、配置和文档，但应避免无关重构。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/content-warning-remediation-plan.md`
  - `docs/new-post-sop.md`
  - `package.json`
  - `scripts/content-harness-check.mjs`
  - `scripts/content-warning-diff.mjs`
  - `scripts/content-warning-baseline.mjs`
  - `scripts/baselines/content-warning-baseline.json`
- 如果文档、脚本和 baseline 不一致，以**当前仓库状态 + 实际命令输出**为准，然后把差异收敛掉。

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要升级依赖，不要修改 `package-lock.json`。
- 不要大规模修改 `content/**`，这一阶段重点不是内容修复。
- 不要引入复杂的外部 CI 平台依赖或第三方 GitHub Action 市场插件，优先用最小可用的原生方案。

### 0.3 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现仓库当前没有任何 `.github/workflows/*`，请明确记为“CI 尚未落地”。
- 最终输出必须包含：
  - 修改文件清单
  - 新增或更新的命令 / 工作流
  - 哪个条件下 CI 会 fail
  - 执行过的验证命令
  - 遗留问题

---

## 1. 当前已知现状（请先核实）

请先带着以下事实进入任务：

1. `verify:content` 当前结果为：
   - blocking errors: `0`
   - warnings: `0`
2. `scripts/baselines/content-warning-baseline.json` 当前 baseline 为：
   - `totalWarnings: 0`
3. 仓库目前尚未发现已落地的 `.github/workflows/*`
4. `audit:content:diff` 当前可以做对比，但**还不是 CI 可直接依赖的回归失败信号**
5. `docs/content-warning-remediation-plan.md` 仍有大量旧数字和旧阶段描述，尚未完全同步到“warning 已清零”的现实

如果你检查后发现以上任一点不成立，请以实际情况为准，并在最终输出里说明。

---

## 2. 本阶段目标

这次任务的目标不是继续“手工消 warning”，而是把已经完成的治理成果固定住。

### 2.1 核心目标

1. 为 content warning 增加 **CI 可用的 fail-on-regression 机制**
2. 落地最小可用的 **CI / PR 自动校验**
3. 同步关键文档到“baseline=0 / warning=0”的当前状态

### 2.2 期望结果

理想情况下：

- 仓库中出现最小可用的 `.github/workflows/*.yml`
- `audit:content:diff` 或等价脚本支持：
  - 在出现回归时返回非 0 exit code
- 内容相关变更在 PR / push 时会自动触发校验
- 文档不再停留在“warning 还有 33/69 条”的旧状态

### 2.3 非目标

本阶段不要求你：

- 重写内容文章
- 引入复杂矩阵构建、缓存优化、并行流水线体系
- 搭建完整发布流水线
- 处理 admin GEO 或 SEO/GEO 的其他自动化问题

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实现有自动化缺口

先检查：

- 是否存在 `.github/workflows/`
- `scripts/content-warning-diff.mjs` 是否支持在回归时 fail
- `package.json` 是否已经有适合 CI 直接调用的命令

输出简短结论：

1. 目前有没有 CI workflow
2. 目前 `audit:content:diff` 是否只“显示结果”而不会“阻止回归”
3. 你准备如何补这个缺口

### 任务 B：为 diff 增加 CI 可用的回归失败信号

请增强现有 content diff 机制，使其可以被 CI 使用。

最小要求：

1. 支持一种显式模式，例如：
   - `--fail-on-regression`
   - 或等价命名
2. 在以下情况返回非 0 exit code：
   - 总 warning 数增加
   - 出现新的 warning code
   - `P1` 数量上升
   - baseline 为 0 时，当前出现任何 warning
3. 在“没有回归”时返回 0
4. 终端输出仍然要易读，不能只有 exit code 没有解释

要求：

- 优先在 `scripts/content-warning-diff.mjs` 上增强
- 不要新引入依赖
- 尽量保持现有 human-readable 输出风格

### 任务 C：增加适合 CI 调用的命令入口

如果需要，请在 `package.json` 中增加更明确的命令，例如：

- `audit:content:diff:strict`
- 或等价命名

要求：

- 命令名与现有 `verify:*` / `audit:*` 风格一致
- 一眼能看出它是给 CI / 守卫用的

### 任务 D：落地最小可用 CI workflow

如果仓库当前没有 `.github/workflows/*`，请新增一个最小可用 workflow。

建议目标：

1. 在 `pull_request` 触发
2. 在 `push` 到主分支时触发
3. 至少运行以下内容：
   - Node 环境安装
   - `npm ci` 或项目当前最合适的安装方式
   - `npm run verify:content`
   - 严格模式的 `audit:content:diff`

可选但有价值：

- 对内容相关路径变更做 path filter
- 输出 baseline / diff 摘要

要求：

- 优先用 GitHub Actions 原生能力
- 不要把 workflow 做得过重
- 如果你认为应拆成两个 workflow，请说明理由；否则默认一个最小 workflow 足够

### 任务 E：补一份“任务类型 -> 命令入口”操作表

`docs/dev-test-seo-geo-loop-plan.md` 里已经多次提到“还没有单独的操作表”。这次请把它补上，位置你可自行选择，但建议放在以下之一：

- `docs/dev-test-seo-geo-loop-plan.md`
- 或新增一个小型 docs 文件并从 `docs/docs-index.md` 链接

最小要求：

至少覆盖这些场景：

1. 日常代码回归
2. 内容修改
3. SEO/GEO 结构修改
4. admin GEO 修改
5. 发布前综合验证
6. 内容回归 diff / baseline 更新

### 任务 F：同步关键文档到“warning=0”现状

至少同步这些文档中的关键数字和叙述：

- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/content-warning-remediation-plan.md`

如果合适，也可同步：

- `docs/new-post-sop.md`
- `docs/docs-index.md`

要求：

1. 不要把旧的 69 / 33 warning 数字继续保留在“当前状态”里
2. 要明确写出：
   - 当前 baseline=0
   - 下一步重点变为防回归
3. 若保留历史数字，需明确标注为“历史基线 / 历史阶段结果”

---

## 4. 推荐实施顺序

建议按这个顺序推进：

1. 先检查当前 CI 与 diff 行为
2. 先增强 `content-warning-diff.mjs`
3. 再补 `package.json` 命令
4. 再新增 `.github/workflows/*`
5. 最后同步文档
6. 运行本地验证确认 strict 模式可用

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 脚本层

- `audit:content:diff` 存在 CI 可用的严格模式
- 严格模式在回归时会 fail，在无回归时会 pass

### 5.2 CI 层

- 仓库中存在最小可用的 workflow 文件
- workflow 会自动运行内容治理相关校验

### 5.3 文档层

- `docs/dev-test-seo-geo-loop-plan.md` 同步到 warning=0 现状
- `docs/content-warning-remediation-plan.md` 不再把旧数字当成当前状态
- 操作表已可查

### 5.4 验证层

至少完成以下验证：

1. `npm run verify:content`
2. 你新增的 strict diff 命令
3. 如有必要，模拟一次 strict 模式在无回归时返回 0

如果你实现了需要额外验证的脚本逻辑，也请补充本地命令验证。

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/content-warning-remediation-plan.md`
- `docs/new-post-sop.md`
- `scripts/content-harness-check.mjs`
- `scripts/content-warning-diff.mjs`
- `scripts/content-warning-baseline.mjs`
- `scripts/baselines/content-warning-baseline.json`

如果不存在，请创建：

- `.github/workflows/content-governance.yml`
  - 或你认为更合适的等价命名

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 2 的最小闭环

### 2. 已确认的现状缺口
- 当前 CI / diff / docs 有哪些缺口

### 3. 本次改动
- 按文件列出改动点

### 4. 新增或更新的命令 / workflow
- 每个命令或 workflow 的用途
- 哪些条件下会 fail

### 5. 验证结果
- 跑了哪些命令
- 哪些通过
- 哪些失败
- strict 模式是否可用

### 6. 剩余问题 / 下一步
- 还没做的内容
- 下一阶段最值得继续推进的 1～3 件事

---

## 8. 一句话任务总结

这次任务的本质是：

**把 kibouFlow 的 content warning 治理从“已经清零”推进到“能被 CI 持续守住”，补上 fail-on-regression、最小 CI workflow 和文档同步。**
