# GEO 阶段 3（结构化数据）测试路径

> 适用：阶段 3 已合并后的回归与发版前抽检。  
> 前置：Node ≥ 20.9；本地建议配置 `NEXT_PUBLIC_SITE_URL`（见 `.env.example`），与生产域名一致或指向本环境根 URL（无尾部斜杠）。

---

## 1. 测试分层总览

| 层级 | 命令 | 主要验证对象 |
|------|------|----------------|
| 单元 | `npm run test:unit` | JSON-LD 序列化、面包屑、抽取器、sitemap/site-url、strip-undefined |
| 集成 | `npm run test:integration` | `llms.txt` / `llms-full.txt`、`robots` 等路由（与阶段 1/2 重叠部分可一并回归） |
| E2E | `npm run test:e2e` | 真实页面上的 `application/ld+json` 类型集合（Playwright，`reuseExistingServer` 可复用已有 `npm run dev`） |
| 构建 | `npm run build` | 生产构建无报错，避免 RSC/元数据在构建期失败 |

建议顺序：**单元 → 集成 →（可选 build）→ E2E**；改动了页面或 layout 时务必跑 E2E。

---

## 2. 自动化：单元测试路径

在项目根目录执行：

```bash
npm run test:unit
```

与阶段 3 强相关的用例文件（可按需单文件跑：`npx vitest run tests/unit/<file>`）：

| 文件 | 覆盖点 |
|------|--------|
| `tests/unit/article-jsonld.test.ts` | Article 序列化字段（如 `url`、`inLanguage`） |
| `tests/unit/breadcrumbs.test.ts` | `buildBreadcrumbItems` 与路径片段 |
| `tests/unit/faq-extractor.test.ts` | MDX → FAQ 问答对、排除标题 |
| `tests/unit/howto-extractor.test.ts` | 「推荐阅读顺序」等 → HowTo steps |
| `tests/unit/strip-undefined.test.ts` | JSON-LD 序列化前剔除 `undefined` |
| `tests/unit/seo-site-url.test.ts` | 站点绝对 URL 与环境变量 |
| `tests/unit/sitemap.test.ts` | 站点地图 URL 与 locale（与阶段 1 共用） |
| `tests/unit/content.test.ts` | 内容加载（若改了 `content`/`contentType` 需关注） |

**通过标准**：全部通过，无 flaky。

---

## 3. 自动化：集成测试路径

```bash
npm run test:integration
```

| 文件 | 说明 |
|------|------|
| `tests/integration/llms.route.test.ts` | `llms.txt` / 全文导出路由 |
| `tests/integration/robots.route.test.ts` | `robots` 动态路由 |

（若仓库中还有 `track` 等其它集成测，与本次改动无关时可忽略失败原因是否为本阶段引入。）

---

## 4. 自动化：E2E 路径（阶段 3 核心）

```bash
npm run test:e2e
```

配置见 `playwright.config.ts`：`baseURL` 为 `http://127.0.0.1:3000`，默认会启动或复用 `npm run dev`。

`tests/e2e/core-flows.spec.ts` 中与 JSON-LD 相关的场景：

| 用例意图 | 访问路径（示例） | 断言（`@type` 集合） |
|----------|------------------|----------------------|
| 指南列表 | `/zh/guides` | 含 `BreadcrumbList`、`WebSite` |
| FAQ 类 MDX 文章 | `/zh/guides/boundaries/faq-japanese-path` | 含 `FAQPage`、`Article`、`BreadcrumbList` |
| 簇入口 HowTo | `/zh/guides/paths/japanese-learning-path-cluster-entry` | 含 `HowTo`、`Article` |
| Framework HowTo | `/zh/guides/paths/framework-japanese-or-job-first` | 含 `HowTo`、`Article` |

**注意**：E2E 文案（如「主题簇入口」）若随 i18n 变更，需同步更新 spec，否则为假失败。

---

## 5. 手工抽检路径（浏览器）

以下在 **Chrome** 中完成即可；每个 URL 建议用「查看网页源代码」或 DevTools → Elements 搜索 `application/ld+json`。

