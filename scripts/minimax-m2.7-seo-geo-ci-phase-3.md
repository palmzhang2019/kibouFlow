# kibouFlow Harness Engineering 下一步执行任务（Phase 3：SEO / GEO 自动化守卫，适配 MiniMax M2.7）

> 请你作为一个 **SEO / GEO Guardrail 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段 harness engineering。
> 当前项目已经完成：
> - content warning 结构化 / baseline / diff
> - Phase 1-A / 1-B / 1-C 的内容治理，`verify:content` 当前为 **0 warnings**
> - Phase 2 的 content governance CI：`.github/workflows/content-governance.yml`
>
> 这一阶段不再处理 content warning，也不再优先做 baseline 历史留存，而是要把 **SEO / GEO 的 deterministic checks** 接入自动化守卫。
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小可用落地，不要把“以后可以接 verify:seo-geo”只留在文档里。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **CI / guardrail 收口任务**，你可以修改 workflow、少量脚本和文档，但不要做无关重构。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/project-overview.md`
  - `package.json`
  - `.github/workflows/content-governance.yml`
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
  - `src/app/llms.txt/route.ts`
  - `tests/unit/seo-site-url.test.ts`
  - `tests/unit/sitemap.test.ts`
  - `tests/integration/llms.route.test.ts`
  - `tests/integration/robots.route.test.ts`

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要升级依赖，不要修改 `package-lock.json`。
- 不要大规模改动内容文章；这一阶段重点不是 MDX 内容治理。
- 不要把 workflow 做成很重的全量矩阵；优先最小可用。

### 0.3 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 如果你发现某个 SEO/GEO 风险点已经有现成自动化覆盖，请明确写出来，不要重复建设。
- 最终输出必须包含：
  - 修改文件清单
  - 新增或更新的 workflow / 命令
  - 哪些路径变化会触发 SEO/GEO 守卫
  - 执行过的验证命令
  - 遗留问题

---

## 1. 当前已知现状（请先核实）

请先带着以下事实进入任务：

1. 仓库已经有：
   - `.github/workflows/content-governance.yml`
   - `npm run audit:content:diff:strict`
   - content governance 的 CI 守卫
2. 仓库当前还没有明确落地的 **SEO/GEO 专用 workflow**
3. `package.json` 已提供：
   - `npm run verify:seo-geo`
4. `verify:seo-geo` 当前实际覆盖：
   - `tests/unit/seo-site-url.test.ts`
   - `tests/unit/sitemap.test.ts`
   - `tests/integration/llms.route.test.ts`
   - `tests/integration/robots.route.test.ts`
   - `next build`
5. `docs/dev-test-seo-geo-loop-plan.md` 已将“SEO/GEO CI workflow 独立落地”列为后续方向

如果你检查后发现以上任一点不成立，请以实际情况为准，并在最终输出中说明。

---

## 2. 本阶段目标

这次任务的目标不是扩展 content governance，而是让 SEO/GEO 关键入口也具备自动化回归守卫。

### 2.1 核心目标

1. 为 SEO/GEO 相关改动新增最小可用 CI workflow
2. 让 `verify:seo-geo` 在相关路径变化时自动执行
3. 同步文档，明确 content governance 与 SEO/GEO governance 的职责边界

### 2.2 期望结果

理想情况下：

- 仓库中新增一个独立的 SEO/GEO workflow，例如：
  - `.github/workflows/seo-geo-governance.yml`
- 在相关路径变化时自动触发：
  - `npm run verify:seo-geo`
- 文档明确写清：
  - content workflow 管什么
  - SEO/GEO workflow 管什么

### 2.3 非目标

本阶段不要求你：

- 新建复杂的多 job / 多平台 matrix
- 接入 Playwright 到 CI
- 处理 admin GEO 自动化
- 做 baseline 历史留存

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：核实现有 workflow 边界

先检查：

- `.github/workflows/content-governance.yml`
- `package.json`
- `docs/dev-test-seo-geo-loop-plan.md`

输出简短结论：

1. content governance 当前已经守住了什么
2. SEO/GEO 哪部分还没有自动化覆盖
3. 你准备新增独立 workflow，还是扩展现有 workflow

**建议默认选择：新增独立 workflow。**

原因：

- 关注点更清晰
- path filter 更容易维护
- content warning 与 SEO/GEO 构建失败属于不同类型的回归

如果你决定不拆分，必须说明理由。

### 任务 B：定义 SEO/GEO workflow 的触发范围

请基于仓库现状，为 SEO/GEO workflow 设定最小合理的 path filter。

优先考虑这些路径：

- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/llms.txt/**`
- `src/components/seo/**`
- `src/lib/**` 中与 site url / seo / content 解析强相关的文件
- `tests/unit/seo-site-url.test.ts`
- `tests/unit/sitemap.test.ts`
- `tests/integration/llms.route.test.ts`
- `tests/integration/robots.route.test.ts`

