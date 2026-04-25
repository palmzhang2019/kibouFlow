# kibouFlow Harness Engineering 下一步执行任务（Phase 10：CI 首次运行稳定性观察，适配 MiniMax M2.7）

> 请你作为一个 **Harness CI Stability Observer**，在当前项目根目录继续推进 `kibouFlow` 的 harness engineering。
>
> 当前主线状态：
> - Phase 1 ~ Phase 9 已完成，不要重复做。
> - content / SEO-GEO / Admin GEO / flows 四条 CI guardrail 已落地。
> - flows workflow 已运行 `verify:e2e:smoke`，job 名称为 `E2E Smoke Guard`。
> - `verify:e2e:smoke` 覆盖三个 Playwright spec：
>   - `tests/e2e/core-flows.spec.ts`
>   - `tests/e2e/geo-phase3-health.spec.ts`
>   - `tests/e2e/geo-rules-preview.spec.ts`
> - Phase 9 已补齐 Admin GEO Selenium 主流程中的 TC-NAV-01 与 TC-AUTH-02 加强版。
>
> 本阶段不是新增新的 harness 能力，而是观察和收口：确认四条 workflow 在真实 CI 或本地等价环境中稳定、触发边界清楚、失败信号可解释。

---

## 0. 执行边界

### 可以改

- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/testing-strategy.md`
- `docs/docs-index.md`
- 只有当 CI 或本地等价检查暴露明确 bug 时，才改对应 workflow / script / test

### 谨慎改

- `.github/workflows/*.yml`
- `scripts/run-harness-verify.mjs`
- `tests/e2e/**`
- `scripts/selenium_geo_admin_flow.py`

这些文件只在有明确失败原因时修改，不要为了“顺手优化”而改。

### 不要改

- 不要修改 `.env*`
- 不要修改 `node_modules/`、`.next/`、`test-results/`
- 不要升级依赖，不要改 `package-lock.json`
- 不要新增 DB migration
- 不要新增重型 CI 矩阵、多浏览器矩阵、artifact 上传或截图回归
- 不要把本地未执行的 GitHub Actions 观察写成“CI 已通过”
- 不要把生成文件（例如 `__pycache__` / `.pyc`）纳入本阶段成果

---

## 1. 当前 workflow 边界

需要观察的四条 workflow：

- `.github/workflows/content-governance.yml`
  - 运行：`npm run verify:content` + `npm run audit:content:diff:strict`
- `.github/workflows/seo-geo-governance.yml`
  - 运行：`npm run verify:seo-geo`
- `.github/workflows/admin-geo-governance.yml`
  - 运行：`npm run verify:admin-geo`
- `.github/workflows/flows-governance.yml`
  - 运行：`npm run verify:e2e:smoke`

本阶段最关注：

1. flows workflow 首次 CI 是否稳定
2. `npx playwright install --with-deps chromium` 在 CI 是否正常
3. `verify:e2e:smoke` 在 CI 是否稳定通过
4. 四条 workflow 的 path filter 是否仍与职责边界一致
5. 如果没有真实 CI 访问权限，是否能通过本地等价验证明确当前风险

---

## 2. 推荐执行步骤

### A. 核实现状

优先读取：

- `docs/dev-test-seo-geo-loop-plan.md`
- `package.json`
- `scripts/run-harness-verify.mjs`
- `.github/workflows/content-governance.yml`
- `.github/workflows/seo-geo-governance.yml`
- `.github/workflows/admin-geo-governance.yml`
- `.github/workflows/flows-governance.yml`
- `tests/e2e/core-flows.spec.ts`
- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`

输出简短结论：

1. 当前四条 workflow 分别运行什么命令
2. 本阶段是否能访问 GitHub Actions 或 CI 运行结果
3. 如果不能访问，选择哪些本地等价命令作为替代检查

### B. 真实 CI 观察（优先）

如果你能访问 GitHub Actions / PR checks / `gh` CLI，请观察最近一次相关运行：

- Content Governance
- SEO/GEO Governance
- Admin GEO Governance
- Flows Governance / E2E Smoke Guard

记录：

- workflow 名称
- run status / conclusion
- 触发事件（push / pull_request）
- 运行耗时
- 失败时的关键日志摘要

如果某条 workflow 没有被触发，不要写“通过”；请写成“未观察到真实运行”，并说明是否因为 path filter 未命中。

### C. 本地等价检查（CI 不可访问时）

如果无法观察真实 CI，请优先运行最能代表当前风险的本地检查：

```bash
npm run verify:e2e:smoke
```

按需运行：

```bash
npm run verify:admin-geo
npm run verify:content
npm run verify:seo-geo
```

注意：

- `verify:seo-geo` 会运行 `next build`，耗时较长，只在环境允许时跑。
- 如果命令因环境限制失败，需要明确记录是环境限制还是代码失败。
- 不要把本地等价检查写成 GitHub Actions 已通过。

### D. 必要修复

只有在观察到明确问题时才修复，例如：

- workflow 命令拼写错误
- path filter 明显漏掉 workflow 自身或关键 spec
- Playwright install 步骤缺失
- harness 命令在 CI shell 下不可执行

不要在本阶段扩大 E2E 覆盖、引入新 workflow 或改动业务逻辑。

### E. 文档同步

至少更新：

- `docs/dev-test-seo-geo-loop-plan.md`

按需更新：

- `docs/testing-strategy.md`
- `docs/docs-index.md`

文档需要写清：

1. Phase 10 是否完成真实 CI 观察
2. 哪些 workflow 已观察到通过
3. 哪些 workflow 未触发或无法观察
4. 若只跑了本地等价检查，明确写成“本地等价检查”
5. 如果四条 guardrail 均稳定，可把 harness engineering 状态标记为“维护与增强阶段”

---

## 3. 验收标准

本阶段完成需要满足：

1. 四条 workflow 的状态被真实观察或被明确标记为未观察到
2. flows workflow / `E2E Smoke Guard` 的稳定性被优先确认
3. 任何失败都有明确归因：代码问题、workflow 配置问题、环境问题或未触发
4. 文档同步当前结论
5. 没有新增重型 CI、全量 E2E 或不必要架构改动

---

## 4. 最终输出格式

请最终按下面结构输出：

### 1. 结论

- Phase 10 是否完成
- 是真实 CI 观察，还是本地等价检查

### 2. Workflow 状态

按 workflow 列出：

- Content Governance
- SEO/GEO Governance
- Admin GEO Governance
- Flows Governance / E2E Smoke Guard

每条写清：

- 已通过 / 失败 / 未触发 / 未观察到
- 证据来源
- 关键日志或命令摘要

### 3. 本次改动

- 按文件列出改动
- 如果没有代码改动，也明确说明

### 4. 验证结果

- 跑了哪些命令
- 哪些通过
- 哪些失败或 blocked

### 5. 风险与遗留

- 是否还有 flaky / 环境 / path filter 风险
- 是否需要等待下一次 push / PR 再观察

### 6. 下一步建议

- 推荐下一阶段 1~3 件事

---

## 5. 一句话任务总结

这次任务的本质是：**在 Phase 1~9 的 harness 主线完成后，观察四条 CI guardrail 的真实稳定性；如果无法观察真实 CI，就做诚实的本地等价检查并把项目状态推进到维护与增强阶段的门口。**