### 5.1 环境

- 启动：`npm run dev`
- 确认 `.env.local` 中 `NEXT_PUBLIC_SITE_URL` 与预期一致（影响 JSON-LD 内绝对 URL、`@id`）。

### 5.2 按路由的最低抽检矩阵

| 优先级 | 路由 | 检查项 |
|--------|------|--------|
| P0 | `/zh`、`/ja` | 存在 `WebSite`；首页若有 `Organization`，`publisher`/`@id` 链是否合理 |
| P0 | `/zh/guides` | `WebSite` + `BreadcrumbList` |
| P0 | 任意一篇普通指南文 | `Article` + `BreadcrumbList`；`url`、`inLanguage` 为预期值 |
| P0 | `/zh/guides/boundaries/faq-japanese-path`（或任意 `contentType: faq`） | `FAQPage` + `Article`；**不要**与 `/zh/faq` 的 FAQ 逻辑矛盾（独立 FAQ 页仅一份 FAQPage） |
| P0 | `/zh/guides/paths/japanese-learning-path-cluster-entry` | `HowTo` + `Article`，`step` 数量合理 |
| P0 | `/zh/guides/paths/framework-japanese-or-job-first` | `HowTo` + `Article` |
| P1 | `/zh/faq` | 仍有 FAQPage（来自 i18n），且全文无「第二份」重复挂载 |
| P1 | `/zh/trial`、`/zh/trial/success`、`/zh/partner`、`/zh/partner/success` | `BreadcrumbList`（及 layout 级 `WebSite`） |
| P2 | 日文同等路径 `/ja/...` | 与中文一致的 schema 类型；`inLanguage` 为 `ja-JP` 等预期 |

### 5.3 脚本块形态

- 单对象、`@graph`、或多条 `script`：只要解析后能找到对应 `@type` 即可。
- 确认 JSON 可 `JSON.parse`，无语法错误、无非法注释。

---

## 6. 外部工具验证（发版前建议）

在 **可公网访问的预览 URL** 或生产 URL 上测试（本地 `localhost` 部分工具不支持或受限）：

1. [Rich Results Test](https://search.google.com/test/rich-results)：`Article`、`FAQPage`、`HowTo`、`BreadcrumbList` 无致命 error（warning 可记入 backlog）。
2. [Schema Markup Validator](https://validator.schema.org/)：同上，以无 error 为目标。

---

## 7. 退出标准速查（与阶段 3 计划对齐）

- [ ] 全站结构化数据经统一组件输出，文章页无遗留手写重复块（与当前实现一致）。
- [ ] 每个 locale 下列表/详情能看到 `WebSite`（来自 layout）及预期面包屑。
- [ ] 至少一篇 FAQ MDX 带 `FAQPage`；至少一篇 framework/cluster 带 `HowTo`（steps ≥ 2）。
- [ ] `/zh/faq`（或各 locale FAQ 页）FAQPage 不重复、不与 MDX 文章错误叠加。
- [ ] `npm run test:unit`、`npm run test:integration`、`npm run test:e2e` 全绿。
- [ ] 单页 JSON-LD 总体积在合理范围（FAQ 很多时抽查）。

---

## 8. 故障排查简表

| 现象 | 排查方向 |
|------|----------|
| 绝对 URL 错误 | `NEXT_PUBLIC_SITE_URL`、尾部斜杠、`src/lib/seo/site-url.ts` |
| 缺 FAQPage | `contentType` 是否为 `faq`；正文 `##` 结构；排除标题是否误杀 |
| 缺 HowTo | 是否 framework/cluster；是否存在「推荐阅读顺序」等小节下的 `1.` 列表 |
| E2E 连不上 | 端口 3000 是否被占用；是否已 `npm run dev`；`reuseExistingServer` 行为 |
| 构建失败 | `npm run build` 日志；近期改的 layout/page 服务端组件 |

---

*文档版本：与仓库阶段 3 实现及 `tests/e2e/core-flows.spec.ts` 当前路径对齐；若路由或 fixture 变更，请同步更新本节表格。*