要求：

1. 不要过宽到几乎所有改动都触发
2. 也不要窄到明显漏掉 `verify:seo-geo` 相关改动
3. 如果需要，你可以把 `src/lib/content.ts`、`src/lib/seo/**` 一类路径纳入

### 任务 C：落地最小可用 SEO/GEO workflow

新增一个最小 workflow，建议：

- 文件名：`.github/workflows/seo-geo-governance.yml`
- 触发：
  - `pull_request` to `main`
  - `push` to `main`
  - 带 path filter
- 步骤：
  1. checkout
  2. setup node
  3. install dependencies
  4. `npm run verify:seo-geo`

要求：

1. 优先用 GitHub Actions 原生能力
2. 复用和 `content-governance.yml` 一致的风格
3. 不要过度优化缓存、并行、artifact
4. 让 workflow 文件易读、容易维护

### 任务 D：必要时补充命令或脚本入口

如果你判断 `verify:seo-geo` 已经足够清晰，就不要再新增命令。

只有在以下情况才考虑新增：

- 当前命令不适合 CI 使用
- 需要一个更明确的 CI 别名

默认倾向：

- **不新增命令**
- 直接复用 `npm run verify:seo-geo`

### 任务 E：同步计划文档与职责边界

至少更新：

- `docs/dev-test-seo-geo-loop-plan.md`

建议同步：

- `docs/docs-index.md`

需要明确写清：

1. content governance workflow 已完成
2. SEO/GEO governance workflow 已完成（如果你本次完成）
3. 两个 workflow 分别负责什么
4. 下一步真正还没做的是什么

### 任务 F：本地验证

至少运行：

1. `npm run verify:seo-geo`

如果你新增或修改了 workflow 文件，虽然本地不能真实跑 GitHub Actions，也要至少检查：

2. workflow YAML 结构合理
3. 触发路径与命令引用没有明显拼写错误

如果你额外改了脚本或命令，也要补对应验证。

---

## 4. 推荐实施顺序

建议按这个顺序推进：

1. 先检查现有 workflow 边界
2. 确定 path filter
3. 新增独立 SEO/GEO workflow
4. 同步计划文档
5. 跑 `npm run verify:seo-geo`

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 CI 层

- 仓库中存在独立的 SEO/GEO workflow 文件
- 相关路径变化会自动触发 `verify:seo-geo`

### 5.2 设计层

- workflow 与 content governance 的职责边界清晰
- path filter 合理，不明显过宽或过窄

### 5.3 文档层

- `docs/dev-test-seo-geo-loop-plan.md` 已同步
- 文档中清楚写出 content governance / SEO-GEO governance 的分工

### 5.4 验证层

- `npm run verify:seo-geo` 通过

---

## 6. 推荐检查文件

请优先查看这些文件，不要盲改：

- `AGENTS.md`
- `package.json`
- `.github/workflows/content-governance.yml`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/docs-index.md`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/llms.txt/route.ts`
- `tests/unit/seo-site-url.test.ts`
- `tests/unit/sitemap.test.ts`
- `tests/integration/llms.route.test.ts`
- `tests/integration/robots.route.test.ts`

如果不存在，请创建：

- `.github/workflows/seo-geo-governance.yml`

---

## 7. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 3 的最小闭环

### 2. 已确认的现状缺口
- content governance 已覆盖什么
- SEO/GEO 自动化还缺什么

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

**把 kibouFlow 的自动化守卫从 content governance 扩展到 SEO/GEO governance，让 `verify:seo-geo` 也具备独立的 CI 回归防线。**
