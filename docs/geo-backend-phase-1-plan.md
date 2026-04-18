# GEO 后台阶段 1 实施计划：配置中心与读取链路（MVP）

> 目标：先把 GEO 从“全靠代码改”升级到“有后台可配置、前台可读取”的最小可用形态。

---

## 1. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | Backend Phase 1 |
| 预估工时 | 4-6 人日 |
| 优先级 | P0 |
| 主要产出 | GEO 站点配置、页面配置、前台覆盖读取 |

一句话目标：建立可交接的 GEO 配置底座，让非开发也能调整关键配置。

---

## 2. 范围（本阶段做什么）

1. 新建 GEO 配置数据模型（站点级 + 页面级）。
2. 提供只读/写入 API（先内部使用）。
3. 前台 metadata 与 JSON-LD 引入“后台覆盖优先”逻辑。
4. 提供最小后台页面（可编辑、可保存、可预览 JSON）。

---

## 3. 数据模型建议

## `geo_site_settings`（站点级）
- `site_name`
- `default_title_template`
- `default_description`
- `default_locale`
- `site_url`
- `robots_policy`
- `updated_by`, `updated_at`

## `geo_page_settings`（页面级）
- `locale`（zh/ja）
- `path`（唯一键之一）
- `meta_title`
- `meta_description`
- `canonical_url`
- `og_title`, `og_description`, `og_image`
- `noindex`（boolean）
- `jsonld_overrides`（json，可选）
- `updated_by`, `updated_at`

---

## 4. 任务清单

| 编号 | 任务 | 验收 |
|---|---|---|
| B1-1 | 建表与类型定义 | 本地可迁移、可读写 |
| B1-2 | 后台 API：获取/保存站点配置 | 返回稳定 schema，含参数校验 |
| B1-3 | 后台 API：按 `locale+path` 获取页面配置 | 未命中时返回空配置 |
| B1-4 | 前台读取链路：`page config > default config > 现有代码` | 页面无配置时行为不变 |
| B1-5 | 管理页 MVP（表单 + 保存） | 可编辑标题、描述、canonical、noindex |

---

## 5. 风险与控制

- 风险：配置缺失导致 metadata 为空。
- 控制：回退到现有 `generateMetadata` 输出，不允许返回空标题。
- 风险：错误 canonical。
- 控制：保存时校验域名与协议，非法值拒绝写入。

---

## 6. 退出标准

- [ ] 已有后台入口能编辑 GEO 配置。
- [ ] 至少 3 个页面（首页、guides 列表、文章详情）可读到后台配置。
- [ ] 页面无配置时，行为与当前线上一致。
- [ ] 单元测试覆盖“覆盖优先 + 回退”逻辑。

