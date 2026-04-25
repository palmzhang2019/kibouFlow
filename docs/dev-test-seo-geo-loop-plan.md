# kibouFlow Harness Engineering Plan

## 1. 文档定位

这不是一份普通的“开发测试流程”文档，而是一份面向 **Harness Engineering** 的落地计划。

在本仓库中，Harness Engineering 的目标不是只让 AI “会写代码”，而是让 agent 在这个仓库里：

1. 能快速建立正确上下文
2. 知道哪些边界不能碰
3. 有稳定的工具入口可以执行任务
4. 改动后能被自动验证
5. 失败后能得到可回馈的信号
6. 经验可以反哺成文档、规则、脚本和模板

这份文档既包含 **目标状态**，也包含 **当前进度**，后续可以持续在此文档上增量推进。

---

## 2. 项目目标与 Harness 目标

## 2.1 项目目标

`kibouFlow` 是一个面向“在日本发展”主题的双语内容与转化站点，当前核心由以下几部分组成：

- 中日双语内容站
- `trial` / `partner` 转化链路
- SEO/GEO 结构化输出
- GEO 体检后台与治理链路

## 2.2 Harness 目标

本仓库的 Harness Engineering 最终要支持两种主要工作模式：

### A. 代码型任务

例如：

- 改页面或组件
- 改 API 或会话逻辑
- 改 SEO / GEO 输出逻辑
- 改 admin GEO audit 功能

要求：

- agent 能读懂结构
- 改动边界明确
- 验证命令明确
- 回归风险可控

### B. 内容型任务

例如：

- 新增文章
- 修改 MDX
- 修内链
- 修 frontmatter
- 提升 GEO 可抽取性 / 可引用性

要求：

- agent 能理解内容模型
- 知道文章模板要求
- 能跑内容规则检查
- 能把问题落成 warning / checklist / SOP / 脚本

---

## 3. Harness 的六层结构

本仓库的 Harness 按以下六层组织：

1. `Context Harness`
2. `Constraint Harness`
3. `Tool Harness`
4. `Verification Harness`
5. `Feedback Harness`
6. `Memory / Governance Harness`

下面每一层都分为：

- 目标状态
- 当前进度
- 还缺什么

---

## 4. Context Harness

## 4.1 目标状态

让 agent 在开始任务前，就能快速回答这些问题：

- 这个仓库是做什么的
- 站点的路由和信息架构是什么
- 内容模型是什么
- SEO/GEO 关键入口是什么
- admin GEO audit 相关代码在哪里
- 改完后该跑哪些验证

## 4.2 当前进度

这一层已经有明显进展。

### 已完成

- [AGENTS.md](/e:/workspace/kibouFlow/AGENTS.md:1) 已从一句提醒扩成第一版 agent workstation
- 已补充：
  - project overview
  - success criteria
  - repository map
  - domain model
  - protected areas / forbidden moves
  - coding and editing rules
  - task playbooks
  - verification matrix
  - GEO audit / manual validation
  - environment expectations
- 已新增两个专章：
  - `Content Editing Chapter`
  - `Admin GEO Chapter`

### 当前作用

这意味着新 agent 进入仓库后，不需要再从零摸索：

- 内容目录
- SEO/GEO 风险点
- admin GEO 路径
- 基础验证方法

都已经有统一入口。

## 4.3 还缺什么

- 内容编辑章节还没有细化到“不同内容类型的模板差异”
  - 例如 `faq / framework / concept / cluster / case`
- admin GEO 章节还没有沉淀“常见故障排查路径”
- 还缺一个更明确的“任务接手模板”
  - 例如：收到任务后先看哪些文件、先跑哪些命令

---

## 5. Constraint Harness

## 5.1 目标状态

让 agent 不只是“能改”，还要知道“不能乱改什么”。

重点包括：

- 禁区
- 高风险区域
- 变更边界
- 依赖升级边界
- 数据库迁移边界
- 内容 taxonomy 边界

## 5.2 当前进度

这一层已经初步形成。

### 已完成

`AGENTS.md` 中已经写入：

- 不要动 `.env*`
- 不要动 `node_modules/`、`.next/`、生成产物
- 不要随意改 locale 路由结构
- 不要随意升级依赖或改 `package-lock.json`
- 不要随意改迁移顺序
- 不要破坏 `category / contentType / cluster`
- 不要用 LLM-only 校验替代 deterministic checks

还明确标出了高风险区域：

- `src/lib/content.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/llms.txt/route.ts`
- `src/app/[locale]/guides/[category]/[slug]/page.tsx`
- `src/app/api/admin/geo-audit/*`
- `src/lib/admin-session.ts`
- `src/lib/geo-*`

## 5.3 还缺什么

- 已经有 content warning baseline，但还没有把“哪些 warning 可以推断、哪些 frontmatter 必须显式填写”写成更细的实例规则
- 还没有把内容层的“允许推断值”和“必须显式写 frontmatter 的值”彻底区分开
- 还没有形成“什么时候可以新增 migration，什么时候只能改现有逻辑”的实例规则

---

## 6. Tool Harness

## 6.1 目标状态

让 agent 不需要拼命令，不需要凭记忆找脚本，而是直接调用项目内定义好的入口。

理想状态下，agent 应该能按任务类型直接使用：

- 日常回归
- 内容验证
- SEO/GEO 验证
- admin GEO 验证
- 发布前验证
- Python GEO 审计
- Selenium admin 流程

## 6.2 当前进度

这一层已经完成第一版落地。

### 已新增脚本

