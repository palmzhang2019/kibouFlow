# kibouFlow Harness Engineering 下一步执行任务（Phase 7：CI path filter refinement / workflow consistency，适配 MiniMax M2.7）

> 请你作为一个 **CI Guardrail Refinement 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness engineering。
> 当前项目已经完成：
> - Phase 1：content warning 结构化 / baseline / diff
> - Phase 1-A / 1-B / 1-C：内容 warning 清零，`verify:content` 当前为 **0 warnings**
> - Phase 2：content governance CI：`.github/workflows/content-governance.yml`
> - Phase 3：SEO/GEO governance CI：`.github/workflows/seo-geo-governance.yml`
> - Phase 4：Admin GEO governance CI：`.github/workflows/admin-geo-governance.yml`
> - Phase 5：baseline 历史留存与趋势分析
> - Phase 6：Core Flows Playwright CI：`.github/workflows/flows-governance.yml`
>
> 这一阶段不再优先新增新的 guardrail 类型，而是把 **现有四条 workflow 的 path filter 与触发一致性** 做一次最小可用收口，减少明显的误触发 / 漏触发。
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小可用落地，不要把“以后可以微调 path filter”只留在文档里。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **CI / governance 收口任务**，你可以修改 workflow、少量文档，但不要做无关重构。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `package.json`
  - `scripts/run-harness-verify.mjs`
  - `scripts/content-warning-baseline.mjs`
  - `scripts/content-warning-diff.mjs`
  - `.github/workflows/content-governance.yml`
  - `.github/workflows/seo-geo-governance.yml`
  - `.github/workflows/admin-geo-governance.yml`
  - `.github/workflows/flows-governance.yml`

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要升级依赖，不要修改 `package-lock.json`。
- 不要新增复杂 matrix 或 artifact 逻辑。
- 不要扩展新的测试套件；这一阶段重点是 workflow 触发边界，而不是增加验证范围。
- 不要为了“更细”而把 path filter 收窄到明显漏掉真实依赖。

### 0.3 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现某个 workflow 已经足够合理，请明确写出来，不要为改而改。
- 最终输出必须包含：
  - 修改文件清单
  - 哪些 workflow 被更新
  - 每个 workflow 的 path filter 调整点
  - 执行过的验证命令
  - 遗留问题

---

## 1. 当前已知现状（请先核实）

请先带着以下事实进入任务：

1. 仓库当前已经有四条独立 workflow：
   - content governance
   - SEO/GEO governance
   - Admin GEO governance
   - flows governance
2. 四条 workflow 都已经能运行对应命令：
   - `verify:content`
   - `verify:seo-geo`
   - `verify:admin-geo`
   - `verify:flows`
3. 当前剩余的明显优化空间主要是：
   - `push` / `pull_request` 触发是否一致
   - workflow 自身、相关脚本、`package.json` 是否都被正确纳入
   - path filter 是否存在明显过宽或过窄
4. `docs/dev-test-seo-geo-loop-plan.md` 已把“更细粒度的 path filter”列为后续方向。

如果你检查后发现以上任一点不成立，请以实际情况为准，并在最终输出中说明。

---

## 2. 本阶段目标

这次任务的目标不是新增新 workflow，而是让四条已存在的 guardrail 在触发边界上更一致、更可信。

### 2.1 核心目标

1. 统一检查四条 workflow 的 `push` / `pull_request` path filter
2. 补齐明显漏掉的 workflow 依赖路径
3. 去掉明显错误或过时的路径
4. 同步文档，明确 path filter refinement 已完成到什么程度

### 2.2 期望结果

理想情况下：

- 四条 workflow 在触发行为上更一致
- workflow 自身、关键命令入口、关键脚本依赖都被纳入
- 文档明确说明“当前 path filter 已做过一轮 refinement”

### 2.3 非目标

本阶段不要求你：

- 改测试内容
- 增加新的 workflow 类型
- 改 CI 缓存策略
- 引入复杂共享 action

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实现有 workflow 触发边界

先检查：

- `.github/workflows/content-governance.yml`
- `.github/workflows/seo-geo-governance.yml`
- `.github/workflows/admin-geo-governance.yml`
- `.github/workflows/flows-governance.yml`
- `package.json`
- `scripts/run-harness-verify.mjs`
- `scripts/content-warning-baseline.mjs`
- `scripts/content-warning-diff.mjs`

输出简短结论：

1. 哪些 workflow 已经有合理的 `push` / `pull_request` path filter
2. 哪些 workflow 还存在明显不一致
3. 哪些关键依赖路径可能漏了

### 任务 B：做最小合理 refinement

请基于仓库现状，为四条 workflow 做最小合理调整。

优先考虑这些问题：

- `push` 和 `pull_request` 是否都带 path filter
- workflow 文件自身是否纳入 path filter
- `package.json`、相关 verify / audit 脚本是否纳入
- 是否有明显错误路径或过时路径

要求：

1. 不要为了“统一”而引入不必要的大改
2. 只修明显问题
3. 每个改动都要能解释为什么

### 任务 C：同步文档

至少更新：

- `docs/dev-test-seo-geo-loop-plan.md`

建议同步：

- `docs/docs-index.md`

需要明确写清：

1. path filter refinement 本次完成了什么
2. 当前四条 workflow 的触发边界已经达到什么程度
3. 真正还没做的是什么

### 任务 D：本地验证

至少进行：

1. YAML 结构合理性检查
2. 关键 path / command 引用拼写检查

如果你修改了某条 workflow 依赖到的命令入口，也要补对应命令验证，但默认不要求全量重跑四套验证。

---

## 4. 推荐实施顺序

建议按这个顺序推进：

1. 先检查四条 workflow 现状
2. 确定最小必要改动
3. 更新 workflow
4. 同步文档
5. 做 YAML / path / command 校验

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 Workflow 层

- 四条 workflow 的触发边界经过一轮最小合理 refinement
- 明显的漏触发 / 误触发风险被收口

### 5.2 设计层

- 改动范围克制
- 每条改动都能对应明确理由

### 5.3 文档层

- `docs/dev-test-seo-geo-loop-plan.md` 已同步
- 文档中清楚写出 refinement 已完成到什么程度

### 5.4 验证层

- YAML 结构检查通过
- 关键 path / command 引用没有明显错误

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `scripts/run-harness-verify.mjs`
- `scripts/content-warning-baseline.mjs`
- `scripts/content-warning-diff.mjs`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/docs-index.md`
- `.github/workflows/content-governance.yml`
- `.github/workflows/seo-geo-governance.yml`
- `.github/workflows/admin-geo-governance.yml`
- `.github/workflows/flows-governance.yml`

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 7 的最小闭环

### 2. 已确认的现状缺口
- 四条 workflow 之前各自缺什么
- 本次收口了什么

### 3. 本次改动
- 按文件列出改动点

### 4. 更新的 workflow
- 每个 workflow 调整了什么
- 为什么这样调

### 5. 验证结果
- 做了哪些检查
- 哪些通过
- 哪些失败

### 6. 剩余问题 / 下一步
- 还没做的内容
- 下一阶段最值得继续推进的 1～3 件事

---

## 8. 一句话任务总结

这次任务的本质是：

**把 kibouFlow 已经成型的四条 CI guardrail 再做一轮 path filter 与触发一致性收口，让它们更稳、更省、更可信。**
