# kibouFlow Harness Engineering 下一步执行任务（Phase 11：E2E 分层评估与维护策略，适配 MiniMax M2.7）

> 请你作为一个 **E2E Harness Tiering Steward**，在当前项目根目录继续推进 `kibouFlow` 的 harness engineering。
>
> 当前主线状态：
> - Phase 1 ~ Phase 10 已完成，不要重复做。
> - content / SEO-GEO / Admin GEO / flows 四条 CI guardrail 已落地。
> - Phase 10 是本地等价检查完成，不是真实 GitHub Actions 观察完成：`gh` CLI 不可用，真实 CI 记录未观察到。
> - 当前本地等价检查均通过：
>   - `npm run verify:content`
>   - `npm run verify:admin-geo`
>   - `npm run verify:e2e:smoke`
>   - `npm run verify:seo-geo`
> - 当前 Playwright E2E spec 只有三个，且均已纳入 `verify:e2e:smoke`：
>   - `tests/e2e/core-flows.spec.ts`
>   - `tests/e2e/geo-phase3-health.spec.ts`
>   - `tests/e2e/geo-rules-preview.spec.ts`
>
> 本阶段不是新增测试、不是扩 CI，而是明确 **E2E 分层与未来维护规则**，防止后续把 CI 做重或把环境依赖强的用例误纳入 smoke。

---

## 0. 执行边界

### 可以改

