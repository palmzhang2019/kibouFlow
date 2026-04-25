# Content Warning Remediation Plan

> Generated: 2026-04-24
> Updated: 2026-04-25 (Phase 2 CI sync)
> Source: Phase 1 of Harness Engineering - Content Warning Structuring

---

## ⚠️ 历史状态说明

本文档记录的是 **2026-04-24** 的治理结果（Phase 1-A/1-B/1-C）。

**当前状态（2026-04-25）**：

| 指标 | 数值 |
|------|------|
| 扫描文章总数 | 48 MDX files |
| blocking errors | 0 |
| warnings | **0** |
| 当前 baseline | `totalWarnings: 0` |

---

## 扫描概览（历史快照）

| 指标 | 数值 |
|------|------|
| 扫描文章总数 | 48 MDX files |
| blocking errors | 0 |
| warnings（历史） | 69 |
| 受影响文件数（历史） | 40 |
| 双语配对完整率 | 100% (48/48 paired) |

---

## Warning 类型聚类

### 按类型分布

| Warning 类型 | 数量 | 占比 | Severity |
|--------------|------|------|----------|
| `only 0 internal links` | 33 | 48% | P1 |
| `only 1 internal links` | 3 | 4% | P1 |
| `missing next-step section heading` | 23 | 33% | P1 |
| `missing tldr frontmatter` | 6 | 9% | P2 |
| `missing suitableFor frontmatter` | 1 | 2% | P2 |
| `missing notSuitableFor frontmatter` | 1 | 2% | P2 |
| `non-canonical contentType` | 1 | 1% | P3 |
| `non-canonical cluster` | 1 | 1% | P3 |

### 按影响层级分类

#### Template-level（模板/规则级问题）

这些问题的根源不在单篇文章，而在**内容模板或写作规范**未强制要求：

| Warning 类型 | 数量 | 说明 |
|--------------|------|------|
| `missing next-step section heading` | 23 | **所有 23 条都集中在 `ja` (Japanese) 文章**。这说明日语文章的写作模板没有强调"下一步"section，而中文版本天然有（"下一步建议"）。 |

**结论**：这不是 23 篇日文文章各自的问题，而是**日语内容模板缺少 next-step 强要求**。

#### Article-level（单篇文章问题）

这些是具体文章的内容缺失，需要逐篇修复：

| Warning 类型 | 数量 | 涉及文件 |
|--------------|------|----------|
| `missing tldr frontmatter` | 6 | ja/parallel-japanese-and-job, ja/goal-unclear-kills-consulting, ja/job-seeking-vs-language, ja/resume-writing-not-just-writing, ja/when-to-use-hope-sorting, ja/what-we-dont-handle-yet |
| `missing suitableFor frontmatter` | 1 | ja/what-we-dont-handle-yet |
| `missing notSuitableFor frontmatter` | 1 | ja/what-we-dont-handle-yet |
| `insufficient internal links` | 36 | 见完整文件清单 |

**注意**：`what-we-dont-handle-yet.mdx` 一篇就占了 3 条（tldr + suitableFor + notSuitableFor），是frontmatter 缺失最严重的文章。

#### Translation-level（双语配对/翻译覆盖问题）

**结论：0 条此类问题。** 所有 48 篇文章都已成对存在（zh/ja）。双语生产流程已经完整。

### 按语言分布

| 语言 | 有 warning 的文章数 | 总文章数 | 覆盖率 |
|------|-------------------|----------|--------|
| ja | 23 | 24 | 96% 有 warning |
| zh | 17 | 24 | 71% 有 warning |

**观察**：`ja` 文章的 warning 密度远高于 `zh`，且主要差在 next-step section heading（23 条全在 ja）。

---

## 优先级定义

| 优先级 | 定义 | 适用场景 |
|--------|------|----------|
| P1 | GEO/SEO 结构关键项，影响内容可抽取性和转化引导 | internal links < 2, missing next-step |
| P2 | frontmatter 完整性，影响内容摘要和分类 | missing tldr, suitableFor, notSuitableFor |
| P3 | 已知可接受债务，当前暂不影响功能 | non-canonical contentType/cluster |

**当前 P1 总量**：36 条（internal links） + 23 条（next-step） = 59 条
**当前 P2 总量**：8 条（tldr + suitableFor + notSuitableFor）

---

## 涉及文件清单

### P1: Internal Links 问题（36 条）