- [scripts/content-harness-check.mjs](/e:/workspace/kibouFlow/scripts/content-harness-check.mjs:1)
- [scripts/run-python-script.mjs](/e:/workspace/kibouFlow/scripts/run-python-script.mjs:1)
- [scripts/run-harness-verify.mjs](/e:/workspace/kibouFlow/scripts/run-harness-verify.mjs:1)

### 已新增命令入口

在 [package.json](/e:/workspace/kibouFlow/package.json:1) 中已提供：

- `verify:local`
- `verify:content`
- `verify:seo-geo`
- `verify:admin-geo`
- `verify:flows`
- `verify:publish`
- `audit:geo:repo`
- `audit:geo:repo:json`
- `audit:seo-geo:local`
- `audit:admin:selenium`
- `audit:content:baseline`
- `audit:content:baseline:history`
- `audit:content:baseline:trend`
- `audit:content:show`
- `audit:content:diff`
- `audit:content:diff:strict`

### 当前作用

agent 现在已经可以按任务类型直接选命令，而不需要临时拼：

- `vitest`
- `build`
- `playwright`
- `python`

## 6.3 还缺什么

- ~~还没有把”不同任务类型对应哪些命令”写成单独的操作表~~ ✅ 已在 Section 7.3 提供
- ~~还没有 CI 层自动执行这些入口~~ ✅ 已在 content / SEO-GEO / Admin GEO / flows 四条 workflow 落地
- ~~`verify:publish` 目前仍偏”验证汇总”，还没包含基线保存和 diff（但 `audit:content:baseline` / `audit:content:diff` 已单独落地）~~ ✅ 已补 `audit:content:diff:strict`

---

## 7. Verification Harness

## 7.1 目标状态

让 agent 改完后能立刻知道：

- 该跑哪类验证
- 最小验证集是什么
- 哪些验证已经可用且可信

## 7.2 当前进度

这一层已经真正跑通，不是只停留在命令命名。

### 已验证通过的入口

以下命令已经实际执行成功：

- `npm run verify:content`
- `npm run verify:seo-geo`
- `npm run verify:admin-geo`
- `npm run verify:publish`
- `npm run verify:flows`
- `npm run verify:local`

### 已修复的验证问题

[tests/e2e/core-flows.spec.ts](/e:/workspace/kibouFlow/tests/e2e/core-flows.spec.ts:44) 中原来对首页的 `"GEO"` 文案断言已经过时，现已改为 `"kibouFlow"`。

这很关键，因为它说明：

- Harness 不只是加命令
- 还包括修复已经失效的验证，让验证重新可信

## 7.3 当前验证矩阵

### 日常代码回归

- `npm run verify:local`

### 内容修改

- `npm run verify:content`

### SEO/GEO 结构修改

- `npm run verify:seo-geo`

### admin GEO 修改

- `npm run verify:admin-geo`

### 用户关键链路

- `npm run verify:flows`

### 发文 / 发布前综合验证

- `npm run verify:publish`

## 7.4 还缺什么

- ~~还没有把”不同任务类型对应哪些命令”写成单独的操作表~~ ✅ 已在 Section 7.3 提供
- ~~还没有 CI 层自动执行这些入口~~ ✅ 已在 content / SEO-GEO / Admin GEO / flows 四条 workflow 落地
- ~~`verify:publish` 目前仍偏”验证汇总”，还没包含基线保存和 diff（`audit:content:baseline` / `audit:content:diff` 已单独可用）~~ ✅ 已补 `audit:content:diff:strict`

---

## 8. Feedback Harness

## 8.1 目标状态

让 agent 不只是“跑命令”，而是能从失败和 warning 中获得高质量反馈。

也就是说，反馈要满足：

- 结构清晰
- 能直接定位文件
- 能区分 blocking error 和 warning
- 能反向指导下一步修改

## 8.2 当前进度

这一层已经完成第一版落地，并开始真正驱动内容治理。

### 已完成

[scripts/content-harness-check.mjs](/e:/workspace/kibouFlow/scripts/content-harness-check.mjs:1) 已具备基本反馈能力：

- 扫描全部 MDX
- 检查 frontmatter
- 检查 `relatedSlugs`
- 检查正文内链数量
- 检查 next-step section
- 检查双语配对情况
- 区分 blocking errors 与 warnings
- 输出结构化 warning：
  - code
  - severity
  - category
  - file
  - locale
  - categoryDir
  - slug
  - message
- 支持 `--json`
- 支持 `--verbose`
- 已接入：
  - `audit:content:baseline`
  - `audit:content:show`
  - `audit:content:diff`

### 当前输出状态

当前 `verify:content` 的实际结果是：

- blocking errors: `0`
- warnings: `0`

相较于初始基线（69 条），当前已减少 `69` 条 warning，降幅 `100%`。

其中已经完成的高价值整改包括：

- `W010` / `missing next-step section heading`: `23 -> 0`
- `W009` / `insufficient internal links`: `26 -> 0`
- `W005` / `missing tldr frontmatter`: `5 -> 0`
- `W001/W002` / `non-canonical frontmatter`: `1/1 -> 0/0`
- `W006` / `missing suitableFor frontmatter`: `1 -> 0`
- `W007` / `missing notSuitableFor frontmatter`: `1 -> 0`

## 8.3 当前问题

这些问题已在 2026-04-24 ~ 2026-04-25 阶段解决：

- ✅ warning 已结构化（W001-W011 code + severity + category）
- ✅ warning 已分级（P1/P2/P3）
- ✅ warning 已聚类（template-level / article-level / translation-level）
- ✅ 区分”模板级问题”与”单篇问题”（W010=template-level, W009=article-level）
- ✅ content warning baseline / diff 机制已可用
- ✅ `ja` next-step 模板问题已通过“规则兼容优先”路径收口
  - `## 次のステップ` 作为主标准
  - `## 次の一歩` 作为兼容变体
