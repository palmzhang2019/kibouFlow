# GEO 治理后台 — Hermes 手动测试清单

本文档供 **Hermes**（或人工）按步骤执行 **探索性 / 回归手动测试**。执行前请确认环境与数据；每条用例注明 **前置条件**、**步骤**、**预期结果**。将实际结果记为 `PASS` / `FAIL` 并附备注（截图路径、响应码、文案片段）。

**被测应用**：kibouFlow Next.js 管理端（GEO 治理后台）  
**基础 URL**：`{BASE}` = 本地或部署根地址，例如 `http://localhost:3000`  
**语言前缀**：`{LOCALE}` = `zh` 或 `ja`（与站点路由一致）

---

## 0. 测试前准备（Hermes 勾选）

- [ ] 应用已启动：`npm run dev` 或等价生产启动方式。
- [ ] 已知 `ADMIN_GEO_PASSWORD` 与 `ADMIN_SESSION_SECRET` 已在服务端环境变量中配置（否则无法登录）。
- [ ] 记录是否配置 `DATABASE_URL`：**场景 A** 已配置且已执行 `supabase/migrations/` 至少到 `006`、`007`；**场景 B** 未配置或未跑迁移（用于降级行为验证）。
- [ ] 浏览器：建议使用 Chromium 系；可开无痕窗口避免旧 Cookie 干扰。
---

## 1. 路由速查（便于复制）

| 名称 | 路径 |
|------|------|
| 登录 | `{BASE}/{LOCALE}/admin/login` |
| 总览 | `{BASE}/{LOCALE}/admin/geo-audit` |
| 运行体检 | `{BASE}/{LOCALE}/admin/geo-audit/run` |
| 问题中心 | `{BASE}/{LOCALE}/admin/geo-audit/issues` |
| 历史 | `{BASE}/{LOCALE}/admin/geo-audit/history` |
| 决策说明 | `{BASE}/{LOCALE}/admin/geo-audit/decisions` |
| 验证占位 | `{BASE}/{LOCALE}/admin/geo-audit/validation` |
| 标准占位 | `{BASE}/{LOCALE}/admin/geo-audit/standards` |

---

## 2. 用例矩阵（建议执行顺序）

| ID | 标题 | 依赖场景 | Selenium 覆盖 |
|----|------|----------|---------------|
| TC-NAV-01 | 未登录访问受保护页重定向 | A 或 B | ✅ 已自动化 |
| TC-AUTH-01 | 登录成功进入总览 | A 或 B | ✅ 已自动化 |
| TC-DASH-01 | 总览台展示与入口 | A 与 B 分别测 | ✅ 已自动化（场景 B 降级提示也经过验证） |
| TC-RUN-01 | 运行体检与结果展示 | A 或 B | ✅ 已自动化（SKIP 路径快速验证） |
| TC-HIST-01 | 历史列表与未关问题列 | A（B 可能无列表） | ✅ 已自动化（无数据时跳过属预期） |
| TC-HIST-02 | 单次详情：分数 + 结构化问题 + Markdown | A | ✅ 已自动化（无数据时跳过属预期） |
| TC-ISS-01 | 问题中心列表与 runId | A | ✅ 已自动化（无 issue 时跳过属预期） |
| TC-ISS-02 | 问题详情与决策提交 | A + 已存在 issue | ❌ 手动（需真实 issue + 007 migration） |
| TC-HUB-01 | 决策 / 验证 / 标准占位页 | A 或 B | ✅ 已自动化 |
| TC-AUTH-02 | 退出登录 | A 或 B | ✅ 已自动化（含退出后重定向验证） |
| TC-API-01 | 未带 Cookie 调 API 返回 401 | A 或 B | ❌ 手动（建议通过集成测试 `verify:admin-geo` 覆盖） |
| TC-API-02 | 带 Cookie 调 run 返回 issues 数组 | A 或 B（B 不入库） | ❌ 手动（需 Python 环境和服务端脚本执行） |

---

## 3. 详细步骤