- `docs/testing-strategy.md`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/docs-index.md`
- 必要时更新 `docs/geo-admin-selenium-e2e-flow.md` 或 `docs/geo-admin-hermes-manual-test.md` 的引用说明

### 谨慎改

- `package.json`
- `scripts/run-harness-verify.mjs`
- `.github/workflows/*.yml`
- `tests/e2e/**`
- `scripts/selenium_geo_admin_flow.py`

默认不要改这些文件。只有发现“文档中描述的命令或覆盖范围与实际文件不一致”时，才做最小修正。

### 不要改

- 不要修改 `.env*`
- 不要修改 `node_modules/`、`.next/`、`test-results/`
- 不要升级依赖，不要改 `package-lock.json`
- 不要新增 DB migration
- 不要新增 E2E spec
- 不要新增 workflow
- 不要把全量 E2E / Selenium / Admin GEO 浏览器自动化接入 CI
- 不要把真实 CI 未观察写成 CI 已通过

---

## 1. 当前已知测试入口

请以实际文件为准核实这些入口：

- `npm run verify:flows`
  - 应只运行 `tests/e2e/core-flows.spec.ts`
- `npm run verify:e2e:smoke`
  - 应运行全部三个 Playwright spec
- `npm run audit:admin:selenium`
  - 应运行 `scripts/selenium_geo_admin_flow.py`
  - 当前是本地/人工触发，不默认接入 CI
- `npm run verify:admin-geo`
  - 应覆盖 admin session / login / geo-audit API 的单元与集成测试

当前 E2E/browser automation 的事实边界：

- Playwright smoke：三个 spec，全部已纳入 flows workflow
- Selenium Admin GEO 主流程：用于本地/人工后台浏览器自动化，依赖浏览器、站点启动和 admin 环境变量
- Hermes 手动清单：保留真实数据库、真实 issue、决策提交、完整体检等环境依赖强的验证项

---

## 2. 本阶段目标

最小目标：

1. 盘点当前所有 E2E / browser automation / manual browser checks
2. 建立明确分层：
   - CI smoke
   - local/manual browser automation
   - environment-dependent manual checks
   - future full/nightly E2E（只写规则，不急于实现）
3. 更新文档，让后续 agent 知道新增 E2E spec 时应该先进入哪一层
4. 明确当前仓库“所有 Playwright E2E spec 均已纳入 smoke”，未来新增 spec 不能默认自动进 CI

---

## 3. 推荐执行步骤

### A. 核实现状

优先读取：

- `package.json`
- `scripts/run-harness-verify.mjs`
- `docs/testing-strategy.md`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/docs-index.md`
- `.github/workflows/flows-governance.yml`
- `tests/e2e/*.spec.ts`
- `scripts/selenium_geo_admin_flow.py`
- `docs/geo-admin-selenium-e2e-flow.md`
- `docs/geo-admin-hermes-manual-test.md`

输出简短结论：

1. 当前 Playwright E2E spec 数量
2. 哪些 spec 在 `verify:e2e:smoke`
3. Selenium 脚本是否属于 CI smoke
4. 手动清单中哪些仍不适合自动化

### B. 设计分层规则

建议分层如下，按实际情况调整：

#### Tier 1：CI E2E smoke

适合：

- 低依赖
- 快速
- 稳定
- 不依赖真实 DB 历史数据
- 不依赖完整 GEO 体检产物
- 可在 GitHub Actions Ubuntu + Chromium 中稳定运行

当前应包含：

- `tests/e2e/core-flows.spec.ts`
- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`

入口：

- `npm run verify:e2e:smoke`

#### Tier 2：Focused flows check

适合：

- 只想验证核心用户 flows 时

当前应包含：

- `tests/e2e/core-flows.spec.ts`

入口：

- `npm run verify:flows`

#### Tier 3：Local/manual browser automation

适合：

- 需要站点启动
- 需要 admin password/session secret
- 需要本机 Chrome/Selenium
- 不适合默认 CI

当前应包含：

- `scripts/selenium_geo_admin_flow.py`

入口：

- `npm run audit:admin:selenium`

#### Tier 4：Environment-dependent manual checks

适合：

- 真实 DB
- 真实历史记录
- 真实 issue
- 决策提交
- 完整 GEO 体检运行
- Python 脚本和迁移状态依赖

当前应包含：

- `docs/geo-admin-hermes-manual-test.md` 中尚未自动化的 TC-ISS-02、TC-API-02 等

#### Tier 5：Future full/nightly E2E

目前不要实现，只写原则：

- 当 E2E spec 数量增长、运行时间增长或出现 flaky 风险后，再考虑 nightly/full workflow
- 不要提前创建空的重型 CI

### C. 文档同步

至少更新：

- `docs/testing-strategy.md`
- `docs/dev-test-seo-geo-loop-plan.md`

建议按需更新：

- `docs/docs-index.md`

文档需要写清：

1. 当前所有 Playwright E2E spec 均已进入 smoke
2. 未来新增 Playwright spec 时，不默认进入 `verify:e2e:smoke`
3. 新 spec 必须先判断 tier：
   - 是否低依赖、稳定、快速
   - 是否依赖 DB / Python / admin secrets / 历史数据
   - 是否更适合 manual / local / integration
4. `audit:admin:selenium` 是本地/人工浏览器自动化，不是默认 CI guardrail
5. 真实 CI 观察仍待下一次 push / PR 后确认

### D. 验证

因为本阶段以文档分层为主，至少做静态核对：

```bash
git diff -- docs/testing-strategy.md docs/dev-test-seo-geo-loop-plan.md docs/docs-index.md
```

如果你改动了命令或脚本，才运行相关验证命令。

不要为了本阶段重复跑所有 verify 命令，除非你改了代码或 workflow。

---

## 4. 验收标准

本阶段完成需要满足：

1. `docs/testing-strategy.md` 明确 E2E / browser automation 分层
2. `docs/dev-test-seo-geo-loop-plan.md` 标记 Phase 11 完成或记录当前分层结论
3. 当前三个 Playwright spec 的 smoke 身份被写清
4. Selenium Admin GEO 主流程的本地/人工定位被写清
5. 未新增重型 CI、未新增测试、未扩大 workflow

---

## 5. 最终输出格式

请最终按下面结构输出：

### 1. 结论

- Phase 11 是否完成
- 是否只做文档/策略更新

### 2. 当前分层

- CI E2E smoke
- Focused flows check
- Local/manual browser automation
- Environment-dependent manual checks
- Future full/nightly E2E

### 3. 本次改动

- 按文件列出改动

### 4. 验证结果

- 做了哪些静态核对或命令验证
- 是否没有必要跑完整 verify

### 5. 风险与遗留

- 真实 CI 是否仍未观察
- 哪些检查仍是手动/环境依赖

### 6. 下一步建议

- 推荐下一阶段 1~3 件事

---

## 6. 一句话任务总结

这次任务的本质是：**在当前所有 Playwright E2E 已进入 smoke 后，沉淀未来新增 E2E 的分层规则，让 harness 从建设阶段进入可维护阶段。**
