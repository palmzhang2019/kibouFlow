# kibouFlow

面向“在日本发展”的双语（中文/日文）内容与转化站点，基于 Next.js App Router 构建。  
当前已进入 GEO 阶段 3（MVP）形态：围绕主题簇、案例库、FAQ、判断框架、概念页进行内容沉淀与内链优化。

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript
- next-intl（中日双语）
- MDX + gray-matter（内容管理）
- Vitest / Playwright（自动化测试）

## 环境要求

- Node.js `>=20.9.0`
- npm（推荐）

> 如果本地 Node 版本低于 20，`build` 与 `vitest` 可能出现兼容错误。

## 安装与启动

```bash
npm install
npm run dev
```

默认地址：`http://localhost:3000`

## 常用命令

```bash
# 开发
npm run dev

# 生产构建与启动
npm run build
npm run start

# 代码检查
npm run lint

# 测试
npm run test
npm run test:watch
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 目录说明（核心）

```text
src/
  app/[locale]/          # 站点路由（zh/ja）
  components/            # 页面与业务组件
  lib/                   # 内容加载、埋点、校验等工具
  messages/              # i18n 文案
content/
  zh|ja/                 # MDX 内容库（problems/paths/boundaries/cases）
tests/
  unit/                  # 单元测试
  integration/           # 接口/流程集成测试
  e2e/                   # 端到端测试（Playwright）
docs/
  manual-exploratory-checklist.md
  hermes-manual-test-instruction.md
```

## 内容模型（阶段3对齐）

当前通过 frontmatter 支持阶段 3 的内容分组与索引：

- `category`: `problems | paths | boundaries | cases`
- `contentType`: `problem | path | boundary | case | faq | framework | concept | cluster`
- `cluster`: `job-prep | japanese-path | direction-sorting | partner-needs`
- `audience`: `individual | partner | both`
- `ctaType`: `trial | partner | both`
- `relatedSlugs`: 相关文章 slug 列表

## 测试说明（与当前开发对齐）

### 1) 自动化测试

- 单元测试：`tests/unit`
  - 已覆盖内容工具、埋点工具、阶段3新增字段筛选与事件命名规则
- 集成测试：`tests/integration`
  - 已覆盖 `/api/trial`、`/api/partner`、`/api/track` 核心路径
- E2E：`tests/e2e/core-flows.spec.ts`
  - 覆盖 `/zh`、`/ja`、`/guides`、文章详情、trial/partner 成功页可达
  - 包含阶段3结构可见性（主题簇入口、案例库、下一步建议）检查

### 2) 手动探索测试

上线前请按以下文档执行：

- 清单：`docs/manual-exploratory-checklist.md`
- Hermes 执行指令模板：`docs/hermes-manual-test-instruction.md`

手测重点：

- 双语关键页面可达（首页、guides、trial、partner、success）
- 表单主流程（提交、限流、异常提示）
- `/api/track` 异常不阻断主流程
- 多浏览器/多分辨率兼容
- Hydration 与浏览器扩展干扰复验

## 埋点事件（当前）

- `page_view`
- `cta_click`
- `trial_form_started`
- `trial_form_submitted`
- `partner_form_started`
- `partner_form_submitted`
- 其他非 trial/partner 表单回退：`form_start` / `form_submit`

## 注意事项

- 不要将 `.env` 等敏感配置提交到仓库。
- 新增内容页时优先补齐 `relatedSlugs`、`contentType`、`cluster`，避免索引和内链失真。
- 若要跑完整自动化测试，请先确认 Node 版本符合要求。