#### `ja` locale（33 条 internal links = 0）
- ja/boundaries/concept-hope-sorting.mdx
- ja/boundaries/concept-path-judgment.mdx
- ja/boundaries/faq-japanese-path.mdx
- ja/boundaries/faq-partner-collaboration.mdx
- ja/boundaries/what-we-dont-handle-yet.mdx
- ja/boundaries/when-to-use-hope-sorting.mdx
- ja/cases/direction-unclear-sorted.mdx
- ja/cases/should-learn-japanese-first.mdx
- ja/paths/four-preparation-paths.mdx
- ja/paths/framework-japanese-or-job-first.mdx
- ja/paths/framework-not-ready-signals.mdx
- ja/paths/parallel-japanese-and-job.mdx
- ja/paths/push-forward-or-sort-first.mdx
- ja/problems/goal-unclear-kills-consulting.mdx
- ja/problems/job-seeking-vs-language.mdx
- ja/problems/resume-vs-japanese.mdx
- ja/problems/resume-writing-not-just-writing.mdx
- ja/problems/when-not-to-apply.mdx

#### `zh` locale（14 条 internal links = 0 or 1）
- zh/boundaries/concept-hope-sorting.mdx (1 link)
- zh/boundaries/concept-path-judgment.mdx (0 links)
- zh/boundaries/faq-japanese-path.mdx (1 link)
- zh/boundaries/faq-partner-collaboration.mdx (0 links)
- zh/boundaries/when-to-use-hope-sorting.mdx (0 links)
- zh/cases/direction-unclear-sorted.mdx (0 links)
- zh/cases/should-learn-japanese-first.mdx (0 links)
- zh/paths/four-preparation-paths.mdx (0 links)
- zh/paths/framework-japanese-or-job-first.mdx (0 links)
- zh/paths/framework-not-ready-signals.mdx (0 links)
- zh/paths/parallel-japanese-and-job.mdx (0 links)
- zh/paths/push-forward-or-sort-first.mdx (0 links)
- zh/problems/goal-unclear-kills-consulting.mdx (0 links)
- zh/problems/job-seeking-vs-language.mdx (0 links)
- zh/problems/resume-vs-japanese.mdx (0 links)
- zh/problems/resume-writing-not-just-writing.mdx (0 links)
- zh/problems/when-not-to-apply.mdx (0 links)

### P1: Next-Step Section 问题（23 条，全部在 `ja`）

- ja/boundaries/concept-hope-sorting.mdx
- ja/boundaries/concept-path-judgment.mdx
- ja/boundaries/faq-japanese-path.mdx
- ja/boundaries/faq-job-prep.mdx
- ja/boundaries/faq-partner-collaboration.mdx
- ja/boundaries/faq-resume-or-japanese-first.mdx
- ja/boundaries/what-we-dont-handle-yet.mdx
- ja/boundaries/when-to-use-hope-sorting.mdx
- ja/cases/case-library.mdx
- ja/cases/direction-unclear-sorted.mdx
- ja/cases/should-learn-japanese-first.mdx
- ja/paths/direction-sorting-cluster-entry.mdx
- ja/paths/four-preparation-paths.mdx
- ja/paths/framework-japanese-or-job-first.mdx
- ja/paths/framework-not-ready-signals.mdx
- ja/paths/japanese-learning-path-cluster-entry.mdx
- ja/paths/job-prep-cluster-entry.mdx
- ja/paths/push-forward-or-sort-first.mdx
- ja/problems/goal-unclear-kills-consulting.mdx
- ja/problems/job-seeking-vs-language.mdx
- ja/problems/resume-vs-japanese.mdx
- ja/problems/resume-writing-not-just-writing.mdx
- ja/problems/when-not-to-apply.mdx

### P2: Frontmatter 问题（8 条）

**missing tldr (6)**：
- ja/parallel-japanese-and-job.mdx
- ja/goal-unclear-kills-consulting.mdx
- ja/job-seeking-vs-language.mdx
- ja/resume-writing-not-just-writing.mdx
- ja/when-to-use-hope-sorting.mdx
- ja/what-we-dont-handle-yet.mdx

**missing suitableFor (1)** / **notSuitableFor (1)**：
- ja/what-we-dont-handle-yet.mdx（同文章占 2 条）

---

## 推荐整改顺序

### 阶段 1-A：模板级规则修复（高优先级）

**目标**：修复 `missing next-step section heading` 的根本原因

1. 更新日语内容模板，要求包含 `## 次のステップ` 或类似 heading
2. 在 `docs/new-post-sop.md` 中增加日语文章的 next-step 要求
3. （可选）在 `content-harness-check.mjs` 中对 `ja` locale 特殊 next-step 模式支持

**涉及文件**：
- `docs/new-post-sop.md`
- `content/ja/` 下各文章模板参考

**预期效果**：一次性减少 23 条 P1 warning

### 阶段 1-B：高频 article-level 快速修复

**目标**：修复 `what-we-dont-handle-yet.mdx`（单篇占 3 条 P2 warning）

1. 补全 `content/ja/boundaries/what-we-dont-handle-yet.mdx` 的 tldr、suitableFor、notSuitableFor

**涉及文件**：
- `content/ja/boundaries/what-we-dont-handle-yet.mdx`

**预期效果**：减少 3 条 P2 warning

### 阶段 1-C：internal links 系统性补链

**目标**：减少 `internal links < 2` 的 P1 warning

