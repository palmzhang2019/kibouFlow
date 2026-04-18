---
name: geo_backend_phase2_strict
overview: 将 GEO Backend Phase 2 重构为严格模板的可执行实施方案，聚焦规则引擎后台化、页面级 schema 开关、规则预览与变更追溯，并细化测试与验收路径。
todos:
  - id: p2-models
    content: 设计并落地 Phase 2 三张表与校验 schema（rules/toggles/logs）
    status: completed
  - id: p2-api
    content: 实现规则、开关、预览、回滚 API，并补齐日志写入
    status: completed
  - id: p2-runtime
    content: 抽取器与 JSON-LD 渲染层接入后台规则与页面开关
    status: completed
  - id: p2-admin-ui
    content: 扩展 GEO 管理页：规则编辑、预览、日志与回滚
    status: completed
  - id: p2-tests
    content: 补齐 unit/integration/e2e 验收并完成 DoD 校验
    status: completed
isProject: false
---

# GEO Backend Phase 2 严格模板实施方案

## 背景与目标
- 目标阶段：Backend Phase 2（规则引擎与结构化数据配置）。
- 业务目标：将 FAQ/HowTo/Article/Breadcrumb/WebSite 的规则从代码硬编码升级为后台可配置。
- 工程目标：在 Phase 1 配置中心基础上，新增规则配置、渲染开关、预览与追溯能力，且默认行为与现状一致。

## 范围定义
- **In Scope**
  - 新增规则配置模型（FAQ/HowTo 抽取参数 + 文章 abstract 开关）。
  - 新增页面级 JSON-LD 类型开关（Article/FAQPage/HowTo/Breadcrumb/WebSite）。
  - FAQ/HowTo 抽取器接入后台规则，支持按 locale 生效。
  - 渲染层接入页面级 schema toggle。
  - 管理页新增规则编辑、页面开关编辑、规则预览工具。
  - 新增变更日志与一键回滚（回滚到最近一个版本）。
  - 补充单元、集成、E2E 验收路径。
- **Out of Scope**
  - 多级审批与复杂权限流。
  - 规则 DSL 语言化（本阶段维持 JSON 配置）。
  - 全量历史版本树（本阶段先做最近版本回滚）。

## 与 Phase 1 对齐约束
- 复用 Phase 1 的后台入口与 API 风格，不引入第二套配置中心。
- 保持读取优先级一致：`page toggle/rules > phase1 page config > site default > existing code`。
- 未配置规则时行为必须与当前线上一致（零回归基线）。

## 数据模型与约束
- 新表：`geo_rules`
  - 字段：`id`、`locale`、`faq_exclude_heading_patterns`、`faq_min_items`、`howto_section_patterns`、`howto_min_steps`、`article_abstract_from_tldr`、`updated_by`、`updated_at`。
  - 约束：
    - 唯一键：`(locale)`（每语言一份生效规则）。
    - `faq_min_items >= 1`，`howto_min_steps >= 1`。
    - pattern 数组允许空，但写入时需做“空数组保护”与默认回退。
- 新表：`geo_page_schema_toggles`
  - 字段：`locale`、`path`、`enable_article`、`enable_faqpage`、`enable_howto`、`enable_breadcrumb`、`enable_website`、`updated_by`、`updated_at`。
  - 约束：
    - 唯一键：`(locale, path)`。
    - 所有开关默认 `true`。
    - 关键页保护：`/zh`、`/ja`、核心文章页可配置为“不可关闭”的服务端保护名单。
- 日志表：`geo_rule_change_logs`
  - 字段：`id`、`scope`(`rules|toggles`)、`locale`、`path`(nullable)、`before_json`、`after_json`、`changed_by`、`created_at`。
  - 用途：追溯与回滚依据。

## API 契约（内部）
- 规则配置
  - `GET /api/admin/geo/rules?locale={locale}`：返回 locale 生效规则；未命中返回默认规则（`source:none`）。
  - `PUT /api/admin/geo/rules`：保存规则；非法 pattern、阈值越界返回 400。
- 页面 schema 开关
  - `GET /api/admin/geo/schema-toggles?locale={locale}&path={path}`：返回页面开关；未命中返回全 true 默认结构。
  - `PUT /api/admin/geo/schema-toggles`：upsert 页面开关；关键页关闭受限返回 403。
- 预览与回滚
  - `POST /api/admin/geo/rules/preview`：输入 `locale + markdown + ruleOverrides`，返回 FAQ/HowTo 抽取结果与命中明细。
  - `POST /api/admin/geo/rules/rollback`：按日志 id 回滚最近版本并写入新日志。

## 渲染与抽取接入设计
- FAQ 抽取器
  - 读取 `faq_exclude_heading_patterns` 与 `faq_min_items`。
  - 默认参数与现有硬编码一致，保证不改配置时输出不变。
