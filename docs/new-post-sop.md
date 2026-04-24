# GEO 内容发布 SOP

## 1. 发文前（必须完成）
- 确定 contentType / cluster / ctaType
- frontmatter 完整
- 有 TL;DR
- 有明确结论
- 有 suitableFor / notSuitableFor
- 有 下一步建议
- 有 relatedSlugs
- 正文至少 2 条站内内链
- faq / framework / cluster 结构满足对应抽取需求
- 本地预览无明显问题

## 2. 发布当天（冒烟检查）
- 首页正常
- guides 索引正常
- 新文章正常
- 相关文章跳转正常
- trial / partner 正常
- admin/login / geo-audit / history / issues 正常
- 页面 200
- 无明显错位
- 无新增 console error
- CTA 正常

## 3. 发布当天（保存基线）
- 记录 commit / tag
- 保存一次 GEO audit 结果
- 记录允许保留的结构例外

## 4. 发布后 1～3 天（轻量修正）
- 修 i18n 缺 key
- 补 ja 高优先级页面
- 修 relatedSlugs / 内链漏项
- 处理低成本高收益 issue
- 再跑一次 GEO audit，确认没有新回归

## 5. 发布后 3～7 天（结构优化）
- 拆长段，提升 chunkability
- 优化结论块与 next steps
- 调整 CTA 承接
- 做真实检索 / LLM 引用场景抽检

## 6. 每周治理（固定动作）
- 跑一次 GEO audit
- 对比与上次 run 的差异
- 清理 issues / decisions 积压
- 评估哪些问题应进入模板标准

---

## 附录：上线后第一周治理清单

> 本附录整合自 `上线后第一周待办清单.md`，提供发布后首周的优先级执行清单。

### P0：上线后立即确认（当天完成）

**发布后冒烟检查：**
- 打开首页 `/zh`
- 打开 `/zh/guides`
- 抽查 3 个 cluster-entry
- 抽查 2 篇 problems
- 抽查 2 篇 cases
- 打开 `/zh/trial` 和 `/zh/partner`
- 打开后台：`/zh/admin/login`、`/zh/admin/geo-audit`、`/zh/admin/geo-audit/history`、`/zh/admin/geo-audit/issues`

**确认没有发布回归：**
- 页面 200 正常
- 没有明显排版错位
- 没有新增 console error
- CTA 跳转正常
- 后台登录与体检页面可访问

**保存当前上线基线：**
- 记录本次上线 commit / tag
- 保存一份上线当天的 GEO audit 结果
- 保存当前"允许保留的结构例外"说明

### P1：上线后 1～3 天内处理

**修复 guides 索引页 i18n 缺 key：**
- 已知问题：`guides.contentTypes."faq"` 缺失
- 处理目标：补全缺失翻译 key，确认 `/zh/guides` 不再出现对应警告

**建立 ja 收尾清单并开始处理：**
优先文件：
- `content/ja/boundaries/concept-hope-sorting.mdx`
- `content/ja/boundaries/concept-path-judgment.mdx`
- `content/ja/boundaries/faq-japanese-path.mdx`
- `content/ja/boundaries/faq-job-prep.mdx`
- `content/ja/boundaries/faq-partner-collaboration.mdx`
- `content/ja/boundaries/faq-resume-or-japanese-first.mdx`

优先补：
- `## 先说结论 / 結論`
- `## 下一步建议`
- `suitableFor`
- `notSuitableFor`

**重新跑一次 GEO audit：**
- 确认 zh 主干仍稳定
- 确认 ja 补齐后 issue 继续下降
- 确认没有因为上线产生新问题

### P2：上线后 3～7 天内处理

**优化长段落页面：**
当前重点页：
- `content/zh/cases/should-learn-japanese-first.mdx`
- `content/zh/paths/japanese-learning-path-cluster-entry.mdx`
- `content/zh/paths/job-prep-cluster-entry.mdx`

处理原则：
- 不重写主题，只拆长段
- 保持原逻辑顺序
- 优先提升 chunkability

**做一次真实检索 / LLM 引用场景抽检：**
- 搜索是否能正确命中核心问题页
- 页面是否容易被概括和引用
- 标题与结论块是否足够稳定
- CTA 承接是否自然

**检查后台治理链路是否顺手：**
- geo-audit 是否便于复检
- issues / decisions / fix 页面是否满足当前运营节奏
- 是否需要补最小操作说明文档

### 当前接受的结构例外（先保留，不强改）

以下页面先作为"可接受结构例外"保留：
- `content/zh/cases/direction-unclear-sorted.mdx`
- `content/zh/cases/should-learn-japanese-first.mdx`

原因：
- 页面已有 frontmatter 渲染出的结论块
- 再强行增加 `## 先说结论` 会造成双重甚至三重结论层级
- 当前人工验收认为保持现状更自然

### 上线后一周的判断目标

到一周结束时，希望达到：
- 中文主干稳定无回归
- guides 索引页 i18n 缺 key 已修复
- ja 第一批高价值页面已开始补齐
- 长段落问题至少处理 1～2 页
- GEO audit 结果继续稳定或略有提升
- 内容治理进入"低频维护"而不是"连续救火"

### 一句话执行顺序

1. 先确认上线后无回归
2. 先修 i18n 缺 key
3. 再补 ja 高价值页面
4. 再处理长段落
5. 再做真实检索 / LLM 抽检
