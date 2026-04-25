# kibouFlow Harness Engineering 下一步执行任务（Phase 12：Harness 维护交接与增强 Backlog 收口，适配 MiniMax M2.7）

> 请你作为一个 **Harness Maintenance Handoff Steward**，在当前项目根目录为 `kibouFlow` 做 harness engineering 的最终收口。
>
> 当前主线状态：
> - Phase 1 ~ Phase 11 已完成，不要重复做。
> - content / SEO-GEO / Admin GEO / flows 四条 CI guardrail 已落地。
> - Phase 10 是本地等价检查完成，不是真实 GitHub Actions 观察完成：`gh` CLI 不可用，真实 CI 记录未观察到。
> - Phase 11 已完成 E2E 分层策略：当前所有 Playwright E2E spec 均为 Tier 1 CI smoke；未来新增 spec 必须先做 tier 判断。
>
> 本阶段不是继续新增 harness 能力，而是把建设成果收成可维护交接状态，让后续 agent 清楚：主线已完成，剩余都是按需增强。

---

## 0. 执行边界

### 可以改

- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/docs-index.md`
- `docs/testing-strategy.md`
- 必要时新增一个很短的 handoff 文档，但优先复用现有文档

### 谨慎改

- `package.json`
- `scripts/run-harness-verify.mjs`
- `.github/workflows/*.yml`
- `tests/**`
- `scripts/selenium_geo_admin_flow.py`

默认不要改这些文件。只有发现“文档与实际命令明显不一致”时，才做最小修正。

### 不要改

- 不要修改 `.env*`
- 不要修改 `node_modules/`、`.next/`、`test-results/`
- 不要升级依赖，不要改 `package-lock.json`
- 不要新增 DB migration
- 不要新增命令、workflow、测试或 E2E spec
- 不要删除生成文件或临时产物；如果看到 `test-results/`、`__pycache__/`、`.pyc` 等，只记录为清理建议，不擅自删除
- 不要把真实 CI 未观察写成 CI 已通过

---

## 1. 当前已完成主线

请以实际文档为准核实：

- Phase 1：content warning 结构化 / baseline / diff
- Phase 1-A / 1-B / 1-C：content warning 清零
- Phase 2：content governance CI
- Phase 3：SEO/GEO governance CI
- Phase 4：Admin GEO governance CI
- Phase 5：baseline history / trend
- Phase 6：Core Flows Playwright CI
- Phase 7：CI path filter refinement
- Phase 8：Selective E2E Smoke Expansion
- Phase 8-A：E2E Smoke Trigger Refinement
- Phase 9：Admin GEO 手动测试清单自动化
- Phase 10：CI 首次运行稳定性观察（本地等价检查通过，真实 CI 未观察）
- Phase 11：E2E 分层评估与维护策略

---

## 2. 本阶段目标

最小目标：

1. 将 `docs/dev-test-seo-geo-loop-plan.md` 明确更新为：
   - Harness engineering 主线完成
   - 当前进入维护与增强阶段
   - 真实 CI 首次运行仍待下一次 push / PR 后观察
2. 将剩余事项整理为短 Backlog，而不是继续追加主线 Phase：
   - 真实 GitHub Actions 首次运行观察
   - TC-API-02 体检 API 自动化评估（按需，需 Python 环境）
   - 未来新增 E2E spec 的 tier review
3. 检查 `docs/docs-index.md` 是否正确指向：
   - `docs/dev-test-seo-geo-loop-plan.md`
   - `docs/testing-strategy.md`
   - `docs/geo-admin-selenium-e2e-flow.md`
   - `docs/geo-admin-hermes-manual-test.md`
4. 生成一段“后续窗口交接摘要”，让新 agent 能快速接手维护状态

---

## 3. 推荐执行步骤

### A. 核实现状

优先读取：

- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/testing-strategy.md`
- `docs/docs-index.md`
- `docs/geo-admin-selenium-e2e-flow.md`
- `docs/geo-admin-hermes-manual-test.md`
- `package.json`
- `.github/workflows/*.yml`

输出简短结论：

1. 主线是否已完整完成
2. 是否还有文档把已完成阶段写成“推荐下一步”
3. docs index 是否有旧描述

### B. 文档收口

更新 `docs/dev-test-seo-geo-loop-plan.md`：

- 明确状态：`Harness 主线完成，进入维护与增强阶段`
- 保留真实 CI 未观察的事实，不要改写为通过
- 将后续事项写成 Backlog，而不是继续默认推荐建设型 phase
- 保留 Phase 1~11 历史记录，不要重写历史

按需更新 `docs/docs-index.md`：

- 如果 `dev-test-seo-geo-loop-plan.md` 或 `testing-strategy.md` 的描述仍旧，只做最小修正

### C. 生成交接摘要

在 `docs/dev-test-seo-geo-loop-plan.md` 中新增或更新一段短摘要，内容包括：

- 当前四条 workflow
- 当前关键命令
- 当前 E2E 分层
- 剩余 Backlog
- 明确“不要默认扩 CI / 不要默认新增 E2E”

### D. 验证

本阶段以文档收口为主，至少做静态核对：

```bash
git diff -- docs/dev-test-seo-geo-loop-plan.md docs/docs-index.md docs/testing-strategy.md
```

如果只改文档，不需要跑完整 verify。

---

## 4. 验收标准

本阶段完成需要满足：

1. `docs/dev-test-seo-geo-loop-plan.md` 明确标记 harness 主线完成
2. 后续事项被归为 Backlog / maintenance，而不是继续默认建设型主线
3. `docs/docs-index.md` 没有明显旧描述
4. 真实 CI 未观察的风险保留清楚
5. 没有新增代码、workflow、测试或命令

---

## 5. 最终输出格式

请最终按下面结构输出：

### 1. 结论

- Phase 12 是否完成
- Harness 是否已进入维护与增强阶段

### 2. 本次改动

- 按文件列出改动

### 3. 维护 Backlog

- 真实 CI 首次 push 后观察
- TC-API-02 自动化评估
- 未来 E2E tier review
- 其他发现

### 4. 验证结果

- 做了哪些静态核对
- 是否没有必要跑完整 verify

### 5. 交接摘要

- 给后续 agent 的短摘要

### 6. 风险与遗留

- 真实 CI 未观察
- 环境依赖项仍需人工

---

## 6. 一句话任务总结

这次任务的本质是：**把已经完成的 harness engineering 从“建设主线”正式切换为“维护与增强阶段”，并把剩余事项收敛成清晰 Backlog。**
