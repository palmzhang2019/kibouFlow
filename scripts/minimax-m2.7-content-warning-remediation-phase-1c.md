# kibouFlow 内容治理下一步执行任务（Phase 1-C，适配 MiniMax M2.7）

> 请你作为一个 **Content Governance / Internal Linking Remediation 执行代理**，在 **当前项目根目录** 中继续推进 `kibouFlow` 的下一阶段内容治理工作。
> 上一阶段已经完成：
> - content warning 的结构化输出 / baseline / diff
> - `W010` next-step 模板问题清零
> - `what-we-dont-handle-yet.mdx` 的高杠杆 frontmatter 补齐
>
> 这一阶段不再重复建设 harness 底座，也不再优先处理 next-step，而是要开始处理 **剩余的高价值非模板 warning**：
>
> 1. `W009` internal links < 2
> 2. `W005` missing tldr frontmatter
> 3. `W001/W002` non-canonical frontmatter
>
> 你当前使用的模型是 **MiniMax M2.7**。请严格按步骤执行，先核实现状，再做最小但真实有效的整改，不要把“剩余问题清单”当成抽象建议。

---

## 0. 执行约束（MiniMax M2.7 专用）

### 0.1 工作边界

- 工作目录必须是项目根目录。
- 这是一次 **内容治理执行任务**，你可以修改 `content/**`、必要文档，以及少量校验/规则文件，但必须保持改动小而聚焦。
- 优先依据以下来源建立判断：
  - `AGENTS.md`
  - `docs/dev-test-seo-geo-loop-plan.md`
  - `docs/content-warning-remediation-plan.md`
  - `docs/new-post-sop.md`
  - `scripts/content-harness-check.mjs`
  - `scripts/baselines/content-warning-baseline.json`
- 如果文档、baseline 和当前文件内容不一致，以**当前仓库内容 + 实际命令输出**为准，并把差异收敛掉。

### 0.2 禁止事项

- 不要修改 `.env*`、`node_modules/`、`.next/`、`test-results/`。
- 不要修改 `package-lock.json` 或升级依赖。
- 不要改动路由结构。
- 不要为了消灭 warning 而批量塞入无意义链接。
- 不要为了凑 `tldr` 而写空洞摘要。
- 不要把内容修复转嫁到 UI 组件层。

### 0.3 内容编辑硬规则

当你修改 `content/zh/**` 或 `content/ja/**` 时，必须遵守：

1. 先阅读对应配对文章（如果存在）。
2. 优先保持原文意图，不要擅自改主题立场。
3. 内链修复优先用 **同 cluster、同主题、已存在的真实相关文章**。
4. 不要只补“relatedSlugs”；本阶段重点是 **正文内链**。
5. 保持 URL / slug 稳定。
6. 如需修 frontmatter，优先与 canonical 枚举和值域对齐，不要自造新值。

### 0.4 输出纪律

- 每个阶段都要给出：`已检查 / 已修改 / 已验证 / 遗留问题`。
- 最终输出必须包含：
  - 修改文件清单
  - `W009 / W005 / W001 / W002` 的数量变化
  - 执行过的命令
  - 是否更新 baseline
  - 遗留问题

### 0.5 baseline 使用纪律（非常重要）

- **不要一开始就重写 baseline。**
- 必须先基于当前 baseline 执行：
  - `npm run verify:content`
  - `npm run audit:content:diff`
- 先得到“修复前基线差异 = 当前 0 / 或当前状态”的明确结果，再做修改。
- 修复完成后，再跑一次 `audit:content:diff` 看净下降。
- 只有在修复结果确认有效、并且你已经在最终输出里记录“旧数量 -> 新数量”之后，才可以决定是否更新 baseline。

---

## 1. 当前已知现状（请先核实）

根据当前 baseline，剩余 warning 为：

- `W009`: `26`
- `W005`: `5`
- `W001`: `1`
- `W002`: `1`

总 warning：`33`

### 1.1 `W005` 目标文件（5 篇）

- `content/ja/boundaries/when-to-use-hope-sorting.mdx`
- `content/ja/paths/parallel-japanese-and-job.mdx`
- `content/ja/problems/goal-unclear-kills-consulting.mdx`
- `content/ja/problems/job-seeking-vs-language.mdx`
- `content/ja/problems/resume-writing-not-just-writing.mdx`

### 1.2 `W001/W002` 目标文件（1 篇）

- `content/zh/boundaries/what-we-dont-handle-yet.mdx`
  - `W001`: `contentType: "boundaries"` 非 canonical
  - `W002`: `cluster: "self-awareness"` 非 canonical

