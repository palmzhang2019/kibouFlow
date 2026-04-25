# 测试策略框架

> 本文档整合自 `test-doc.md`，提供 kibouFlow 项目的测试分类与阶段性执行框架。

---

## 1. 测试分类维度

### 按测试层级（主分类）

| 层级 | 说明 |
| --- | --- |
| **单元测试** | 验证最小代码单元（函数、类方法、组件内部逻辑） |
| **集成测试** | 验证多个模块连接后的行为（API 调用、数据库交互、上传流程） |
| **E2E 测试** | 从用户视角走完整流程（Playwright） |

### 按执行方式

| 方式 | 说明 |
| --- | --- |
| **自动化** | 脚本/框架执行（Vitest、Playwright） |
| **手动** | 人工执行（见 `manual-exploratory-checklist.md`） |

### 按测试目的（覆盖视角，非独立层级）

- **功能测试**：某个功能是否能用
- **业务测试**：业务规则是否正确实现
- **场景测试**：真实使用路径是否通畅

### 按时机/目的（非独立层级）

- **回归测试**：从各层测试中挑选的"必须每阶段都跑"的核心测试集

---

## 2. 重要澄清

### Selenium 不是测试类型，而是工具

"Selenium 测试"更像一种**浏览器自动化实现手段**，常用于 E2E 或功能自动化。它与"单元测试""功能测试"不在同一层级。

### 回归测试是测试集合，不是独立类型

回归测试 = 在代码修改后为防止旧功能被破坏而反复执行的一组测试。它可能包含单元/集成/E2E/手动各类测试。

### 功能/业务/场景测试高度重叠

同一条测试可能同时是功能测试、业务测试、场景测试。不需要建设三套独立体系。

---

## 3. 推荐测试组合

适合 kibouFlow 项目的组合：

| 类型 | 用途 |
| --- | --- |
| **单元测试** | 兜底底层逻辑（工具函数、表单校验、数据转换） |
| **集成测试** | 验证模块连接（前端+API、内容加载、埋点） |
| **E2E 测试** | 验证关键用户流程（trial/partner 转化链） |
| **手动探索测试** | 补自动化盲区（UI 细节、文案、布局、跨浏览器） |
| **回归测试集** | 每阶段必跑的核心测试子集 |

---

## 4. 阶段性执行节奏

### 每次提交/频繁开发时

- 单元测试（快速反馈）
- 核心集成测试

### 每个阶段完成后

- 全量单元测试
- 全量集成测试
- 核心 E2E 测试
- 核心业务规则验证

### 准备上线/交付前

- 回归测试集
- 手动探索测试（见 `manual-exploratory-checklist.md`）
- 多浏览器兼容性检查

---

## 5. 九维度覆盖矩阵

建立测试清单时从以下维度覆盖：

| 维度 | 示例 |
| --- | --- |
| **功能点** | 登录、注册、表单提交、导航 |
| **业务规则** | 权限、状态流转、CTA 触发条件 |
| **用户角色** | 游客、中文用户、日文用户、管理员 |
| **关键流程** | Trial 申请链、Partner 合作链、内容浏览链 |
| **异常情况** | 网络失败、API 超时、表单验证错误 |
| **兼容性** | Chrome/Safari/Edge、手机/桌面/平板 |
| **内容质量** | TL;DR 存在、结论明确、内链 ≥ 2 |
| **SEO/GEO** | JSON-LD 有效、sitemap 可访问、llms.txt 存在 |
| **国际化** | zh/ja hreflang 正确、文本完整性 |

---

## 6. 与实际测试文件的对应

| 本框架中的位置 | 实际文件 |
| --- | --- |
| 单元测试 | `tests/unit/**/*.test.ts` |
| 集成测试 | `tests/integration/**/*.test.ts` |
| E2E 测试 | `tests/e2e/**/*.spec.ts` |
| 手动探索测试 | `docs/manual-exploratory-checklist.md` |

---

## 7. E2E 测试分层（Playwright + Selenium + Manual）

kibouFlow 的 E2E / 浏览器自动化分为五个层级，新增 E2E spec 时必须先判断应进入哪一层。

### 分层总览