### TC-NAV-01 — 未登录访问受保护页

**前置**：浏览器无 `geo_admin_session` Cookie（无痕或清除站点 Cookie）。

**步骤**

1. 直接访问 `{BASE}/{LOCALE}/admin/geo-audit`。

**预期**

1. 重定向到 `{BASE}/{LOCALE}/admin/login`（或等价登录页），不出现 5xx。

**结果**：＿＿＿＿ 备注：＿＿＿＿

---

### TC-AUTH-01 — 登录成功进入总览

**前置**：`ADMIN_GEO_PASSWORD` 等已配置。

**步骤**

1. 打开 `{BASE}/{LOCALE}/admin/login`。
2. 输入正确密码，提交。

**预期**

1. 进入 `{BASE}/{LOCALE}/admin/geo-audit`（总览），不是直接进入「仅运行体检」子页。
2. 页头可见导航：**总览 / 运行体检 / 问题 / 历史 / 决策 / 验证 / 标准** 与 **退出登录**。

**结果**：＿＿＿＿ 备注：＿＿＿＿

---

### TC-DASH-01 — 总览台（分场景）

#### TC-DASH-01a — 场景 B：无 `DATABASE_URL`

**步骤**

1. 登录后停留在总览。

**预期**

1. 可见关于未配置数据库的说明（或等价提示），仍可点击「运行体检」等链接，无白屏与未捕获异常。

**结果**：＿＿＿＿

#### TC-DASH-01b — 场景 A：有库且至少有一次成功体检

**步骤**

1. 登录后打开总览。

**预期**

1. 展示最近一次成功体检的五维分数（或等价占位）。
2. 若有两次成功记录，可见与「上一次」的分数差表格。
3. 展示结构化问题严重度聚合或列表摘要；链接可跳到「运行体检」「最近一次详情」「问题」「历史」。

**结果**：＿＿＿＿

#### TC-DASH-01c — 场景 A：有库但尚无成功记录

**预期**

1. 提示尚无成功记录，并引导去「运行体检」。

**结果**：＿＿＿＿

---

### TC-RUN-01 — 运行 GEO 体检

**前置**：已登录。场景 A 建议已配置 Python，以便服务端能执行 `scripts/geo_principles_audit.py`。

**步骤**

1. 打开 `{BASE}/{LOCALE}/admin/geo-audit/run`。
2. 点击 **运行 GEO 体检**，等待结束。

**预期**

1. 状态从运行中变为成功或失败；失败时可见错误提示区域。
2. 成功时可见渲染报告区域；可选展开「原始 Markdown」。
3. 成功且场景 A：若入库成功，可见「查看本次记录」跳转；页面上可显示「结构化问题: N 条」（N 与脚本 `issues` 一致，可为 0）。
4. 场景 B：可见未入库提示（关于 `DATABASE_URL` / 迁移）。

**结果**：＿＿＿＿ 备注（run id）：＿＿＿＿

---

### TC-HIST-01 — 历史列表

**前置**：场景 A；库中已有至少一条 `geo_audit_runs` 记录。

**步骤**

1. 打开 `{BASE}/{LOCALE}/admin/geo-audit/history`。

**预期**

1. 表格含列：**未关问题**（数字）、时间、状态、分数、LLM、摘要等。
2. 点击时间链接进入详情页。

**结果**：＿＿＿＿

---

### TC-HIST-02 — 单次体检详情

**前置**：TC-HIST-01 已进入某条 `history/{id}`。

**步骤**

1. 确认存在 **分数摘要** 区块（总分与五维）。
2. 确认存在 **结构化问题** 表格或「本条记录无结构化问题数据」说明。
3. 向下滚动，确认 **报告（渲染）** 与 **原始 Markdown** 折叠区。

**预期**

1. 若该次已落库 `geo_audit_issues`，表格与问题中心一致；若为旧数据仅有 `report_json.issues`，可见「来自 report_json」类提示（若实现保留）。
2. 「在问题中心打开」类链接可跳到 `issues?runId={id}`（若页面上有）。

