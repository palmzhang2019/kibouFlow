# 英文版本缺失分析报告（已全部补齐）

> 生成时间：2026-05-01（最终更新）
> 分析范围：`content/zh`、`content/ja`、`content/en` 下所有 `.mdx` 文件

---

## 总结

| 指标 | 数量 |
|------|------|
| zh 总文章数 | 24 |
| ja 总文章数 | 24 |
| en 已有文章数 | **24** (原 17 + 新增 7) |
| 缺失 en 的文章数 | **0**（已全部补齐） |
| 当前 en 文章中会 404 的内链数量 | **0** |

**关键状态**：已补齐全部 7 篇缺失英文文章。en 文章总数从 17 增至 24，与 zh/ja 持平。所有 body links 和 relatedSlugs 均通过验证，不会产生 404。

---

## 缺失英文版本的页面

**已全部补齐，当前无缺失。**

### 已补齐文章一览

| 批 | category | slug | 文件 | contentType | cluster | 优先级 |
|---|----------|------|------|-------------|---------|--------|
| P2 | boundaries | faq-resume-or-japanese-first | [`content/en/boundaries/faq-resume-or-japanese-first.mdx`](content/en/boundaries/faq-resume-or-japanese-first.mdx) | faq | job-prep | P2 |
| P2 | boundaries | faq-partner-collaboration | [`content/en/boundaries/faq-partner-collaboration.mdx`](content/en/boundaries/faq-partner-collaboration.mdx) | faq | partner-needs | P2 |
| P2 | cases | direction-unclear-sorted | [`content/en/cases/direction-unclear-sorted.mdx`](content/en/cases/direction-unclear-sorted.mdx) | case | direction-sorting | P2 |
| P2 | paths | framework-not-ready-signals | [`content/en/paths/framework-not-ready-signals.mdx`](content/en/paths/framework-not-ready-signals.mdx) | framework | direction-sorting | P2 |
| P3 | paths | four-preparation-paths | [`content/en/paths/four-preparation-paths.mdx`](content/en/paths/four-preparation-paths.mdx) | path | — | P3 |
| P3 | paths | push-forward-or-sort-first | [`content/en/paths/push-forward-or-sort-first.mdx`](content/en/paths/push-forward-or-sort-first.mdx) | path | — | P3 |
| P3 | boundaries | what-we-dont-handle-yet | [`content/en/boundaries/what-we-dont-handle-yet.mdx`](content/en/boundaries/what-we-dont-handle-yet.mdx) | boundary | — | P3 |

### 优先级说明

- **P1**：被现有英文文章的 body link 或 relatedSlugs 直接链接 → **0 篇**
- **P2**：高价值内容类型（faq / framework / case）→ **已补齐 4 篇**
- **P3**：普通文章 → **已补齐 3 篇**

---

## 当前英文文章中的 404 内链

**当前无 404 内链。** 全部 24 篇英文文章已通过内容管道验证。

### 新增文章链接审计

| 新增文章 | body 链接目标（安全 ✅ / 新建中 ⋮） | relatedSlugs |
|----------|------------------------------------|--------------|
| boundaries/faq-resume-or-japanese-first | problems/resume-vs-japanese ✅, paths/framework-japanese-or-job-first ✅ | problems/resume-vs-japanese ✅, paths/framework-japanese-or-job-first ✅ |
| boundaries/faq-partner-collaboration | paths/framework-not-ready-signals ✅, cases/case-library ✅, problems/goal-unclear-kills-consulting ✅ | paths/framework-not-ready-signals ✅ |
| cases/direction-unclear-sorted | paths/framework-not-ready-signals ✅, boundaries/concept-hope-sorting ✅ | boundaries/when-to-use-hope-sorting ✅, problems/goal-unclear-kills-consulting ✅, boundaries/concept-hope-sorting ✅, paths/framework-not-ready-signals ✅ |
| paths/framework-not-ready-signals | boundaries/concept-hope-sorting ✅, problems/goal-unclear-kills-consulting ✅ | problems/goal-unclear-kills-consulting ✅, boundaries/when-to-use-hope-sorting ✅, cases/case-library ✅ |
| paths/four-preparation-paths | boundaries/faq-japanese-path ✅, paths/job-prep-cluster-entry ✅, paths/direction-sorting-cluster-entry ✅ | problems/resume-vs-japanese ✅, problems/job-seeking-vs-language ✅, paths/push-forward-or-sort-first ✅, boundaries/when-to-use-hope-sorting ✅ |
| paths/push-forward-or-sort-first | paths/job-prep-cluster-entry ✅, paths/direction-sorting-cluster-entry ✅, boundaries/concept-hope-sorting ✅ | problems/when-not-to-apply ✅, boundaries/when-to-use-hope-sorting ✅, paths/four-preparation-paths ✅ |
| boundaries/what-we-dont-handle-yet | boundaries/when-to-use-hope-sorting ✅, paths/four-preparation-paths ✅, boundaries/concept-hope-sorting ✅ | boundaries/when-to-use-hope-sorting ✅, paths/four-preparation-paths ✅ |

---

## 链接本地化机制说明

根据 [`mdx-components.tsx`](src/components/article/mdx-components.tsx:6) 中的 [`localizeMdxHref()`](src/components/article/mdx-components.tsx:6) 函数：

- MDX 正文中的 `/guides/...` 链接会被自动加上当前 locale 前缀
- 例如英文页面中的 `](/guides/boundaries/concept-hope-sorting)` 会被渲染为 `/en/guides/boundaries/concept-hope-sorting`
- 如果目标文章在 `content/en` 中不存在，该链接会指向一个 404 页面

当前 24 篇英文文章的链接全部安全。**所有新增文章均已通过 `content-harness-check.mjs`（0 error, 0 warning）和 `npm run build` 验证。**

---

## 后续建议

### 1. 建立内容同步检查机制

在 CI 或发布流程中加入检查：当 zh/ja 新增文章时，自动提醒是否需要创建对应的 en 版本。可以在 [`scripts/content-harness-check.mjs`](scripts/content-harness-check.mjs) 中扩展此逻辑。

### 2. 添加 en 文章链接防护

在英文文章的 MDX 编辑流程中，添加一个预检步骤：验证所有 `](/guides/...)` 链接在 `content/en` 中有对应文件。这可以防止未来新增链接时意外指向 404。

### 3. 考虑 404 页面的 locale 感知

当前 [`not-found.tsx`](src/app/not-found.tsx) 可能不区分 locale。当用户访问 `/en/guides/xxx` 但文章不存在时，可以考虑：
- 显示"该文章暂无英文版本"的提示
- 提供切换到 zh/ja 版本的链接
- 而不是通用的 404 页面