- ✅ `what-we-dont-handle-yet.mdx` 的高杠杆 frontmatter 缺失已补齐
- ✅ Phase 1-C 已完成，`W009 / W005 / W001 / W002` 全部清零
- ✅ `verify:content` 当前已达到 `0 warnings`

## 8.4 下一步重点

Feedback Harness 已在 2026-04-24 ~ 2026-04-25 完成第一轮闭环并完成第一批内容消债：

- `content-harness-check.mjs` 支持 `--json` 和 `--verbose`
- 每条 warning 包含 code / severity / category / file / locale / categoryDir / slug / message
- `audit:content:baseline` 可生成机器可读 baseline
- `audit:content:diff` 可对比 warning 变化趋势
- `W010` 已从 23 条降到 0
- `W009 / W005 / W001 / W002` 已全部清零
- 总 warning 已从 69 条降到 0

后续方向（Phase 2 已完成）：
1. ~~把 `verify:content` 与 `audit:content:diff` 接入 CI / PR 流程~~ ✅ 已在 `.github/workflows/content-governance.yml` 落地
2. ~~为 `audit:content:diff` 增加可用于 CI 的 fail-on-regression 机制~~ ✅ 已增加 `--strict` 模式
3. ~~更新 docs，使 baseline=0 的事实与后续维护流程同步可查~~ ✅ Phase 2 文档同步已完成

---

## 9. Memory / Governance Harness

## 9.1 目标状态

让项目不再每次都“重新发现同样的问题”，而是：

- 问题被记住
- 规则被沉淀
- 文档被更新
- 模板被收紧
- 审计结果可对比

## 9.2 当前进度

这一层已经完成第一版治理闭环，并完成了 content governance 的自动化守卫。

### 已有基础

- [docs/new-post-sop.md](/e:/workspace/kibouFlow/docs/new-post-sop.md:1) 已定义发文前、发布当天、发布后 1～3 天、每周治理动作
- `AGENTS.md` 已明确：同类错误反复出现时，要回头加固 harness
- 已有 GEO 审计脚本和 admin GEO audit 历史机制
- 已有 `scripts/baselines/content-warning-baseline.json` 作为机器可读内容 warning 基线
- 已有 `audit:content:diff` 用于比较当前结果与 baseline
- `AGENTS.md` 已写明 zh / ja next-step heading 标准
- `what-we-dont-handle-yet` 的 frontmatter 缺失已作为实例完成整改
- 内容 warning baseline 当前为 `0 warnings`
- Phase 1-C 已完成，内容 warning debt 已清零

### 目前仍缺

- ~~内容问题整改台账的持续更新机制~~ ✅ Phase 2 文档同步已完成
- ~~对”baseline=0 后如何阻止回归”的显式自动化守卫~~ ✅ `--strict` 模式已落地
- ~~CI / PR 层的自动执行与提醒~~ ✅ content / SEO-GEO / Admin GEO / flows 四条 workflow 已落地
- ~~多次 baseline 的历史留存与趋势分析（尚未实现）~~ ✅ Phase 5 已完成 history / trend 落地
- ~~SEO/GEO 结构级自动化守卫（尚未接入 CI）~~ ✅ `verify:seo-geo` 已接入独立 CI workflow

## 9.3 下一步重点

已在 2026-04-24 ~ 2026-04-25 完成最小落地：

1. ✅ 产出了 `docs/content-warning-remediation-plan.md` 作为内容 warning 整改文档
2. ✅ 标记了已知债务、W010 template-level 问题
3. ✅ `audit:content:baseline` / `audit:content:diff` 提供了 diff 机制
4. ✅ Phase 1-A / 1-B 已完成，`W010` 归零，warning 总量从 69 降到 33
5. ✅ Phase 1-C 已完成，`W009 / W005 / W001 / W002` 清零，warning 总量从 33 降到 0

Phase 2（CI / 防回归收口）已完成：
- ✅ `.github/workflows/content-governance.yml` 落地
- ✅ `audit:content:diff --strict` 模式落地
- ✅ 文档同步完成

Phase 3（SEO/GEO CI 守卫）已完成：
- ✅ `.github/workflows/seo-geo-governance.yml` 落地
- ✅ `verify:seo-geo` 已接入 CI 自动触发

Phase 4（Admin GEO CI 守卫）已完成：
- ✅ `.github/workflows/admin-geo-governance.yml` 落地
- ✅ `verify:admin-geo` 已接入 CI 自动触发

Phase 5（Baseline 历史留存与趋势分析）已完成：
- ✅ `scripts/baselines/history/` 历史快照目录已建立
- ✅ `npm run audit:content:baseline:history` 可列出历史快照
- ✅ `npm run audit:content:baseline:trend` 可查看 warnings 趋势
- ✅ `generate`（即 `npm run audit:content:baseline`）已自动保存历史快照

Phase 6（Core Flows Playwright CI 守卫）已完成：
- ✅ `.github/workflows/flows-governance.yml` 已落地
- ✅ `verify:flows` 已接入 CI 自动触发
- ✅ Playwright 浏览器安装已集成（chromium）

Phase 7（CI path filter refinement）已完成：
- ✅ content-governance.yml：添加 workflow 文件自身和 package.json 到 path filter
- ✅ admin-geo-governance.yml：添加 workflow 文件自身和 package.json 到 path filter
- ✅ 四条 workflow push/pull_request path filter 已统一检查
- ✅ 职责边界文档已同步