### 1.3 `W009` 分布

- `ja`: `9`
- `zh`: `17`

当前 `W009` 文件如下：

#### ja（9）

- `content/ja/boundaries/concept-hope-sorting.mdx`
- `content/ja/boundaries/concept-path-judgment.mdx`
- `content/ja/boundaries/faq-japanese-path.mdx`
- `content/ja/boundaries/faq-partner-collaboration.mdx`
- `content/ja/boundaries/when-to-use-hope-sorting.mdx`
- `content/ja/paths/framework-not-ready-signals.mdx`
- `content/ja/paths/parallel-japanese-and-job.mdx`
- `content/ja/problems/goal-unclear-kills-consulting.mdx`
- `content/ja/problems/job-seeking-vs-language.mdx`

#### zh（17）

- `content/zh/boundaries/concept-hope-sorting.mdx`
- `content/zh/boundaries/concept-path-judgment.mdx`
- `content/zh/boundaries/faq-japanese-path.mdx`
- `content/zh/boundaries/faq-partner-collaboration.mdx`
- `content/zh/boundaries/when-to-use-hope-sorting.mdx`
- `content/zh/cases/direction-unclear-sorted.mdx`
- `content/zh/cases/should-learn-japanese-first.mdx`
- `content/zh/paths/four-preparation-paths.mdx`
- `content/zh/paths/framework-japanese-or-job-first.mdx`
- `content/zh/paths/framework-not-ready-signals.mdx`
- `content/zh/paths/parallel-japanese-and-job.mdx`
- `content/zh/paths/push-forward-or-sort-first.mdx`
- `content/zh/problems/goal-unclear-kills-consulting.mdx`
- `content/zh/problems/job-seeking-vs-language.mdx`
- `content/zh/problems/resume-vs-japanese.mdx`
- `content/zh/problems/resume-writing-not-just-writing.mdx`
- `content/zh/problems/when-not-to-apply.mdx`

---

## 2. 本阶段目标

这次任务的目标不是“再写一个治理计划”，而是继续把 warning 往下压。

### 2.1 核心目标

1. 处理剩余 `W005`，尽量清零
2. 修复 `content/zh/boundaries/what-we-dont-handle-yet.mdx` 的 `W001/W002`
3. 用 **cluster-first** 的方式，显著减少 `W009`

### 2.2 期望结果

理想情况下：

- `W005: 5 -> 0`
- `W001/W002: 1/1 -> 0/0`
- `W009: 26 -> 明显下降`
- warning 总量继续下降

### 2.3 非目标

本阶段不要求你：

- 一次性把所有 `W009` 清零
- 重写整批文章
- 新建 CI
- 修改站点架构或 SEO 代码

---

## 3. 具体执行任务

请按顺序执行。

### 任务 A：先锁定 cluster-first 的补链策略

在真正修改前，先检查每篇 `W009` 文章所属的 cluster、相关 FAQ、cluster-entry、framework、problem、case 页面，建立一个**小型内链资源池**。

要求：

1. 优先在同 cluster 内互链
2. 优先链接已有的 cluster-entry / framework / FAQ 页面
3. 只有在同 cluster 链不够时，才跨 cluster 补充
4. 不要机械地给所有文章加同一组链接

你可以把这一步的思路写进最终输出，但不需要单独产出新文档，除非你觉得它能明显帮助后续维护。

### 任务 B：先清掉 `W005`

处理这 5 篇 `ja` 文章的 `tldr`：

- `content/ja/boundaries/when-to-use-hope-sorting.mdx`
- `content/ja/paths/parallel-japanese-and-job.mdx`
- `content/ja/problems/goal-unclear-kills-consulting.mdx`
- `content/ja/problems/job-seeking-vs-language.mdx`
- `content/ja/problems/resume-writing-not-just-writing.mdx`

要求：

1. 先对照对应 `zh` 配对文章
2. `tldr` 要贴合文章实际论点，不要写模板废话
3. 若这几篇同时有 `W009`，可以顺手一起修，但不要因此让改动失控

### 任务 C：修复 `W001/W002`

处理：

- `content/zh/boundaries/what-we-dont-handle-yet.mdx`

要求：

1. 对照：
   - `AGENTS.md` 里的 canonical 值域
   - `src/lib/content.ts` 的内容模型
   - `content/ja/boundaries/what-we-dont-handle-yet.mdx`
2. 修成 canonical 值，不要继续保留非规范值
3. 如果修正后需要同步更新任何文档说明，可做最小补充

### 任务 D：执行 Phase 1-C（W009 cluster-first 补链）

