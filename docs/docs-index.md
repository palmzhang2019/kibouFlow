# docs 文档清单

本文件用于快速说明 `docs/` 目录里“哪个文件写了什么”，方便查找、接手和避免重复写文档。

建议阅读顺序：

1. 先看 `project-overview.md` 建立项目全貌
2. 再按任务类型去看“开发 / 测试 / 内容 / GEO / 后台”对应文档
3. `archive/` 只在需要追溯历史方案时再看

---

## 一、当前可用文档

| 文件 | 主要内容 | 适合什么时候看 |
|------|----------|----------------|
| `docs/project-overview.md` | 项目总览：产品定位、技术栈、路由结构、目录结构、核心模块职责。 | 刚接手项目、需要快速建立全局认知时。 |
| `docs/使用指南.md` | 面向日常开发的使用手册，覆盖启动、环境变量、开发与回归的常见操作。 | 平时开发、自测、跑本地环境时。 |
| `docs/testing-strategy.md` | 测试分类和执行框架，解释单元、集成、E2E、手动测试之间的关系。 | 想确定“这次改动该跑什么测试”时。 |
| `docs/manual-exploratory-checklist.md` | 上线前手动探索测试清单，覆盖前台主要页面和关键交互。 | 发版前人工回归、手动冒烟时。 |
| `docs/new-post-sop.md` | GEO 内容发布 SOP，包含发文前检查、发布当天冒烟、发布后轻量修正。 | 新增或修改 MDX 内容、准备发布内容时。 |
| `docs/content-warning-remediation-plan.md` | 内容告警治理方案，汇总当前扫描出的 warning 类型、数量和治理方向。 | 想系统修内容质量问题时。 |
| `docs/seo-geo-audit.md` | SEO / GEO 审计方法和审计发现，偏“怎么检查、发现了什么”。 | 做站点体检、复盘可见性问题时。 |
| `docs/geo-principles.md` | GEO 原理文档，解释生成式搜索/RAG 管线和 GEO 的五大原则。 | 需要先理解“为什么这么做”时。 |
| `docs/geo-strategy.md` | GEO + SEO 策略方案，偏目标、现状差距、策略方向。 | 做方向规划、对齐优化思路时。 |
| `docs/seo-geo-optimization-plan.md` | GEO + SEO 优化方案，内容和 `geo-strategy.md` 高度接近，偏完整方案版。 | 需要查看较完整的历史/平行方案时。 |
| `docs/geo-implementation-phases.md` | GEO 落地的分阶段开发计划，说明每阶段做什么、如何拆分和验收。 | 准备排期、拆任务、做 roadmap 时。 |
| `docs/dev-test-seo-geo-loop-plan.md` | Harness Engineering 落地计划，强调 agent/开发/验证/反馈闭环，并记录 content、SEO/GEO、Admin GEO、flows/E2E smoke 四条 CI 守卫的职责边界。 | 想完善仓库工作流、验证链路和 agent 使用规范时。 |
| `docs/geo-backend-operation-guide.md` | GEO 体检后台操作指南，说明后台入口、环境变量、运行与查看历史的流程。 | 使用 admin GEO audit 后台时。 |
| `docs/geo-admin-hermes-manual-test.md` | GEO 治理后台的手动测试清单，给人工或 Hermes 执行探索/回归测试。 | 对后台做人工回归时。 |
| `docs/geo-admin-selenium-e2e-flow.md` | GEO 治理后台 Selenium 自动化主流程说明，对应脚本和环境变量。 | 想跑后台浏览器自动化时。 |

---

## 二、按任务场景找文档

| 任务场景 | 优先看这些文档 |
|----------|----------------|
| 刚接手项目 | `project-overview.md`、`使用指南.md` |
| 日常开发 / 本地启动 | `使用指南.md`、`testing-strategy.md` |
| 改页面、接口、SEO/GEO 逻辑后要回归 | `testing-strategy.md`、`manual-exploratory-checklist.md`、`seo-geo-audit.md` |
| 新增或修改内容文章 | `new-post-sop.md`、`content-warning-remediation-plan.md` |
| 调整 CI / harness 守卫 | `dev-test-seo-geo-loop-plan.md`、`testing-strategy.md` |
| 想理解 GEO 为什么这样设计 | `geo-principles.md`、`geo-strategy.md` |
| 想做 GEO 方案规划或阶段拆分 | `geo-strategy.md`、`geo-implementation-phases.md`、`dev-test-seo-geo-loop-plan.md` |
| 使用 GEO 后台 | `geo-backend-operation-guide.md` |
| 测后台登录、体检、历史链路 | `geo-admin-hermes-manual-test.md`、`geo-admin-selenium-e2e-flow.md` |

---

## 三、归档文档

`docs/archive/` 里的文件主要用于保留历史讨论、旧版方案或被整合前的原始材料，不建议作为当前执行标准直接引用。

| 文件 | 主要内容 | 备注 |
|------|----------|------|
| `docs/archive/geo-seo-optimization-plan.md` | 较早版本的 GEO / SEO 优化方案。 | 已被顶层 GEO 方案类文档吸收。 |
| `docs/archive/hermes-manual-test-instruction.md` | Hermes 手动探索测试执行指令。 | 主要内容已整合进 `manual-exploratory-checklist.md`。 |
| `docs/archive/seo-advice-01.md` | SEO / GEO 检测方法论。 | 已整合进 `seo-geo-audit.md`。 |
| `docs/archive/seo-advice-02.md` | SEO / GEO 审计发现原始记录。 | 已整合进 `seo-geo-audit.md`。 |
| `docs/archive/test-doc.md` | 测试分类与阶段性交付策略的旧稿。 | 已整合进 `testing-strategy.md`。 |
| `docs/archive/上线后第一周待办清单.md` | 上线后第一周的 GEO 内容治理待办。 | 历史阶段性清单，可供追溯。 |
| `docs/archive/问题清单.md` | 一次体检输出的问题清单与评分摘要。 | 偏结果快照，不是长期规范。 |

---

## 四、当前目录里的重复与注意点

- `geo-strategy.md` 和 `seo-geo-optimization-plan.md` 主题高度重合，后续可以考虑合并，减少维护成本。
- `archive/` 里的多份文档已经被顶层文档整合，查资料时优先看顶层，不要先看归档。
- `使用指南.md` 中提到的部分 `geo-phase-*` 文件当前在 `docs/` 目录中未见对应文件，后续可顺手清理引用。

---

## 五、最短导航建议

- 想知道“这个项目是干什么的”：看 `project-overview.md`
- 想知道“我现在该怎么跑起来”：看 `使用指南.md`
- 想知道“改完后要怎么验”：看 `testing-strategy.md`
- 想知道“内容怎么发、怎么补质量”：看 `new-post-sop.md`
- 想知道“GEO 为什么做、做什么、怎么分阶段做”：看 `geo-principles.md`、`geo-strategy.md`、`geo-implementation-phases.md`
- 想知道“后台怎么用、怎么测”：看 `geo-backend-operation-guide.md`、`geo-admin-hermes-manual-test.md`