Phase 8（Selective E2E Smoke Expansion）已完成：
- ✅ 新增 `verify:e2e:smoke` 命令，运行全部三个 E2E spec（core-flows + geo-phase3-health + geo-rules-preview）
- ✅ `flows-governance.yml` 更新为运行 `verify:e2e:smoke`
- ✅ `verify:flows` 命令保留（core-flows spec 单独运行）
- ✅ 文档同步完成

Phase 8-A（E2E Smoke Trigger Refinement）已完成：
- ✅ `flows-governance.yml` push/pull_request path filter 显式包含全部三个 E2E smoke spec
- ✅ job 名称从 `Core Flows Guard` 更新为 `E2E Smoke Guard`
- ✅ 文档同步完成

Phase 9（Admin GEO 手动测试清单自动化）已完成：
- ✅ Selenium 主流程补齐 TC-NAV-01（未登录访问受保护页重定向）
- ✅ Selenium 主流程补齐 TC-AUTH-02 加强版（退出后访问受保护页仍重定向到 login）
- ✅ `docs/geo-admin-hermes-manual-test.md` 用例矩阵增加 Selenium 覆盖列
- ✅ `docs/geo-admin-selenium-e2e-flow.md` 步骤顺序表更新
- ✅ 文档同步完成

Phase 10（CI 首次运行稳定性观察）已完成：
- ✅ 四条 workflow 本地等价检查均通过
- ✅ `verify:content`: 25 tests passed，0 warnings
- ✅ `verify:admin-geo`: 10 tests passed
- ✅ `verify:e2e:smoke`: 10 tests passed（8+1+1）
- ✅ `verify:seo-geo`: 16 tests passed + `next build` 成功
- ✅ 文档同步完成（真实 CI 观察因 `gh` CLI 不可用，标记为未观察到）

Phase 11（E2E 分层评估与维护策略）已完成：
- ✅ `docs/testing-strategy.md` 新增 E2E Test Tiering 分层（Tier 1~5）
- ✅ 明确 Tier 1（CI E2E smoke）包含三个 Playwright spec
- ✅ 明确 Tier 2（Focused flows check）入口为 `verify:flows`
- ✅ 明确 Tier 3（Local/manual browser automation）入口为 `audit:admin:selenium`
- ✅ 明确 Tier 4 为 environment-dependent manual checks
- ✅ 明确 Tier 5 为未来 full/nightly E2E（暂不实现）
- ✅ 新增 Playwright spec 判断流程已写入文档

职责边界：
- `.github/workflows/content-governance.yml` 负责内容 warning 防回归：`content/**` 与 content harness 脚本变化时运行 `verify:content` 和 `audit:content:diff:strict`。
- `.github/workflows/seo-geo-governance.yml` 负责 SEO/GEO 结构入口防回归：sitemap、robots、llms、JSON-LD/SEO 组件、site-url/content 解析相关库和对应测试变化时运行 `verify:seo-geo`。
- `.github/workflows/admin-geo-governance.yml` 负责 Admin GEO API 防回归：admin 登录 / session / geo-audit API 路由、admin-session/require-admin-api 库、geo-audit 库和相关单元/集成测试变化时运行 `verify:admin-geo`。
- `.github/workflows/flows-governance.yml` 负责核心用户 flows 防回归：core-flows spec、trial/partner 页面和 API、tracking 组件和库变化时运行 `verify:e2e:smoke`（包含 core-flows + geo-phase3-health + geo-rules-preview）。
- `baseline / diff / strict diff / history / trend` 负责 content warning 的可追溯性与趋势观察：与 CI 回归守卫配合使用。

Baseline History 命令入口：
- `npm run audit:content:baseline`（即 `generate`）：保存当前 baseline 并自动追加历史快照到 `scripts/baselines/history/`
- `npm run audit:content:show`：显示当前 baseline 内容
- `npm run audit:content:diff`：当前与 baseline 的差分
- `npm run audit:content:diff:strict`：CI 专用回归守卫（有回归时 exit 1）
- `npm run audit:content:baseline:history`：列出历史快照列表
- `npm run audit:content:baseline:trend`：查看 warnings 趋势摘要

SEO/GEO workflow 当前实际触发范围：
- workflow / 命令入口：`.github/workflows/seo-geo-governance.yml`、`package.json`
- 站点级 SEO/GEO 入口：`src/app/layout.tsx`、`src/app/sitemap.ts`、`src/app/robots.ts`
- LLM 检索入口：`src/app/llms.txt/**`、`src/app/llms-full.txt/**`
- 结构化数据与 URL 工具：`src/components/seo/**`、`src/lib/seo/**`
- 内容与 GEO 元数据依赖：`src/lib/content.ts`、`src/lib/geo-settings.ts`
- 对应测试：`tests/unit/seo-site-url.test.ts`、`tests/unit/sitemap.test.ts`、`tests/integration/llms.route.test.ts`、`tests/integration/robots.route.test.ts`

Admin GEO workflow 当前实际触发范围：
- workflow / 命令入口：`.github/workflows/admin-geo-governance.yml`、`package.json`
- Admin API 与会话入口：`src/app/api/admin/**`、`src/lib/admin-session.ts`、`src/lib/require-admin-api.ts`
- GEO audit 后端依赖：`src/lib/geo-audit-*.ts`、`src/lib/geo-principles-audit-runner.ts`、`src/lib/geo-rules.ts`
- 对应测试：`tests/unit/admin-session.test.ts`、`tests/integration/geo-admin-login.route.test.ts`、`tests/integration/geo-audit-admin.route.test.ts`