这是最大量的 warning（36 条），但不能盲目添加内链。推荐方法：

1. 先建立**内链资源池**：哪些文章可以链接到哪些
2. 按 cluster 优先补链（同一 cluster 内文章互相链接）
3. Cluster 参考：
   - `job-prep`：job-prep-cluster-entry 相关文章
   - `japanese-path`：japanese-learning-path-cluster-entry 相关文章
   - `direction-sorting`：direction-sorting-cluster-entry 相关文章
   - `partner-needs`：partner 相关文章

**注意**：不是所有 36 条都需要立刻修完，而是建立**补链工作流**，让后续内容生产不再引入新问题。

---

## 规则反哺建议

### 反哺到 `AGENTS.md`

在 `Article Quality Expectations` 中增加：

```
- 所有文章（无论 locale）必须在正文末尾包含"下一步"类型的 section heading
  - zh: "## 下一步建议" 或 "## 下一步行动"
  - ja: "## 次のステップ" 或 "## 次の行動"
- 每篇文章至少包含 2 个指向其他 article 的内部链接
```

### 反哺到 `docs/new-post-sop.md`

在发文前检查清单中增加：

```
- [ ] 日语文章：确认正文末尾有 "## 次のステップ" 或等效 heading
- [ ] 确认文章内至少有 2 个内部链接（指向其他 content/*/*.mdx 文章）
- [ ] 确认 tldr、suitableFor、notSuitableFor 已填写（非空数组）
```

### 反哺到 `scripts/content-harness-check.mjs`

已完成增强（2026-04-24）：
- ✅ 增加 warning code（W001-W011）
- ✅ 增加 category（template-level / article-level / translation-level）
- ✅ 增加 severity（P1 / P2 / P3）
- ✅ 增加 `--json` 输出选项
- ✅ 增加 `--verbose` 显示全部警告
- ✅ 每条 warning 包含结构化字段（code, severity, category, file, locale, categoryDir, slug, message）
- ✅ 终端默认输出保持可读（显示 code + file + message + 聚合统计）

### Warning 基线与 diff 机制

已落地（2026-04-24）：
- `scripts/content-warning-baseline.mjs`：生成 / 查看 content warning 基线
- `scripts/baselines/content-warning-baseline.json`：机器可读 baseline 文件
- `scripts/content-warning-diff.mjs`：对比当前与 baseline 的差异
- `npm run audit:content:baseline`：生成新 baseline
- `npm run audit:content:diff`：查看 warning 变化趋势

---

## 治理机制建议

### Warning 基线文件

**历史 baseline（仅供参考）**：

```json
{
  "generatedAt": "2026-04-24",
  "scanned": 48,
  "blockingErrors": 0,
  "totalWarnings": 69,
  "byCode": { "W009": 36, "W010": 23, "W005": 6, "W006": 1, "W007": 1, "W001": 1, "W002": 1 }
}
```

**当前 baseline（Phase 2 后）**：

```json
{
  "generatedAt": "2026-04-25T00:13:02.592Z",
  "scanned": 48,
  "blockingErrors": 0,
  "totalWarnings": 0,
  "byCode": {},
  "bySeverity": { "P1": 0, "P2": 0, "P3": 0 }
}
```

**当前已知债务**：
- ✅ 所有历史 warning 已清零
- ✅ Phase 1-A/1-B/1-C 已完成
- ⚠️ 新增内容如引入 warning，将被 CI `--strict` 模式拦截

### 治理周期

| 周期 | 动作 |
|------|------|
| 发文章前 | 必须通过 `verify:content`（warning 必须为 0） |
| PR 提交 | `audit:content:diff:strict` 自动检查，有回归则 CI fail |
| 每周 | 运行 `audit:content:diff` 并审查趋势 |

### Warning 允许规则

- **允许增加**：在已知债务存量范围内（当前 69 条），新增内容引入的 warning 在存量中属于可接受范围
- **不允许增加**：新增的 warning code（W001-W011 以外的类型）或 P1 severity 数量明显上升
- **必须回滚**：如果 `audit:content:diff` 显示 delta > 0 且来自新的 W001-W011 之外的 code，需要先修再合并

---

## 附录：Warning Code 参考

| Code | Type | Severity | Category |
|------|------|----------|----------|
| W001 | non-canonical contentType | P3 | article-level |
| W002 | non-canonical cluster | P3 | article-level |
| W003 | non-canonical ctaType | P3 | article-level |
| W004 | non-canonical relatedSlugs entry | P3 | article-level |
| W005 | missing tldr frontmatter | P2 | article-level |
| W006 | missing suitableFor frontmatter | P2 | article-level |
| W007 | missing notSuitableFor frontmatter | P2 | article-level |
| W008 | missing relatedSlugs | P2 | article-level |
| W009 | insufficient internal links | P1 | article-level |
| W010 | missing next-step section heading | P1 | template-level |
| W011 | missing paired locale article | P3 | translation-level |
