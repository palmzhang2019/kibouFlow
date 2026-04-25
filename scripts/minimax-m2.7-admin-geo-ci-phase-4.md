# kibouFlow Harness Engineering 下一步执行任务（Phase 4：Admin GEO CI 自动化守卫，适配 MiniMax M2.7）

> 请你作为一个 **Admin GEO Guardrail 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness engineering。
> 当前项目已经完成：
> - Phase 1：content warning 结构化 / baseline / diff
> - Phase 1-A / 1-B / 1-C：内容 warning 清零，`verify:content` 当前为 **0 warnings**
> - Phase 2：content governance CI：`.github/workflows/content-governance.yml`
> - Phase 3：SEO/GEO governance CI：`.github/workflows/seo-geo-governance.yml`
>
> 这一阶段不处理内容文章，不扩展 SEO/GEO sitemap/robots/llms 守卫，而是把 **Admin GEO 的 deterministic checks** 接入最小 CI 守卫。
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小可用落地，不要把“以后可以接 verify:admin-geo”只留在文档里。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **CI / guardrail 收口任务**，你可以修改 workflow、少量文档，必要时少量调整脚本入口，但不要做无关重构。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/geo-backend-operation-guide.md`
  - `package.json`
  - `.github/workflows/content-governance.yml`
  - `.github/workflows/seo-geo-governance.yml`
  - `src/app/[locale]/admin/**`
  - `src/app/api/admin/**`
  - `src/lib/admin-session.ts`
  - `src/lib/require-admin-api.ts`
  - `src/lib/geo-audit-*`
  - `src/lib/geo-principles-audit-runner.ts`
  - `src/lib/geo-rules.ts`
  - `tests/unit/admin-session.test.ts`
  - `tests/integration/geo-admin-login.route.test.ts`
  - `tests/integration/geo-audit-admin.route.test.ts`

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要升级依赖，不要修改 `package-lock.json`。
- 不要改数据库 migrations，除非你发现当前测试必须依赖一个真实 schema 缺口；如果真遇到，请先报告，不要直接改。
- 不要接入 Playwright / Selenium 到本阶段 CI。
- 不要处理内容文章或 SEO/GEO sitemap/robots/llms 的新需求。
- 不要把 workflow 做成复杂矩阵；优先最小可用。
- 不要引入真实 secrets；测试必须继续使用现有 deterministic mock / env 方式。

### 0.3 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现某个 Admin GEO 风险点已经有现成自动化覆盖，请明确写出来，不要重复建设。
- 最终输出必须包含：
  - 修改文件清单
  - 新增或更新的 workflow / 命令
  - 哪些路径变化会触发 Admin GEO 守卫
  - 执行过的验证命令
  - 遗留问题

---

## 1. 当前已知现状（请先核实）

请先带着以下事实进入任务：

1. 仓库已经有：
   - `.github/workflows/content-governance.yml`
   - `.github/workflows/seo-geo-governance.yml`
   - `npm run verify:content`
   - `npm run verify:seo-geo`
2. `package.json` 已提供：
   - `npm run verify:admin-geo`
3. `verify:admin-geo` 当前实际覆盖：
   - `tests/integration/geo-audit-admin.route.test.ts`
   - `tests/integration/geo-admin-login.route.test.ts`
   - `tests/unit/admin-session.test.ts`
4. Admin GEO 相关代码主要分布在：
   - `src/app/[locale]/admin/**`
   - `src/app/api/admin/**`
   - `src/lib/admin-session.ts`
   - `src/lib/require-admin-api.ts`
   - `src/lib/geo-audit-*`
   - `src/lib/geo-principles-audit-runner.ts`
   - `src/lib/geo-rules.ts`
5. 当前还没有明确落地的 **Admin GEO 专用 workflow**。

如果你检查后发现以上任一点不成立，请以实际情况为准，并在最终输出中说明。

---

## 2. 本阶段目标

这次任务的目标不是继续扩展 content governance 或 SEO/GEO governance，而是让 Admin GEO 的关键登录 / 会话 / audit API 入口具备自动化回归守卫。

### 2.1 核心目标

1. 为 Admin GEO 相关改动新增最小可用 CI workflow
2. 让 `verify:admin-geo` 在相关路径变化时自动执行
3. 同步文档，明确 content / SEO-GEO / admin-geo 三条 governance workflow 的职责边界

### 2.2 期望结果

理想情况下：

- 仓库中新增一个独立的 Admin GEO workflow，例如：
  - `.github/workflows/admin-geo-governance.yml`
- 在相关路径变化时自动触发：
  - `npm run verify:admin-geo`
- 文档明确写清：
  - content workflow 管什么
  - SEO/GEO workflow 管什么
  - admin GEO workflow 管什么

### 2.3 非目标

本阶段不要求你：

- 接入 Playwright / Selenium 到 CI
- 跑真实 Python GEO repo audit
- 处理 admin 前端浏览器流程
- 新建 baseline 历史留存
- 修改 DB migration
- 增加复杂多 job / 多平台 matrix

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实现有 Admin GEO 验证边界

先检查：

- `package.json`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/geo-backend-operation-guide.md`
- `tests/unit/admin-session.test.ts`
- `tests/integration/geo-admin-login.route.test.ts`
- `tests/integration/geo-audit-admin.route.test.ts`
- `src/app/api/admin/**`
- `src/lib/admin-session.ts`
- `src/lib/require-admin-api.ts`

输出简短结论：

1. `verify:admin-geo` 当前已经守住了什么
2. Admin GEO 哪部分还没有 CI 自动化覆盖
3. 你准备新增独立 workflow，还是扩展现有 workflow

**建议默认选择：新增独立 workflow。**

原因：

- Admin 登录 / session / audit API 与 content warning、SEO/GEO build 是不同风险域
- path filter 更容易维护
- 后续如果要扩展 Admin GEO 的更多测试，可以在独立 workflow 中演进

如果你决定不拆分，必须说明理由。

### 任务 B：定义 Admin GEO workflow 的触发范围

请基于仓库现状，为 Admin GEO workflow 设定最小合理的 path filter。

优先考虑这些路径：

- `src/app/[locale]/admin/**`
- `src/app/api/admin/**`
- `src/components/admin/**`
- `src/lib/admin-session.ts`
- `src/lib/require-admin-api.ts`
- `src/lib/geo-audit-*`
- `src/lib/geo-principles-audit-runner.ts`
- `src/lib/geo-rules.ts`
- `tests/unit/admin-session.test.ts`
- `tests/integration/geo-admin-login.route.test.ts`
- `tests/integration/geo-audit-admin.route.test.ts`
- `.github/workflows/admin-geo-governance.yml`
- `package.json`

要求：

1. 不要过宽到几乎所有改动都触发
2. 也不要窄到明显漏掉 `verify:admin-geo` 相关改动
3. 如果你发现 `verify:admin-geo` 依赖其他明确文件，可以把它们纳入，但要说明理由

### 任务 C：落地最小可用 Admin GEO workflow

新增一个最小 workflow，建议：

- 文件名：`.github/workflows/admin-geo-governance.yml`
- 触发：
  - `pull_request` to `main`
  - `push` to `main`
  - 带 path filter
- 步骤：
  1. checkout
  2. setup node
  3. install dependencies
  4. `npm run verify:admin-geo`

要求：

1. 优先用 GitHub Actions 原生能力
2. 复用和 `content-governance.yml` / `seo-geo-governance.yml` 一致的风格
3. 不要过度优化缓存、并行、artifact
4. 让 workflow 文件易读、容易维护

### 任务 D：必要时补充命令或脚本入口

如果你判断 `verify:admin-geo` 已经足够清晰，就不要再新增命令。

只有在以下情况才考虑新增：

- 当前命令不适合 CI 使用
- 需要一个更明确的 CI 别名
- 现有测试集遗漏了显然属于 deterministic admin session/API 的最小测试

默认倾向：

- **不新增命令**
- 直接复用 `npm run verify:admin-geo`

### 任务 E：同步计划文档与职责边界

至少更新：

- `docs/dev-test-seo-geo-loop-plan.md`

建议同步：

- `docs/docs-index.md`

需要明确写清：

1. content governance workflow 已完成，负责 content warning 防回归
2. SEO/GEO governance workflow 已完成，负责 sitemap / robots / llms / site-url / build guardrail
3. Admin GEO governance workflow 已完成（如果你本次完成），负责 admin login / session / audit API deterministic checks
4. 下一步真正还没做的是什么

### 任务 F：本地验证

至少运行：

1. `npm run verify:admin-geo`

如果你新增或修改了 workflow 文件，虽然本地不能真实跑 GitHub Actions，也要至少检查：

2. workflow YAML 结构合理
3. 触发路径与命令引用没有明显拼写错误

如果你额外改了脚本或命令，也要补对应验证。

---

## 4. 推荐实施顺序

建议按这个顺序推进：

1. 先检查现有 Admin GEO 验证边界
2. 确定 path filter
3. 新增独立 Admin GEO workflow
4. 同步计划文档
5. 跑 `npm run verify:admin-geo`

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 CI 层

- 仓库中存在独立的 Admin GEO workflow 文件
- 相关路径变化会自动触发 `verify:admin-geo`

### 5.2 设计层

- workflow 与 content governance / SEO-GEO governance 的职责边界清晰
- path filter 合理，不明显过宽或过窄

### 5.3 文档层

- `docs/dev-test-seo-geo-loop-plan.md` 已同步
- 文档中清楚写出 content governance / SEO-GEO governance / Admin GEO governance 的分工

### 5.4 验证层

- `npm run verify:admin-geo` 通过

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `.github/workflows/content-governance.yml`
- `.github/workflows/seo-geo-governance.yml`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/docs-index.md`
- `docs/geo-backend-operation-guide.md`
- `src/app/[locale]/admin/**`
- `src/app/api/admin/**`
- `src/lib/admin-session.ts`
- `src/lib/require-admin-api.ts`
- `src/lib/geo-audit-*`
- `src/lib/geo-principles-audit-runner.ts`
- `src/lib/geo-rules.ts`
- `tests/unit/admin-session.test.ts`
- `tests/integration/geo-admin-login.route.test.ts`
- `tests/integration/geo-audit-admin.route.test.ts`

如果不存在，请创建：

- `.github/workflows/admin-geo-governance.yml`

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 4 的最小闭环

### 2. 已确认的现状缺口
- content governance / SEO-GEO governance 已覆盖什么
- Admin GEO 自动化还缺什么

### 3. 本次改动
- 按文件列出改动点

### 4. 新增或更新的 workflow / 命令
- 每个 workflow 的用途
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

**把 kibouFlow 的自动化守卫从 content governance 与 SEO/GEO governance 继续扩展到 Admin GEO governance，让 `verify:admin-geo` 也具备独立的 CI 回归防线。**