Flows workflow 当前实际触发范围：
- workflow / 命令入口：`.github/workflows/flows-governance.yml`、`package.json`、`playwright.config.ts`、`scripts/run-harness-verify.mjs`
- E2E smoke spec（全部三个）：`tests/e2e/core-flows.spec.ts`、`tests/e2e/geo-phase3-health.spec.ts`、`tests/e2e/geo-rules-preview.spec.ts`
- 核心页面：`src/app/[locale]/page.tsx`、`src/app/[locale]/trial/**`、`src/app/[locale]/partner/**`
- 核心 API：`src/app/api/trial/**`、`src/app/api/partner/**`、`src/app/api/track/**`
- 关键组件：`src/components/forms/**`、`src/components/tracking/**`
- Tracking 库：`src/lib/tracking-events.ts`

仍可继续：
- Phase 12：Harness 维护交接与增强 Backlog 收口（推荐下一步）
- TC-API-02 体检 API 自动化评估（按需，需 Python 环境）
- flows workflow 首次 CI push 后观察真实运行（按需）

---

## 10. 当前进度总览

| 层 | 当前状态 | 说明 |
|------|------|------|
| Context Harness | 已完成第一版 | `AGENTS.md` 已成为 agent 入口地图 |
| Constraint Harness | 已完成第一版 | 禁区、高风险区、边界规则已写入 |
| Tool Harness | 已完成第一版 | `verify:*` / `audit:*` 入口已落地，content baseline/diff/history/trend 已加入 |
| Verification Harness | 已跑通 | 核心验证入口已实际验证成功 |
| Feedback Harness | 已完成第一版并完成第一批消债 | 内容 warning 已结构化，并驱动了 Phase 1-A / 1-B / 1-C 整改，当前为 0 warning |
| Memory / Governance Harness | 已完成第一版 | baseline / diff / history / trend / 已知债务 / 规则反哺已经成型，content governance 已具备自动化防回归 |

---

## 11. 已完成工作清单

这部分用于记录“当前已经做了什么”，避免后续重复劳动。

### 已完成

1. 扩写 `AGENTS.md`
2. 新增内容编辑与 admin GEO 专章
3. 新增 content harness 检查器
4. 新增 Python 脚本调用器
5. 新增 harness verify 编排器
6. 新增 `verify:*` / `audit:*` 命令
7. 修复 Playwright 首页过时断言
8. 实际跑通关键验证入口
9. 新增 content warning baseline / diff 机制
10. 完成 Phase 1-A：`ja` next-step 模板问题清零
11. 完成 Phase 1-B：补齐 `what-we-dont-handle-yet` 的高杠杆 frontmatter 缺失
12. 将 next-step 规则反哺进 `AGENTS.md`
13. 完成 Phase 1-C：`W009 / W005 / W001 / W002` 全部清零
14. 将 content warning baseline 更新为 `0 warnings`
15. 完成 Phase 2：CI / 防回归收口
    - 新增 `.github/workflows/content-governance.yml`
    - `audit:content:diff --strict` 模式落地
    - `audit:content:diff:strict` 命令落地
    - 文档同步到 warning=0 现状
16. 完成 Phase 3：SEO/GEO CI 守卫
    - 新增 `.github/workflows/seo-geo-governance.yml`
    - `verify:seo-geo` 接入 CI 自动触发
    - 文档同步完成
17. 完成 Phase 4：Admin GEO CI 守卫
    - 新增 `.github/workflows/admin-geo-governance.yml`
    - `verify:admin-geo` 接入 CI 自动触发
    - 文档同步完成
18. 完成 Phase 5：Baseline 历史留存与趋势分析
    - 扩展 `scripts/content-warning-baseline.mjs` 增加 `history` 和 `trend` 子命令
    - 建立 `scripts/baselines/history/` 历史快照目录
    - `npm run audit:content:baseline` 生成时自动保存历史快照
    - 新增 `audit:content:baseline:history` 和 `audit:content:baseline:trend` 命令
    - 文档同步完成
19. 完成 Phase 6/Core Flows CI：Core Flows Playwright CI 守卫
    - 新增 `.github/workflows/flows-governance.yml`
    - `verify:flows` 接入 CI 自动触发
    - Playwright chromium 浏览器安装已集成
    - flows workflow path filter 已设定
    - 文档同步完成（四条 workflow 职责边界已清晰）
20. 完成 Phase 7/CI Path Filter Refinement：四条 workflow path filter 一致性收口
    - content-governance.yml 添加 workflow 文件自身和 package.json 到 push/pull_request path filter
    - admin-geo-governance.yml 添加 workflow 文件自身和 package.json 到 push/pull_request path filter
    - 四条 workflow path filter 触发边界已统一检查
    - 文档同步完成
21. 完成 Phase 8/Selective E2E Smoke Expansion：E2E smoke 命令与 CI 集成
    - 新增 `verify:e2e:smoke` 命令（运行全部三个 E2E spec）
    - `flows-governance.yml` 更新为运行 `verify:e2e:smoke`
    - `verify:flows` 命令保留（core-flows spec 单独运行）
    - 文档同步完成
22. 完成 Phase 8-A/E2E Smoke Trigger Refinement：flows workflow path filter 显式补齐
    - `flows-governance.yml` push/pull_request path filter 补齐 `tests/e2e/geo-phase3-health.spec.ts` 和 `tests/e2e/geo-rules-preview.spec.ts`
    - job 名称从 `Core Flows Guard` 更新为 `E2E Smoke Guard`
    - 文档同步完成
