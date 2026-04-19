# kibouFlow 项目总览

本文档沉淀本仓库的**定位**、**技术栈**、**网站路由结构**与**代码目录结构**，便于新成员与协作者快速建立心智模型。细节以仓库内 `README.md`、`package.json` 与源码为准；若与实现不一致，以源码为准。

---

## 1. 项目介绍

**kibouFlow** 是一个面向「在日本发展」主题的**中日双语**（`zh` / `ja`）内容与转化站点，使用 **Next.js App Router** 构建。

- **内容策略**：围绕主题簇、案例库、FAQ、判断框架、概念页等进行沉淀与内链优化；当前 README 中描述为 **GEO 阶段 3（MVP）** 形态。
- **产品叙事**（站点元信息）：先整理希望，再判断路径，再导向下一步（见根 `layout` metadata）。
- **转化与数据**：提供试用（trial）、合作（partner）表单与成功页；服务端通过 **PostgreSQL** 持久化提交与埋点；可选 **GEO 五原理仓库体检**（Python 脚本 + 管理后台触发，可选 OpenAI 附录）。

---

## 2. 技术栈

| 领域 | 选型 | 说明 |
|------|------|------|
| 框架 | **Next.js 16**（`package.json` 中为 `16.2.4`） | App Router；`next.config.ts` 中 `output: "standalone"` 便于容器部署 |
| UI | **React 19** | 与 Next 16 配套 |
| 语言 | **TypeScript 5** | 全仓 TS |
| 国际化 | **next-intl 4** | `locales`: `zh`、`ja`；默认 `zh`；路由与 `Link`/`redirect` 见 `src/i18n/` |
| 内容 | **MDX** + **gray-matter** + **next-mdx-remote 6** | 内容置于 `content/zh`、`content/ja` |
| Markdown 渲染（部分场景） | **react-markdown**、**remark-gfm** | 如管理后台报告展示 |
| 校验 | **Zod 4** | API 与表单 schema |
| 数据库 | **postgres**（npm 包） | 通过 `DATABASE_URL` 连接 PostgreSQL；不再依赖 Supabase 客户端 SDK |
| 样式 | **Tailwind CSS 4**（`@tailwindcss/postcss`、`@tailwindcss/typography`） | `src/app/globals.css` |
| 测试 | **Vitest 3**、**Playwright** | `tests/unit`、`tests/integration`、`tests/e2e` |
| 质量 | **ESLint 9** + **eslint-config-next** | `npm run lint` |
| 运行时（容器内体检） | **Python 3** | `Dockerfile` 安装 `python3`；脚本 `scripts/geo_principles_audit.py` |

**环境要求**：Node.js **≥ 20.9.0**（`package.json` `engines` 与 README 一致）。

**开发命令摘要**：

- `npm run dev` — 开发（`next dev --webpack`）
- `npm run build` / `npm run start` — 生产构建与启动
- `npm run test` / `npm run test:unit` / `npm run test:integration` / `npm run test:e2e`

---

## 3. 网站结构（路由与信息架构）

### 3.1 国际化与入口

- **语言前缀**：所有主要页面位于 **`/[locale]/...`**，`locale ∈ { zh, ja }`。
- **中间件**：`src/proxy.ts` 使用 `next-intl` 的 `createMiddleware`，`matcher` 为 `"/"` 与 `"/(zh|ja)/:path*"`（具体行为以 Next 版本与 next-intl 文档为准）。

### 3.2 前台页面（用户可见）

| 路径模式 | 用途 |
|----------|------|
| `/{locale}` | 首页 |
| `/{locale}/guides` | 指南索引 |
| `/{locale}/guides/{category}/{slug}` | MDX 文章详情；`category` 对应 `content` 子目录（见下节） |
| `/{locale}/faq` | FAQ 页 |
| `/{locale}/trial` | 试用申请 |
| `/{locale}/trial/success` | 试用提交成功 |
| `/{locale}/partner` | 合作咨询 |
| `/{locale}/partner/success` | 合作提交成功 |

### 3.3 SEO / GEO 相关全局路由（无 locale 前缀）

| 路径 | 用途 |
|------|------|
| `/robots.txt` | `src/app/robots.ts` |
| `/sitemap.xml` | `src/app/sitemap.ts` |
| `/llms.txt`、`/llms-full.txt` | `src/app/llms.txt/route.ts` 等，供 LLM 爬虫发现 |

### 3.4 管理后台（GEO 体检）

