# GEO 后台操作指南（Phase 1-3）

> 适用对象：运营、编辑、审核人、管理员  
> 目标：用统一流程完成配置编辑、规则调整、审核发布、导出交接

---

## 1. 后台入口

- 访问路径：`/{locale}/admin/geo`（示例：`/zh/admin/geo`）
- 建议每次进入先执行：
  - 先点击“加载/查询”按钮，获取当前线上配置
  - 再修改并保存，避免覆盖他人变更

---

## 2. 角色与权限（Phase 3）

系统固定 3 种角色：

- `admin`
  - 可配置角色绑定
  - 可审核、可发布、可紧急发布
  - 可导出与查看审计
- `reviewer`
  - 可审核（通过/驳回）
  - 不可发布
- `editor`
  - 可编辑配置与规则
  - 可创建提审请求
  - 不可审核/发布

### 2.1 角色绑定操作

在后台“Phase 3 - 权限与审批”区：

1. 输入 `user_id`
2. 选择 `role`
3. 点击“保存角色绑定”

建议：

- 始终保留至少 1 个 `admin`
- 不要把所有账号降为 `editor`

---

## 3. 站点与页面配置（Phase 1）

## 3.1 站点配置

可维护字段：

- `site_name`
- `default_title_template`
- `default_description`
- `site_url`

操作步骤：

1. 点击“加载站点配置”
2. 修改字段
3. 点击“保存站点配置”

## 3.2 页面配置

可维护字段：

- `locale + path`
- `meta_title`
- `meta_description`
- `canonical_url`
- `noindex`
- `jsonld_overrides`

操作步骤：

1. 选择 `locale` 并输入 `path`
2. 点击“查询页面配置”
3. 修改后点击“保存页面配置”
4. 查看“JSON 预览”确认生效内容

注意：

- `path` 建议固定使用前导 `/`
- `jsonld_overrides` 必须是合法 JSON

---

## 4. 规则与 Schema 开关（Phase 2）

## 4.1 抽取规则

可配置项：

- FAQ 排除标题规则（regex 数组）
- FAQ 最小条目数
- HowTo section 规则（regex 数组）
- HowTo 最小步骤数

操作步骤：

1. 点击“加载规则”
2. 调整规则参数
3. 点击“保存规则”

## 4.2 页面 Schema 开关

可按页面控制：

- `enable_article`
- `enable_faqpage`
- `enable_howto`
- `enable_breadcrumb`
- `enable_website`

操作步骤：

1. 输入 `locale + path`
2. 点击“查询开关”
3. 调整并点击“保存开关”

注意：

- 关键页受保护，关闭关键输出会被服务端拒绝（403）

## 4.3 规则预览（强烈建议）

操作步骤：

1. 在“规则预览”粘贴 markdown
2. 点击“运行预览”
3. 确认 FAQ/HowTo 提取结果再保存规则

---

## 5. 提审、审核、发布（Phase 3）

## 5.1 创建提审请求（editor/admin）

在“Phase 3 - 权限与审批”区填写请求 JSON 并提交。

示例：

```json
{
  "scope": "rules",
  "locale": "zh",
  "draft_json": {
    "locale": "zh",
    "faq_min_items": 2,
    "howto_min_steps": 2
  },
  "status": "pending"
}
```

## 5.2 审核（reviewer/admin）

1. 输入 `request_id`
2. 执行审核动作（通过/驳回）

## 5.3 发布（admin）

1. 输入 `request_id`
2. 点击“发布”
3. 紧急场景点击“紧急发布”（必须提供原因，系统会记录审计）

---

## 6. 健康看板、审计与导出

## 6.1 健康看板

点击“加载健康看板”，重点观察：

- metadata 完整率
- JSON-LD 覆盖率
- 抽取失败数量
- noindex 页面数量
- 变更频率

## 6.2 审计日志

点击“加载审计日志”查看：

- 操作人
- 操作时间
- 操作类型（request/review/publish/export 等）
- 是否紧急发布

## 6.3 导出交接包

支持：

- 导出 JSON（结构化快照）
- 导出 CSV（交接友好）

建议交接时导出：

- 当前全量配置快照
- 最近 90 天审计日志

---

## 7. 推荐日常 SOP

- 编辑：改配置/规则 -> 规则预览 -> 提审
- 审核人：核对影响面 -> 审核通过/驳回
- 管理员：发布 -> 健康看板复核 -> 导出归档

---

## 8. 常见问题排查

- 保存失败：检查 JSON 格式、URL 格式、`locale/path` 是否合法
- 开关不生效：检查是否触发关键页保护（403）
- 发布后无变化：确认请求状态是否已到 `published`
- 查不到数据：确认当前环境数据库连接可用