23. 完成 Phase 9/Admin GEO 手动测试清单自动化：Selenium 主流程补齐低依赖验证
    - `selenium_geo_admin_flow.py` 补齐 TC-NAV-01 和 TC-AUTH-02 加强版
    - `docs/geo-admin-hermes-manual-test.md` 用例矩阵增加 Selenium 覆盖列
    - `docs/geo-admin-selenium-e2e-flow.md` 步骤顺序表更新
24. 完成 Phase 10/CI 首次运行稳定性观察：四条 workflow 本地等价检查均通过
    - `verify:content`: 25 tests passed，0 warnings
    - `verify:admin-geo`: 10 tests passed
    - `verify:e2e:smoke`: 10 tests passed（core-flows 8 + geo-phase3-health 1 + geo-rules-preview 1）
    - `verify:seo-geo`: 16 tests passed + `next build` 成功
25. 完成 Phase 12/Harness 维护交接与增强 Backlog 收口
    - 文档状态更新：明确标记主线完成，进入维护与增强阶段
    - 后续事项整理为 Backlog，不再作为推荐建设型 Phase 追加
    - 保留真实 CI 未观察的事实
    - 生成交接摘要供后续 agent 快速接手

### 已知结果

- 所有 `verify:*` 命令已能执行
- `verify:content` 当前为 `0` 条 warning
- Phase 2（CI / 防回归）已完成
- Phase 3（SEO/GEO CI）已完成
- Phase 4（Admin GEO CI）已完成
- Phase 5（Baseline 历史留存）已完成
- Phase 6（Core Flows Playwright CI）已完成
- Phase 7（CI Path Filter Refinement）已完成
- Phase 12（维护交接与 Backlog 收口）已完成：Harness 主线已全部完成，进入维护与增强阶段
- 当前无默认下一步；按需执行事项已整理为 Backlog

---

## 12. 下一阶段执行建议

如果你想按这份文档继续慢慢执行，推荐按下面顺序推进。

## 阶段 1：内容 warning 结构化（已完成）

目标：

- 把 `verify:content` 的 69 条 warning 变成可治理资产

建议动作：

1. warning 分类
2. warning 分级
3. 区分模板问题与单篇问题
4. 形成一份整改清单文档

当前状态：

- ✅ 已完成

## 阶段 2：模板级规则沉淀（已完成第一轮）

目标：

- 把高频 warning 反哺成更强的 harness

优先考虑的高频项：

- missing next-step section
- internal links < 2
- missing `tldr`
- missing `suitableFor`
- missing `notSuitableFor`

建议动作：

1. 修改内容模板
2. 更新 `new-post-sop`
3. 强化 `content-harness-check.mjs`

当前状态：

- ✅ 已完成第一轮
- `W010` 已清零
- next-step heading 标准已沉淀到 `AGENTS.md`

## 阶段 3：基线与差异机制（已完成）

目标：

- 让 warning 不只是“看到一次”，而是能追踪前后变化

建议动作：

1. 引入 warning baseline
2. 记录“当前已知债务”
3. 增加 `audit:baseline` / `audit:diff` 类型入口

当前状态：

- ✅ 已完成

## 阶段 4：内容 warning 消债（已完成）

目标：

- 开始系统性减少非模板级 warning，而不是只做可视化和记录

优先考虑的项：

- `W009` internal links < 2
- `W005` missing `tldr`
- `W001/W002` non-canonical frontmatter

建议动作：

1. 先按 cluster 建立内链资源池
2. 先处理能一篇带动多篇的 cluster-entry / faq / framework 页面
3. 再处理剩余 frontmatter 问题

当前状态：

- ✅ 已完成第一轮
- content warning 已从 69 条降到 0

## 阶段 5：CI / 自动触发（✅ content + SEO/GEO + Admin GEO 均已完成）

目标：

- 把已经跑通的 Harness 接进提交或 PR 流程

已完成动作：

1. ✅ `.github/workflows/content-governance.yml` 已落地
2. ✅ 内容变更自动跑 `verify:content` + `audit:content:diff:strict`
3. ✅ `.github/workflows/seo-geo-governance.yml` 已落地
4. ✅ SEO/GEO 相关路径自动跑 `verify:seo-geo`
5. ✅ `.github/workflows/admin-geo-governance.yml` 已落地
6. ✅ Admin GEO 相关路径自动跑 `verify:admin-geo`
7. ✅ `audit:content:diff --strict` CI 可用回归失败信号

## 阶段 6：Baseline 历史留存与趋势分析（已完成）

目标：

- 让 content warning baseline 不再只是单一快照，而是具备可追溯历史和最小趋势视图

已完成动作：

1. ✅ `scripts/baselines/history/` 历史快照目录已落地
2. ✅ `npm run audit:content:baseline` 生成时自动追加历史快照
3. ✅ `npm run audit:content:baseline:history` 可列出历史快照
4. ✅ `npm run audit:content:baseline:trend` 可查看 warnings 趋势
5. ✅ baseline / diff / strict diff / history / trend 的职责边界已在文档中同步

## 阶段 7：Core Flows Playwright CI 守卫（已完成）

目标：

- 把核心用户 flows 的 Playwright 回归以最小可用方式接入 CI

已完成动作：

1. ✅ `.github/workflows/flows-governance.yml` 已落地
2. ✅ `verify:flows` 已接入 CI 自动触发
3. ✅ Playwright chromium 浏览器安装已集成
4. ✅ flows workflow path filter 已设定最小合理范围
5. ✅ 文档同步完成（四条 workflow 职责边界已清晰）

## 阶段 7：CI Path Filter Refinement（已完成）

目标：

- 让四条已存在的 guardrail 在触发边界上更一致、更可信