**结果**：＿＿＿＿

---

### TC-ISS-01 — 问题中心

**前置**：场景 A；最近一次成功体检已写入 issues。

**步骤**

1. 打开 `{BASE}/{LOCALE}/admin/geo-audit/issues`。
2. 将地址改为 `{BASE}/{LOCALE}/admin/geo-audit/issues?runId={某次 uuid}`（替换为真实 run id）。

**预期**

1. 默认列表展示该次（或最近一次）的问题行：**严重度 / 层级 / 代码 / 标题**。
2. `runId` 非法或不存在时应 404 或友好错误（按实现：当前为 `notFound` 行为）。

**结果**：＿＿＿＿

---

### TC-ISS-02 — 问题详情与决策

**前置**：场景 A；`007` 迁移已执行；从问题列表点入某条 `issues/{issueId}`。

**步骤**

1. 核对详情字段：代码、严重度、层级、标题、证据 JSON、关联 run 链接。
2. 在 **记录决策** 中选一项枚举，点击 **提交决策**。
3. 刷新或等待页面刷新后查看 **决策历史**。

**预期**

1. 提交成功后有成功提示或列表出现新行（时间 + choice）。
2. 若未执行 `007` 或表不存在：提交失败应有可理解提示（如 persist failed / 503）；Hermes 记为环境缺陷或单独缺陷。

**结果**：＿＿＿＿

---

### TC-HUB-01 — 决策 / 验证 / 标准占位

**步骤**

1. 依次打开 `decisions`、`validation`、`standards` 路径（见 §1 表）。

**预期**

1. 三页均有标题与说明文案，无 5xx；`决策` 页有指向问题中心的引导。

**结果**：＿＿＿＿

---

### TC-AUTH-02 — 退出登录

**步骤**

1. 在任意已登录后台页点击 **退出登录**。

**预期**

1. 跳转到登录页；再访问总览应被重定向到登录（同 TC-NAV-01）。

**结果**：＿＿＿＿

---

### TC-API-01 — 未授权 API

**步骤**

1. 使用 curl / Postman **不带** Cookie 请求：  
   `GET {BASE}/api/admin/geo-audit/history`

**预期**

1. HTTP **401**。

**结果**：＿＿＿＿

---

### TC-API-02 — 体检 API（run）

**前置**：已登录拿到 `geo_admin_session`；服务端可执行 Python 体检脚本（与页面「运行体检」相同依赖）。

**步骤**

1. `POST {BASE}/api/admin/geo-audit/run`，带 Cookie。
2. 解析 JSON：`issues` 字段为数组（可为空数组）。

**预期**

1. HTTP 200，`ok: true`，`issues` 为数组。

**结果**：＿＿＿＿

---

## 4. 回归检查（与数据库相关）

在 **场景 A** 且刚跑完一次成功体检后，Hermes 可选执行：

- [ ] 数据库表 `geo_audit_runs` 新增一行，`status=success`，`report_json` 含 `issues`。
- [ ] 表 `geo_audit_issues` 中 `run_id` 与外键一致，行数与 API 返回的 `issues.length` 一致（脚本未产出问题时可为 0）。

若未执行 `006`：应用不应持续刷 ERROR 日志；历史列表仍应能打开（未关问题数可能为 0）。**根治**：在目标库执行 `006`（及 `007`）。

---

## 5. 缺陷记录模板（Hermes 粘贴）

```text
【ID】TC-xxx
【环境】BASE / LOCALE / 场景 A 或 B
【步骤】…
【预期】…
【实际】…
【严重度】P0-P3
【附件】截图或 HAR
```

---

## 6. 文档与代码对照

- 自动化单测：`npm run test:unit`、`npm run test:integration`、`npm test`。
- 仓库内旧说明 [`geo-backend-operation-guide.md`](geo-backend-operation-guide.md) 若与本文冲突，**以本文与当前路由为准**。

---

**版本说明**：本文档与「总览 + issues 落库 + 决策表」实现对齐；验证/标准为占位，后续迭代需增补用例。
