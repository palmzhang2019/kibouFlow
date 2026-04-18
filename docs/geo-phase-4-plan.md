# GEO 第四阶段实施计划：后台联动的内容信号标准化

> 前提：GEO 后台 Phase 1-2 已落地（可配置站点/页面规则与抽取参数）。

---

## 1. 阶段定位

| 项目 | 值 |
|---|---|
| 阶段编号 | GEO Phase 4 |
| 预估工时 | 工程 3-5 人日 + 内容 3-6 人日 |
| 优先级 | P0 |
| 目标 | 用后台驱动内容信号（TL;DR、摘要、结构模板）统一化 |

一句话目标：在“后台可配”的基础上，把内容层质量做成可执行标准。

---

## 2. 核心任务

| 编号 | 任务 | 说明 |
|---|---|---|
| G4-1 | `tldr` 全量化 | 所有 MDX 补齐 `tldr`，并在页面展示 |
| G4-2 | `Article.abstract` 标准化 | JSON-LD `abstract` 统一来源于 `tldr` |
| G4-3 | 后台覆盖优先 | 若后台配置了页面摘要，则优先于 frontmatter |
| G4-4 | 模板统一 | framework/concept/case 的正文结构统一 |
| G4-5 | 质量门禁 | 新增或修改内容时触发校验（缺失即告警） |

---

## 3. 执行策略

1. 先完成工程支持（读取顺序、字段映射、回退机制）。
2. 分批修正文档（FAQ+cluster -> framework+concept -> 其余）。
3. 启用 CI 校验（先 warn 后 strict）。

---

## 4. 验收标准

- [ ] 文章详情页均可看到稳定 `tldr` 信号。
- [ ] `ArticleJsonLd` 的 `abstract` 在有值时必输出。
- [ ] 后台覆盖与 frontmatter 回退链路稳定。
- [ ] 抽样 10 篇页面，摘要与正文判断一致。

---

## 5. 交付文件建议

- `docs/content-tldr-writing-guideline.md`（可选新增）
- `tests/unit/content.test.ts`（覆盖率校验）
- `tests/unit/article-jsonld.test.ts`（abstract 断言）