已完成动作：

1. ✅ content-governance.yml 添加 workflow 文件自身和 package.json 到 push/pull_request path filter
2. ✅ admin-geo-governance.yml 添加 workflow 文件自身和 package.json 到 push/pull_request path filter
3. ✅ 四条 workflow push/pull_request path filter 已统一检查
4. ✅ 文档同步完成

## 阶段 8：Selective E2E Smoke Expansion（已完成）

目标：

- 把已有 Playwright E2E 能力从只守 core flows 推进到选择性 smoke 覆盖，但保持轻量和稳定。

已完成动作：

1. ✅ 新增 `npm run verify:e2e:smoke`
2. ✅ `verify:e2e:smoke` 运行三个 spec：core-flows、geo-phase3-health、geo-rules-preview
3. ✅ `flows-governance.yml` 更新为运行 `verify:e2e:smoke`
4. ✅ `verify:flows` 保留为 core-flows 单独入口

## 阶段 8-A：E2E Smoke Trigger Refinement（已完成）

目标：

- 让 Phase 8 新增的 E2E smoke 命令与 workflow 触发边界对齐。

已完成动作：

1. ✅ `flows-governance.yml` push/pull_request path filter 显式包含全部三个 E2E smoke spec
2. ✅ job 名称从 `Core Flows Guard` 更新为 `E2E Smoke Guard`
3. ✅ 未扩大到全量 E2E 或 Admin API 全路径，保持四条 workflow 职责边界清晰

## 阶段 9：Admin GEO 手动测试清单自动化（已完成）

目标：

- 基于现有 `docs/geo-admin-hermes-manual-test.md` 与 `scripts/selenium_geo_admin_flow.py`，把低依赖、高价值的后台手动检查进一步沉淀成可执行自动化。

已完成动作：

1. ✅ 建立 Hermes 手动清单与现有 Selenium 主流程的覆盖映射
2. ✅ Selenium 主流程补齐 TC-NAV-01（未登录访问受保护页重定向）
3. ✅ Selenium 主流程补齐 TC-AUTH-02 加强版（退出后访问受保护页仍重定向到 login）
4. ✅ 保持 `audit:admin:selenium` 为本地/人工触发入口，未默认接入 CI
5. ✅ 同步更新 `docs/geo-admin-selenium-e2e-flow.md`、`docs/geo-admin-hermes-manual-test.md` 与本计划文档

## 阶段 10：CI 首次运行稳定性观察（已完成，本地等价检查）

目标：

- 在 harness 主线完成后，观察四条 GitHub Actions guardrail 的首次真实运行表现，确认 workflow 触发边界、依赖安装、命令入口和运行时长都符合预期。

已完成动作：

1. ✅ 因 `gh` CLI 不可用，真实 GitHub Actions 运行记录标记为未观察到
2. ✅ 使用本地等价检查复核四条 guardrail 命令
3. ✅ `npm run verify:content` 通过：25 tests passed，0 warnings
4. ✅ `npm run verify:admin-geo` 通过：10 tests passed
5. ✅ `npm run verify:e2e:smoke` 通过：10 tests passed
6. ✅ `npm run verify:seo-geo` 通过：16 tests passed + `next build` 成功
7. ✅ 未扩大 workflow 范围，未新增重型矩阵

遗留说明：

- 真实 GitHub Actions 首次运行仍需在下一次相关路径 push / PR 后观察。
- 当前本地等价信号足以将 harness 主线推进到“维护与增强阶段”，但不能替代真实 CI 通过记录。

## 阶段 11：E2E 分层评估与维护策略（已完成）

目标：

- 在现有 E2E smoke 已全量覆盖当前三个 Playwright spec 的前提下，明确未来新增 E2E 时如何分层，避免后续把 CI 做重或把不稳定用例误塞进 smoke。

已完成动作：

1. ✅ 盘点 `tests/e2e/**/*.spec.ts`、`scripts/selenium_geo_admin_flow.py` 与手动清单的当前覆盖边界
2. ✅ 明确 E2E tier：CI smoke、focused flows、local/manual browser automation、environment-dependent manual、future full/nightly
3. ✅ 更新 `docs/testing-strategy.md`，写清 `verify:flows`、`verify:e2e:smoke`、`audit:admin:selenium` 与手动清单的关系
4. ✅ 更新本计划文档，标记当前所有 Playwright E2E spec 均已纳入 smoke；未来新增 spec 需要先做分层判断
5. ✅ 未新增 workflow、未扩大 CI、未新增测试

## 阶段 12：Harness 维护交接与增强 Backlog 收口（本次已完成）

> **状态**：Harness 主线已完成，进入维护与增强阶段。
>
> 本阶段不是继续新增 harness 能力，而是把 Phase 1~11 的建设成果收成可维护交接状态。真实 CI 首次运行仍待下一次 push / PR 后观察（Phase 10 本地等价检查已通过，但 `gh` CLI 不可用，真实 GitHub Actions 运行记录未观察到）。

### 本次完成内容

1. ✅ 文档状态更新：明确标记 harness engineering 主线完成，进入维护与增强阶段
2. ✅ 后续事项整理为 Backlog，不再作为推荐建设型 Phase 继续追加
3. ✅ 保留真实 CI 未观察的事实，不改写为”已通过”
4. ✅ 检查 `docs/docs-index.md` 无旧描述遗留
5. ✅ 生成交接摘要供后续 agent 快速接手

### 维护 Backlog（按需执行，不默认推进）

