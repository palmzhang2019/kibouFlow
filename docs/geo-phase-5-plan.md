# GEO 第五阶段实施计划：E-E-A-T 与作者实体化

> 前提：后台已支持页面级配置与 schema 开关；Phase 4 的内容信号已标准化。

---

## 1. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | GEO Phase 5 |
| 预估工时 | 4-7 人日 |
| 优先级 | P0 |
| 目标 | 从组织级信誉升级到作者级信誉与可验证实体 |

一句话目标：让页面不仅“有内容”，还“有可信作者与来源”。

---

## 2. 核心任务

| 编号 | 任务 | 说明 |
|---|---|---|
| G5-1 | 作者模型落地 | 新建作者数据源（slug、名称、简介、链接） |
| G5-2 | 文章关联作者 | frontmatter 或后台配置绑定 author slug |
| G5-3 | `Person` schema | `Article.author` 从 Organization 升级为 Person |
| G5-4 | 作者页（可选） | `/[locale]/authors/[slug]` 展示简介与文章列表 |
| G5-5 | 审核流程 | 后台增加“作者真实性核验”状态 |

---

## 3. 数据建议

## `authors`
- `slug`
- `display_name`
- `bio`
- `avatar_url`
- `expertise`
- `profile_links`（array）
- `is_verified`

## `article_author_bindings`
- `locale`
- `article_slug`
- `author_slug`

---

## 4. 风险与控制

- 风险：作者信息不完整，反而降低信任。
- 控制：未验证作者不下发 `Person`，回退 Organization。
- 风险：双语作者信息不一致。
- 控制：后台同一作者提供多语言字段，统一来源。

---

## 5. 验收标准

- [ ] 核心文章 `Article.author` 可输出 `Person`。
- [ ] 作者信息可追溯（后台有维护人和更新时间）。
- [ ] 未绑定作者的文章仍可正常回退。
- [ ] 单元/E2E 通过（含 Person 与回退场景）。