| 分层 | 名称 | 触发方式 | 入口命令 | CI guardrail |
|------|------|----------|----------|---------------|
| **Tier 1** | CI E2E smoke | CI 自动 | `npm run verify:e2e:smoke` | ✅ 是 |
| **Tier 2** | Focused flows check | 本地按需 | `npm run verify:flows` | ❌ |
| **Tier 3** | Local/manual browser automation | 本地/人工 | `npm run audit:admin:selenium` | ❌ |
| **Tier 4** | Environment-dependent manual checks | 人工 | `docs/geo-admin-hermes-manual-test.md` | ❌ |
| **Tier 5** | Future full/nightly E2E | 暂不实现 | — | — |

### Tier 1：CI E2E smoke

**适合进入的条件**：低依赖、快速、稳定、不依赖真实 DB、不依赖完整 GEO 体检产物、可在 GitHub Actions Ubuntu + Chromium 中稳定运行。

**当前包含**：

- `tests/e2e/core-flows.spec.ts`（8 tests）
- `tests/e2e/geo-phase3-health.spec.ts`（1 test）
- `tests/e2e/geo-rules-preview.spec.ts`（1 test）

**入口**：`npm run verify:e2e:smoke`

**CI 守卫**：`flows-governance.yml` 在以下文件变更时自动触发：
- `tests/e2e/core-flows.spec.ts`
- `tests/e2e/geo-phase3-health.spec.ts`
- `tests/e2e/geo-rules-preview.spec.ts`
- `package.json`、`playwright.config.ts`、`scripts/run-harness-verify.mjs`
- `src/app/[locale]/page.tsx`、`src/app/[locale]/trial/**`、`src/app/[locale]/partner/**`
- `src/app/api/trial/**`、`src/app/api/partner/**`、`src/app/api/track/**`
- `src/components/forms/**`、`src/components/tracking/**`、`src/lib/tracking-events.ts`

### Tier 2：Focused flows check

**适合进入的条件**：只想验证核心用户 flows（trial / partner / guides）时，不需要跑全量 smoke。

**当前包含**：

- `tests/e2e/core-flows.spec.ts`（8 tests）

**入口**：`npm run verify:flows`

**说明**：不进入 CI guardrail，作为本地开发快速反馈用。

### Tier 3：Local/manual browser automation

**适合进入的条件**：需要站点启动、需要 admin password/session secret、需要本机 Chrome/Selenium、不适合默认 CI。

**当前包含**：

- `scripts/selenium_geo_admin_flow.py`（Selenium 主流程，覆盖 TC-NAV-01、TC-AUTH-01、TC-DASH-01、TC-RUN-01、TC-HIST-01/02、TC-ISS-01、TC-HUB-01、TC-AUTH-02）

**入口**：`npm run audit:admin:selenium`

**说明**：不是 CI guardrail，是本地/人工后台浏览器自动化。依赖浏览器环境、站点启动和 admin 环境变量。

### Tier 4：Environment-dependent manual checks

**适合进入的条件**：需要真实 DB、需要真实历史记录、需要真实 issue、需要决策提交、需要完整体检产物、需要 Python 脚本和迁移状态。

**当前包含**：

- `docs/geo-admin-hermes-manual-test.md` 中尚未自动化的 TC：
  - TC-ISS-02：问题详情与决策提交（需真实 issue + 007 migration）
  - TC-API-02：带 Cookie 调 run（需 Python 环境和服务端脚本执行）

**说明**：完全人工执行，不适合自动化。

### Tier 5：Future full/nightly E2E

**当前原则**：

- 不提前创建空的重型 CI
- 当 E2E spec 数量增长、运行时间增长或出现 flaky 风险后，再评估是否引入 nightly/full workflow
- 新增 Playwright spec 不默认进入 Tier 1，必须先判断 tier

### 新增 E2E spec 的判断流程

1. 是否低依赖、稳定、快速、可在 GitHub Actions Ubuntu + Chromium 中运行？
   - 是 → Tier 1（走 PR 讨论是否纳入 `verify:e2e:smoke`）
   - 否 → 继续判断
2. 是否核心 flows 且适合本地开发反馈？
   - 是 → Tier 2（`verify:flows`）
   - 否 → 继续判断
3. 是否需要浏览器、admin secrets、站点启动但不适合 CI？
   - 是 → Tier 3（`audit:admin:selenium`）
   - 否 → Tier 4 或 5

---

## 变更日志

| 日期 | 变更 | 备注 |
| --- | --- | --- |
| 2026-04-24 | 整合自 test-doc.md | 文档治理 |
| 2026-04-25 | 新增 Section 7 E2E Test Tiering（Tier 1~5）| Phase 11 完成 |