| 事项 | 优先级 | 说明 |
|------|--------|------|
| 真实 GitHub Actions 首次 push 后观察 | 高 | 本地等价检查已通过；真实 CI 运行待下一次相关路径 push/PR 时观察 |
| TC-API-02 体检 API 自动化评估 | 低 | 需 Python 环境，按需执行 |
| 未来新增 E2E spec 的 tier review | 中 | 新增 Playwright spec 前必须先判断 Tier（已在 testing-strategy.md 明确） |
| 其他发现 | — | 临时产物清理建议：test-results/、__pycache__/、.pyc 等，仅记录不擅自删除 |

### 交接约束（不要默认做的事）

- **不要默认扩 CI**：四条 workflow 职责边界已清晰，不要默认新增 workflow 或扩大触发范围
- **不要默认新增 E2E**：所有 Playwright E2E spec 当前均为 Tier 1 CI smoke；未来新增必须先做 tier 判断
- **不要默认升级依赖**：不要因版本更新随意升级依赖或修改 package-lock.json
- **不要把真实 CI 未观察改写为已通过**

---

## 13. 交接摘要（供新窗口快速接手）

### 当前状态

Harness Engineering **主线已完成**，进入 **维护与增强阶段**。

### 四条 workflow

| Workflow | 触发路径 | CI 入口 |
|----------|----------|---------|
| `content-governance.yml` | content/**、scripts/content-harness-check.mjs、package.json | `verify:content` + `audit:content:diff:strict` |
| `seo-geo-governance.yml` | SEO/GEO 相关路径（见 Section 9 SEO/GEO workflow 触发范围） | `verify:seo-geo` |
| `admin-geo-governance.yml` | admin API / session 相关路径 | `verify:admin-geo` |
| `flows-governance.yml` | core-flows spec + E2E smoke spec + trial/partner 页面和 API | `verify:e2e:smoke` |

### 关键命令

```bash
# 本地回归（默认）
npm run verify:local

# 内容验证
npm run verify:content
npm run audit:content:diff:strict

# SEO/GEO 验证
npm run verify:seo-geo

# Admin GEO 验证
npm run verify:admin-geo

# E2E smoke（CI 用）
npm run verify:e2e:smoke

# E2E focused（本地开发用）
npm run verify:flows

# 发布前综合验证
npm run verify:publish

# Content baseline / history / trend
npm run audit:content:baseline
npm run audit:content:baseline:history
npm run audit:content:baseline:trend

# Selenium 后台自动化（本地）
npm run audit:admin:selenium
```

### E2E 分层（Tier 1~5）

| Tier | 名称 | 触发方式 | 入口命令 |
|------|------|----------|----------|
| Tier 1 | CI E2E smoke | CI 自动 | `verify:e2e:smoke` |
| Tier 2 | Focused flows check | 本地按需 | `verify:flows` |
| Tier 3 | Local/manual browser automation | 本地/人工 | `audit:admin:selenium` |
| Tier 4 | Environment-dependent manual checks | 人工 | `docs/geo-admin-hermes-manual-test.md` |
| Tier 5 | Future full/nightly E2E | 暂不实现 | — |

**当前所有 Playwright E2E spec 均为 Tier 1（CI smoke）**。未来新增 spec 必须先做 tier 判断。

### 维护 Backlog

1. **真实 CI 首次 push 后观察**（高优先级）：本地等价检查已通过；`gh` CLI 不可用，真实 GitHub Actions 运行记录待下一次相关路径 push/PR 时观察
2. **TC-API-02 体检 API 自动化评估**（低优先级）：需 Python 环境，按需执行
3. **未来新增 E2E spec 的 tier review**（中优先级）：新增前必须先判断 Tier

### 不要默认做的事

- **不要默认扩 CI**：四条 workflow 职责边界已清晰，不要新增 workflow 或扩大触发范围
- **不要默认新增 E2E**：新增 Playwright spec 前必须先做 tier 判断
- **不要默认升级依赖**：不要因版本更新随意升级依赖或修改 package-lock.json
- **不要把真实 CI 未观察改写为已通过**

### 临时产物清理建议（只记录，不擅自删除）

- `test-results/`：Playwright E2E 输出
- `__pycache__/` / `.pyc`：Python 缓存
- `.next/`：Next.js 构建产物

---

## 14. 当前状态与维护原则

### 当前状态

Harness Engineering **主线已完成**，进入 **维护与增强阶段**。Phase 1~11 全部完成，Phase 12 已完成。

### 当前最推荐的下一步

**没有默认下一步。** Harness 主线已完整，四条 CI guardrail 已落地，内容 warning 已清零，E2E 分层策略已明确。

除非任务明确要求，否则：
- 不要默认扩 CI（职责边界已清晰）
- 不要默认新增 E2E（所有 spec 均为 Tier 1 CI smoke）
- 不要默认升级依赖

### 按需执行事项（不主动推进）

| 事项 | 触发条件 |
|------|----------|
| 真实 CI 首次 push 后观察 | 下一次相关路径 push / PR 后，`gh run list` 可见时 |
| TC-API-02 体检 API 自动化评估 | 需 Python 环境 + 真实 DB，Admin GEO 例行维护时评估 |
| 未来新增 E2E spec tier review | 计划新增 Playwright spec 之前 |

---

## 15. 使用方式

后续你完全可以把这份文档当成长期执行底稿。

建议方式：

1. 每完成一层 Harness，就更新一次“当前进度总览”
2. 每进入下一阶段，就在“已完成工作清单”里打勾或追加
3. 每次新开窗口继续工作时，把这份文档当作上下文主文件之一

这样它就不再是一份“一次性计划”，而会逐渐变成这个项目的 **Harness 演进记录**。