- HowTo 抽取器
  - 读取 `howto_section_patterns` 与 `howto_min_steps`。
  - 保持现有列表抽取规则，新增 section 触发可配置。
- 页面级 schema toggle
  - 在以下渲染节点统一判定：
    - [`e:/workspace/kibouFlow/src/app/[locale]/guides/[category]/[slug]/page.tsx`](e:/workspace/kibouFlow/src/app/[locale]/guides/[category]/[slug]/page.tsx)
    - [`e:/workspace/kibouFlow/src/app/[locale]/guides/page.tsx`](e:/workspace/kibouFlow/src/app/[locale]/guides/page.tsx)
    - [`e:/workspace/kibouFlow/src/app/[locale]/layout.tsx`](e:/workspace/kibouFlow/src/app/[locale]/layout.tsx)
  - 目标：可按页面关闭某类 JSON-LD，同时保证关键页不可误关。

## 管理页 MVP（Phase 2）
- 在 Phase 1 管理页基础上扩展：
  - 规则编辑区：FAQ/HowTo 参数 + locale 切换。
  - 页面开关区：输入 `locale+path`，编辑 5 类 schema 开关。
  - 预览区：粘贴 markdown，实时查看 FAQ/HowTo 抽取 JSON。
  - 日志区：查看最近变更，支持“一键回滚到上一版本”。

## 测试与验收（细化）
- 单元测试
  - 规则校验：非法 regex、空数组、阈值边界。
  - 抽取器：相同输入 + 默认规则 => 与当前结果一致。
  - toggle 判定：关键页保护、默认全 true、命中覆盖。
- 集成测试
  - API 入参校验（400）、关键页误关保护（403）、未命中默认结构（200 + source:none）。
  - 回滚接口：回滚后配置恢复并新增日志记录。
- E2E 测试
  - 用例 1：修改 FAQ 规则最小条目数后，目标文章 `FAQPage` 输出变化可观测。
  - 用例 2：关闭某页 `HowTo` 开关后，DOM 中对应 `application/ld+json` 类型消失。
  - 用例 3：执行回滚后，类型输出恢复。

## 风险、控制与回滚
- 风险：错误规则导致 FAQ/HowTo 全站消失。
  - 控制：预览先行 + 保存前 dry-run + 低于阈值提示阻断。
- 风险：开关误关导致 SEO 信号下滑。
  - 控制：关键页不可关闭 + 管理端二次确认。
- 回滚策略：
  - 一键回滚到最近一条日志版本；
  - 紧急情况下服务端启用“忽略远程规则”的降级开关回退到内置默认规则。

## 里程碑与交付节奏
- M1：建模与 schema（`geo_rules` / `geo_page_schema_toggles` / `geo_rule_change_logs`）。
- M2：规则与开关 API + 日志写入。
- M3：FAQ/HowTo 抽取器与 JSON-LD 渲染层接入。
- M4：管理页预览 + 回滚能力。
- M5：测试补齐（unit/integration/e2e）并完成验收。

## 完成定义（DoD）
- 抽取规则可后台编辑并生效，默认配置下输出与当前一致。
- FAQ/HowTo 与其他 JSON-LD 类型可按页面开关控制。
- 具备规则变更追溯与一键回滚能力。
- E2E 覆盖“规则调整后类型变化 + 回滚恢复”。

## 关键文件与落地点
- 计划源：[`e:/workspace/kibouFlow/docs/geo-backend-phase-2-plan.md`](e:/workspace/kibouFlow/docs/geo-backend-phase-2-plan.md)
- Phase 1 严格计划参考：[`e:/workspace/kibouFlow/.cursor/plans/geo_backend_phase1_strict_7af7bf1f.plan.md`](e:/workspace/kibouFlow/.cursor/plans/geo_backend_phase1_strict_7af7bf1f.plan.md)
- 抽取器：[`e:/workspace/kibouFlow/src/lib/faq-extractor.ts`](e:/workspace/kibouFlow/src/lib/faq-extractor.ts)、[`e:/workspace/kibouFlow/src/lib/howto-extractor.ts`](e:/workspace/kibouFlow/src/lib/howto-extractor.ts)
- 渲染接入：[`e:/workspace/kibouFlow/src/app/[locale]/guides/[category]/[slug]/page.tsx`](e:/workspace/kibouFlow/src/app/[locale]/guides/[category]/[slug]/page.tsx)
- 现有后台入口（扩展点）：[`e:/workspace/kibouFlow/src/app/[locale]/admin/geo/page.tsx`](e:/workspace/kibouFlow/src/app/[locale]/admin/geo/page.tsx)
