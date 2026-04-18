# GEO 后台阶段 2 实施计划：规则引擎与结构化数据配置

> 目标：把 FAQ/HowTo/Article/Breadcrumb/WebSite 这类 GEO 规则，从“写死代码”升级为“后台可控参数”。

---

## 1. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | Backend Phase 2 |
| 预估工时 | 5-8 人日 |
| 优先级 | P0 |
| 主要产出 | 抽取规则后台化、JSON-LD 开关与参数化 |

一句话目标：让运营或内容负责人可调规则，而不是每次找开发发版。

---

## 2. 范围

1. FAQ 抽取规则可配置（排除标题、最少条目数）。
2. HowTo 抽取规则可配置（触发标题、最少 step 数）。
3. 页面级 JSON-LD 类型开关（Article/FAQPage/HowTo/Breadcrumb/WebSite）。
4. 添加“规则预览”能力（输入正文，输出抽取结果）。

---

## 3. 建议配置结构

## `geo_rules`（按 locale 可区分）
- `faq_exclude_heading_patterns`（string[]）
- `faq_min_items`（number）
- `howto_section_patterns`（string[]）
- `howto_min_steps`（number）
- `article_abstract_from_tldr`（boolean）
- `updated_by`, `updated_at`

## `geo_page_schema_toggles`
- `locale`
- `path`
- `enable_article`
- `enable_faqpage`
- `enable_howto`
- `enable_breadcrumb`
- `enable_website`

---

## 4. 任务清单

| 编号 | 任务 | 验收 |
|---|---|---|
| B2-1 | 规则配置表与校验 schema | 非法正则/空数组有保护 |
| B2-2 | FAQ/HowTo 抽取器接入后台规则 | 不改配置时结果与当前一致 |
| B2-3 | 页面级 schema toggle 接入渲染层 | 可按页面关闭某类 JSON-LD |
| B2-4 | 规则预览工具页 | 可输入 markdown，实时展示提取结果 |
| B2-5 | 变更日志（谁改、何时改、改了什么） | 支持追溯 |

---

## 5. 风险与控制

- 风险：错误规则导致全站 FAQ/HowTo 消失。
- 控制：提供“发布前预览 + 回滚到上一个版本”按钮。
- 风险：toggle 误关影响 SEO 信号。
- 控制：关键页（首页、核心文章）可设置为“不可关闭”。

---

## 6. 退出标准

- [ ] 抽取规则可在后台编辑并生效。
- [ ] FAQ / HowTo 关键页面可通过后台开关控制输出。
- [ ] 有规则变更日志与一键回滚。
- [ ] E2E 增加“规则调整后类型变化”验证用例。