请优先处理高杠杆页面：

#### 第一优先级：更像“枢纽”的页面

- cluster-entry
- framework
- faq

#### 第二优先级：与枢纽强相关的 problem / case 页面

建议优先从这些主题带起：

- `job-prep`
- `direction-sorting`
- `japanese-path`

要求：

1. 每篇补到至少 2 个正文内链即可，不追求更多
2. 链接必须出现在正文自然位置，不要堆在文末做“链接仓库”
3. 链接文本尽量具有语义，不要只写“点这里”
4. 若 `zh` 与 `ja` 配对文章都存在类似缺口，优先保持双语结构对齐

### 任务 E：必要时更新文档

如果你在本次发现以下任一情况，可做最小文档更新：

1. `docs/content-warning-remediation-plan.md` 中的“当前已知债务”已明显过时
2. `docs/new-post-sop.md` 缺少对 `tldr` / 正文内链的更明确要求
3. `docs/dev-test-seo-geo-loop-plan.md` 中的当前数字落后于本次执行结果

但注意：文档更新是**从属工作**，本阶段重点仍是清 warning。

### 任务 F：验证并决定是否更新 baseline

必须按这个顺序执行：

1. 修复完成后运行 `npm run verify:content`
2. 运行 `npm run audit:content:diff`
3. 记录：
   - `W009` 变化
   - `W005` 变化
   - `W001/W002` 变化
   - 总 warning 变化
4. 如果结果确实下降，再决定是否运行：
   - `npm run audit:content:baseline`

只有在你已经明确记录“旧值 -> 新值”的前提下，才允许更新 baseline。

---

## 4. 推荐检查文件

请优先查看这些文件，不要盲改：

### 规则 / 文档

- `AGENTS.md`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/content-warning-remediation-plan.md`
- `docs/new-post-sop.md`
- `scripts/content-harness-check.mjs`
- `scripts/baselines/content-warning-baseline.json`

### 高价值内容页面

- `content/zh/paths/job-prep-cluster-entry.mdx`
- `content/ja/paths/job-prep-cluster-entry.mdx`
- `content/zh/paths/direction-sorting-cluster-entry.mdx`
- `content/ja/paths/direction-sorting-cluster-entry.mdx`
- `content/zh/paths/japanese-learning-path-cluster-entry.mdx`
- `content/ja/paths/japanese-learning-path-cluster-entry.mdx`
- `content/zh/paths/framework-japanese-or-job-first.mdx`
- `content/ja/paths/framework-japanese-or-job-first.mdx`
- `content/zh/paths/framework-not-ready-signals.mdx`
- `content/ja/paths/framework-not-ready-signals.mdx`
- `content/zh/boundaries/faq-job-prep.mdx`
- `content/ja/boundaries/faq-job-prep.mdx`
- `content/zh/boundaries/faq-japanese-path.mdx`
- `content/ja/boundaries/faq-japanese-path.mdx`

---

## 5. 验收标准

只有满足下面这些条件，才算本阶段完成：

### 5.1 内容层结果

- `W005` 明显下降，最好清零
- `W001/W002` 清零
- `W009` 明显下降

### 5.2 质量结果

- 新增的正文内链自然、可读、语义明确
- `tldr` 不是模板废话
- 双语页面结构没有被破坏

### 5.3 验证结果

至少满足：

- `npm run verify:content` 通过
- `npm run audit:content:diff` 显示 warning 下降

如果你选择更新 baseline，也请记录：

- baseline 更新前数量
- baseline 更新后数量

---

## 6. 最终输出格式

你的最终回复请严格使用下面结构：

### 1. 结论
- 本次是否完成 Phase 1-C 的最小闭环

### 2. 已确认的处理策略
- 你采用了怎样的 cluster-first 补链方法
- 你优先修了哪些页面，为什么

### 3. 本次改动
- 按文件列出改动点

### 4. warning 变化
- `W009` 变化
- `W005` 变化
- `W001/W002` 变化
- warning 总量变化

### 5. 验证结果
- 跑了哪些命令
- 哪些通过
- 哪些失败
- 是否更新了 baseline

### 6. 剩余问题 / 下一步
- 仍未处理的 warning
- 下一阶段最值得继续推进的 1～3 件事

---

## 7. 一句话任务总结

这次任务的本质是：

**把 kibouFlow 的内容治理从“清掉模板级 warning”推进到“继续消化正文内链和剩余 frontmatter 问题”，优先完成 cluster-first 的 `W009` 补链，并清理 `W005 / W001 / W002`。**