| 路径 | 用途 |
|------|------|
| `/{locale}/admin/login` | 密码登录 |
| `/{locale}/admin/geo-audit` | 运行 GEO 五原理体检、查看报告 |
| `/{locale}/admin/geo-audit/history` | 体检历史列表 |
| `/{locale}/admin/geo-audit/history/{id}` | 单次体检详情 |
| `/{locale}/admin/geo` | **旧路径**，重定向至 `geo-audit` |

### 3.5 API（`src/app/api`）

| 路由 | 用途 |
|------|------|
| `POST /api/trial` | 试用提交 |
| `POST /api/partner` | 合作提交 |
| `POST /api/track` | 前端埋点 |
| `POST /api/admin/login`、`POST /api/admin/logout`、`GET /api/admin/session` | 管理登录会话 |
| `POST /api/admin/geo-audit/run` | 触发体检脚本 |
| `GET /api/admin/geo-audit/history`、`GET /api/admin/geo-audit/history/[id]` | 体检历史（需已登录） |

### 3.6 内容模型（frontmatter，与阶段 3 对齐）

常用字段包括：`category`、`contentType`、`cluster`、`audience`、`ctaType`、`relatedSlugs`，以及适用范围类 `suitableFor` / `notSuitableFor` 等。完整类型定义见 `src/lib/content.ts`（`ArticleFrontmatter`）。

**`category`（目录即分类）**：`problems` | `paths` | `boundaries` | `cases`。

---

## 4. 项目结构（仓库目录）

```text
kibouFlow/
├── content/                 # MDX 内容库
│   ├── zh/{problems,paths,boundaries,cases}/   # 中文文章
│   └── ja/{problems,paths,boundaries,cases}/   # 日文文章
├── docs/                    # 项目文档（GEO 原理、操作指南、本总览等）
├── public/                  # 静态资源
├── scripts/                 # GEO 体检 Python 脚本、粘贴 LLM 用的提示模板等
├── src/
│   ├── app/
│   │   ├── layout.tsx       # 根布局（仅包裹 children，metadata 默认）
│   │   ├── globals.css
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   ├── llms.txt/        # llms 路由
│   │   ├── [locale]/        # 按语言的页面与 admin 子树
│   │   └── api/             # Route Handlers
│   ├── components/          # UI：layout、article、forms、seo、admin、tracking 等
│   ├── i18n/                # routing、request、navigation（next-intl）
│   ├── lib/                 # 内容加载、GEO/SEO、DB、埋点、会话、校验等
│   ├── messages/            # next-intl 文案 JSON
│   └── proxy.ts             # next-intl 中间件
├── supabase/migrations/     # PostgreSQL 建表 SQL（按序号执行；自托管友好，无 Supabase 专用 RLS）
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile               # 多阶段构建；runner 含 python3 与 scripts/content 供体检
├── package.json
├── README.md
└── next.config.ts           # next-intl 插件、standalone、turbopack root
```

### 4.1 `src/lib` 职责速查（高频）

| 模块 | 职责 |
|------|------|
| `content.ts` | 读取 `content/{locale}` MDX、frontmatter 类型、列表与详情 |
| `geo-settings.ts`、`geo-rules.ts` | 站点/页面 GEO 设置、规则与 schema 开关（读库） |
| `db.ts`、`pg-data.ts` | PostgreSQL 连接与 trial/partner/track 等写入 |
| `geo-audit-runs.ts`、`geo-audit-scores.ts` | 体检历史持久化与分数汇总 |
| `geo-principles-audit-runner.ts` | Node 侧调用 `scripts/geo_principles_audit.py` |
| `admin-session.ts`、`require-admin-api.ts` | 管理端会话与 API 鉴权 |
| `tracking.ts`、`tracking-events.ts` | 埋点上报逻辑与事件名 |
| `schemas.ts` | Zod schema（表单与 API） |

### 4.2 数据库

- **迁移**：`supabase/migrations/` 下 `001`～`005`（初始化表、GEO 设置与规则、审计运行表等），在任意 PostgreSQL 上按文件名序号执行即可。
- **环境变量**：见根目录 `.env.example`；管理后台与写库依赖 `DATABASE_URL`、`ADMIN_GEO_PASSWORD`、`ADMIN_SESSION_SECRET` 等。

---

## 5. 相关文档索引

| 文档 | 内容 |
|------|------|
| `README.md` | 安装、命令、内容模型、测试与埋点摘要 |
| `docs/geo-principles.md` | GEO 五原理理论说明 |
| `docs/geo-backend-operation-guide.md` | 体检后台操作与环境变量 |
| `docs/manual-exploratory-checklist.md` | 手动探索测试清单 |

---

*文档生成自仓库当前结构；重大架构变更时请同步更新本文。*
