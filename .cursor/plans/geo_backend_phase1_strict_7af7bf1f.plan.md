---
name: geo_backend_phase1_strict
overview: 将 GEO Backend Phase 1 重构为统一模板的可执行实施方案，明确目标、范围、接口契约、数据模型、测试验收、风险回滚与里程碑，确保可直接进入开发执行。
todos:
  - id: align-template
    content: 按统一模板重构 Backend Phase 1 文档结构（目标/范围/依赖/接口/测试/风险/回滚）
    status: completed
  - id: define-contract
    content: 补齐数据模型约束与 API 契约（入参、返回、校验、未命中策略）
    status: completed
  - id: reading-chain
    content: 明确前台读取优先级、兜底与 JSON-LD 覆盖边界
    status: completed
  - id: test-acceptance
    content: 补充单元/集成/回归验收矩阵与 DoD
    status: completed
  - id: milestones
    content: 拆分里程碑与交付顺序，保证可独立上线与回滚
    status: completed
isProject: false
---

# GEO Backend Phase 1 严格模板实施方案

## 背景与目标
- 目标阶段：Backend Phase 1（配置中心与读取链路 MVP）。
- 业务目标：把 GEO 配置从“代码硬编码”升级为“后台可维护 + 前台可覆盖读取”。
- 工程目标：最小改动接入配置能力，保证未配置页面行为与当前线上一致。

## 范围定义
- **In Scope**
  - 新增站点级与页面级 GEO 配置数据模型。
  - 提供后台内部 API（站点配置读写、页面配置查询）。
  - 前台 metadata 与 JSON-LD 引入覆盖优先读取链路。
  - 提供后台管理页 MVP（表单编辑 + 保存 + JSON 预览）。
  - 单元测试覆盖“覆盖优先 + 回退”核心逻辑。
- **Out of Scope**
  - 高级权限模型（先复用现有后台鉴权）。
  - 批量导入导出、版本回滚 UI、灰度发布能力。
  - 全量内容策略改造（留给后续阶段）。

## 依赖与上下游
- 上游依赖：现有 `generateMetadata`、JSON-LD 组件链路已可运行。
- 下游收益：后续阶段可直接复用配置中心做 schema 与内容信号扩展。
- 与总分期对齐：遵循 [`e:/workspace/kibouFlow/docs/geo-implementation-phases.md`](e:/workspace/kibouFlow/docs/geo-implementation-phases.md) 的“可独立上线、可回滚、可验证”原则。

## 数据模型与约束
- 目标表 1：`geo_site_settings`
  - 核心字段：`site_name`、`default_title_template`、`default_description`、`default_locale`、`site_url`、`robots_policy`、`updated_by`、`updated_at`。
  - 约束建议：
    - 单租户场景建议固定单行（或 `id=1` 唯一）。
    - `site_url` 必须为合法绝对 URL（https 优先）。
- 目标表 2：`geo_page_settings`
  - 核心字段：`locale`、`path`、`meta_title`、`meta_description`、`canonical_url`、`og_title`、`og_description`、`og_image`、`noindex`、`jsonld_overrides`、`updated_by`、`updated_at`。
  - 约束建议：
    - 唯一键：`(locale, path)`。
    - `noindex` 默认为 `false`。
    - `jsonld_overrides` 保持对象型 JSON，写入前做 schema 校验。

## API 契约（内部）
- `GET /api/admin/geo/site-settings`
  - 返回站点配置对象；若无记录返回默认结构（非 404）。
- `PUT /api/admin/geo/site-settings`
  - 入参：站点配置字段。
  - 校验：`site_url`、`default_locale`、长度边界。
  - 返回：最新配置 + `updated_at`。
- `GET /api/admin/geo/page-settings?locale={locale}&path={path}`
  - 命中返回页面配置，未命中返回“空配置对象”（显式 `source: none`）。
- `PUT /api/admin/geo/page-settings`
  - 入参：`locale + path + 可覆盖字段`。
  - 行为：upsert。
  - 校验：`canonical_url` 合法、`path` 格式规范化（前导 `/`）。

## 读取链路设计（前台）
- 统一优先级：`page config > site default > existing code default`。
- 覆盖点：
  - metadata：title、description、canonical、robots/noindex、OG 字段。
  - JSON-LD：仅在 `jsonld_overrides` 提供字段时做浅/深合并（保留原始安全字段）。
- 兜底策略：
  - 任一配置缺失不应导致空标题或空 description。
  - 读取失败时退回现有 `generateMetadata` 输出。

## 管理页 MVP（严格最小集）
- 功能：
  - 站点配置表单：站点名、模板、默认描述、站点 URL。
  - 页面配置表单：`locale + path` 查询/编辑，支持 title/description/canonical/noindex。
  - JSON 预览：展示当前生效结果（只读）。
- 非目标：
  - 不做批量编辑。
  - 不做复杂可视化 Diff。

## 测试与验收
- 单元测试
  - 配置合并函数：覆盖优先级与空值回退。
  - URL 校验函数：非法 canonical/site_url 拒绝。
- 集成测试
  - API 入参校验（400）、未命中返回空配置（200）。
  - upsert 幂等性。
- 回归测试
  - 3 个页面（首页、guides 列表、文章详情）验证可读取后台配置。
  - 无配置页面行为与当前线上一致。

## 风险、控制与回滚
- 风险：错误配置导致 SEO 信号异常。
  - 控制：保存前强校验 + 服务端兜底。
- 风险：读取链路接入造成现有页面回归。
  - 控制：仅在 metadata/JSON-LD 层接入，不改页面业务渲染。
- 回滚策略：
  - 关闭读取开关（或绕过配置读取函数）即可快速回到旧逻辑。
  - 数据表保留，不影响回滚。

## 里程碑与交付节奏
- M1（建模与类型）：完成两张表、类型定义、迁移可执行。
- M2（API）：站点/页面配置读写接口完成并通过契约测试。
- M3（前台读取）：metadata + JSON-LD 覆盖优先链路接入。
- M4（后台 MVP）：可编辑、可保存、可预览；完成最小验收。

## 完成定义（DoD）
- 后台入口可编辑并持久化 GEO 配置。
- 首页、guides 列表、文章详情可读取并生效。
- 未配置页面行为不变。
- 单元与关键集成测试通过，覆盖“覆盖优先 + 回退”。

## 实施时优先关注文件（按职责）
- 计划源文件：[`e:/workspace/kibouFlow/docs/geo-backend-phase-1-plan.md`](e:/workspace/kibouFlow/docs/geo-backend-phase-1-plan.md)
- 总分期参考：[`e:/workspace/kibouFlow/docs/geo-implementation-phases.md`](e:/workspace/kibouFlow/docs/geo-implementation-phases.md)
- 风格参考：[`e:/workspace/kibouFlow/docs/geo-phase-2-plan.md`](e:/workspace/kibouFlow/docs/geo-phase-2-plan.md)、[`e:/workspace/kibouFlow/docs/geo-phase-3-plan.md`](e:/workspace/kibouFlow/docs/geo-phase-3-plan.md)
