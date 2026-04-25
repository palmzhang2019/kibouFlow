# kibouFlow Harness Engineering 下一步执行任务（Phase 8-A：E2E Smoke Trigger Refinement，适配 MiniMax M2.7）

> 请你作为一个 **E2E Smoke CI 触发边界收口代理**，在当前项目根目录继续推进 `kibouFlow` 的 harness engineering。
>
> 当前主线状态：
> - Phase 1 ~ Phase 7 已完成，不要重复做。
> - Phase 8（Selective E2E Smoke Expansion）已完成最小闭环：
>   - 新增 `npm run verify:e2e:smoke`
>   - `verify:e2e:smoke` 运行三个 Playwright spec：
>     - `tests/e2e/core-flows.spec.ts`
>     - `tests/e2e/geo-phase3-health.spec.ts`
>     - `tests/e2e/geo-rules-preview.spec.ts`
>   - `.github/workflows/flows-governance.yml` 已改为运行 `npm run verify:e2e:smoke`
>   - `npm run verify:flows` 保留为只运行 core-flows spec
>
> 本阶段不是扩展新的 E2E 覆盖，而是把 Phase 8 扩展后的 **CI 触发边界** 收干净。

---

## 0. 执行边界

### 可以改

- `.github/workflows/flows-governance.yml`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/testing-strategy.md`
- `docs/docs-index.md`
- 必要时少量更新 `package.json` 或 `scripts/run-harness-verify.mjs`，但只有发现 Phase 8 实现和文档不一致时才改

### 不要改

- 不要修改 `.env*`
- 不要修改 `node_modules/`、`.next/`、`test-results/`
- 不要升级依赖，不要改 `package-lock.json`
- 不要新增重型 CI 矩阵、多浏览器矩阵、artifact 上传或截图回归
- 不要把全量 `tests/e2e/**/*.spec.ts` 无差别纳入 CI
- 不要改内容文章、DB migration、SEO/GEO 核心逻辑

---

## 1. 当前已知问题

Phase 8 已经让 `flows-governance.yml` 运行 `npm run verify:e2e:smoke`，但是当前 workflow 的 path filter 可能仍然主要围绕 `core-flows.spec.ts` 和 trial/partner/tracking 路径。

请重点核实：

1. `flows-governance.yml` 的 `push.paths` 和 `pull_request.paths` 是否已经显式包含：
   - `tests/e2e/geo-phase3-health.spec.ts`
   - `tests/e2e/geo-rules-preview.spec.ts`
2. workflow job 名称是否仍然叫 `Core Flows Guard`，如果它现在运行完整 E2E smoke，是否需要改成更准确的名称，例如 `E2E Smoke Guard`
3. 文档是否准确表达：
   - `verify:flows` = core-flows 单独入口
   - `verify:e2e:smoke` = core-flows + geo-phase3-health + geo-rules-preview
   - flows workflow 当前运行 `verify:e2e:smoke`
   - 新纳入的 smoke spec 文件变更会触发 flows workflow

---

## 2. 本阶段目标

最小目标：

1. 补齐 `flows-governance.yml` 对两个新增 smoke spec 的显式 path filter
2. 保持 `verify:flows` 和 `verify:e2e:smoke` 的语义清晰
3. 同步文档，说明 Phase 8-A 只是触发边界 refinement，不是新一轮 E2E 扩容
4. 本地验证 smoke 命令仍然通过

---

## 3. 推荐执行步骤

### A. 核实现状

优先读取：

- `package.json`
- `scripts/run-harness-verify.mjs`
- `.github/workflows/flows-governance.yml`
- `tests/e2e/core-flows.spec.ts`
- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/testing-strategy.md`
- `docs/docs-index.md`

请确认当前 `verify:e2e:smoke` 实际运行哪些 spec，以及 workflow path filter 是否覆盖这些 spec 文件本身。

### B. 最小实现

如果发现 `flows-governance.yml` 未显式包含两个新增 smoke spec，请在 `push.paths` 和 `pull_request.paths` 中补齐：

- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`

如果 job name 仍然明显偏旧，可以把：

- `Core Flows Guard`

调整为更准确的：

- `E2E Smoke Guard`

不要为了这个阶段扩大 path filter 到全部 admin API，除非你能说明这是必要且不会和 `admin-geo-governance.yml` 职责冲突。Admin API 代码变更主要仍由 `admin-geo-governance.yml` 守卫；本阶段的关键是让 smoke spec 自身变化能触发 smoke workflow。

### C. 文档同步

至少检查并按需更新：

- `docs/dev-test-seo-geo-loop-plan.md`

建议同步：

- `docs/testing-strategy.md`
- `docs/docs-index.md`

文档需要写清：

1. Phase 8-A 已完成的是 E2E smoke path filter refinement
2. `flows-governance.yml` 运行 `verify:e2e:smoke`
3. `verify:e2e:smoke` 覆盖三个 spec
4. 两个新增 smoke spec 文件自身变更会触发 workflow
5. 后续真正的下一阶段仍可考虑：
   - Admin GEO 手动测试清单自动化
   - flows workflow 首次 CI 运行稳定性观察
   - 全量 E2E 分层评估

### D. 验证

至少运行：

```bash
npm run verify:e2e:smoke
```

如果只改了 workflow 和文档，也请检查 YAML 缩进和结构，不要引入无效 workflow。

---

## 4. 验收标准

本阶段完成需要满足：

1. `flows-governance.yml` 的 push 和 pull_request path filter 都显式包含三个 smoke spec
2. `npm run verify:e2e:smoke` 仍然通过
3. 文档不再声称 Phase 8 后的 path filter 已完全收口而实际缺少两个 smoke spec
4. 没有扩大到全量 E2E CI
5. 没有改变四条 workflow 的基本职责边界

---

## 5. 最终输出格式

请最终按下面结构输出：

### 1. 结论

- Phase 8-A 是否完成

### 2. 已确认的问题

- path filter 原本缺什么
- workflow/job 命名是否需要修正

### 3. 本次改动

- 按文件列出改动

### 4. 触发边界

- flows workflow 现在在哪些 E2E spec 文件变化时触发
- 是否刻意没有扩大到 admin API 全路径，原因是什么

### 5. 验证结果

- 跑了哪些命令
- 通过或失败情况

### 6. 下一步建议

- 推荐下一阶段 1~3 件事

---

## 6. 一句话任务总结

这次任务的本质是：**把 Phase 8 新增的 E2E smoke 命令和 flows workflow 的触发边界对齐，补齐两个新增 smoke spec 的显式 path filter，同时保持 CI 轻量、职责清晰。**
