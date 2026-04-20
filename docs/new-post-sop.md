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
