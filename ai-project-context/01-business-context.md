# 01 · 业务脉络（Business Context）

> 整理 kibouFlow 的业务边界、用户角色、内容模型、转化链路与「未来想做但未实现」的部分。
> 来源：`AGENTS.md`、`docs/geo-strategy.md`、`docs/new-post-sop.md`、`src/lib/content.ts`、`src/lib/schemas.ts`、`content/{zh,ja}/**`。

---

## 1. 核心业务概念

### 1.1 站点定位（来自 `src/app/llms.txt/route.ts` 与 `docs/geo-strategy.md`）

- 站点的产品叙事：**先整理希望，再判断路径，再导向下一步**（这一句也作为 `geo-settings.ts` 中默认 description 兜底）。
- 站点服务的人群：在日本发展但方向不清的人；以及希望与 kibouFlow 合作的机构。

### 1.2 内容三段式

`AGENTS.md` 第 4 节 + `src/lib/content.ts` 顶部常量定义：

- **`category`（目录即分类）**：`problems | paths | boundaries | cases`。也是 `content/{locale}/<category>/*.mdx` 的物理目录。
- **`contentType`**：`problem | path | boundary | case | faq | framework | concept | cluster`。控制 JSON-LD 输出（例如 `framework`/`cluster` 出 `HowTo`、`faq` 出 `FAQPage`、`concept` 出 `DefinedTerm`）。
- **`cluster`（主题簇）**：`job-prep | japanese-path | direction-sorting | partner-needs`。同一簇的文章互相强关联，每个 cluster 都有 cluster entry 文章（如 `job-prep-cluster-entry`，见 `CLUSTER_ENTRY_SLUGS`）。
- **`audience`**：`individual | partner | both`。
- **`ctaType`**：`trial | partner | both`，决定文章末 CTA 朝哪边引导。

### 1.3 双语等价（不是翻译）

`docs/geo-strategy.md` 第 1 节明确：「多语言等价而非翻译：zh/ja 的标题与例子按本地语境改写，避免模型判定为低价值镜像」。这意味着 **zh 和 ja 不是机翻镜像，是各自完整的本地化版本**。

---

## 2. 核心用户角色

| 角色 | 入口路径 | 关键交互 |
|------|----------|----------|
| 中文个人访客 | `/zh`、`/zh/guides`、`/zh/faq` | 阅读判断框架、提交 `/zh/trial` |
| 日文个人访客 | `/ja`、`/ja/guides`、`/ja/faq` | 同上，落到 `/ja/trial` |
| 机构合作方 | `/zh/partner`、`/ja/partner` | 提交合作意向 |
| 管理员（GEO 体检） | `/{locale}/admin/login` → `/{locale}/admin/geo-audit` | 输入 `ADMIN_GEO_PASSWORD` 登录后运行体检脚本、查看历史 |
| LLM / 搜索引擎爬虫 | `/llms.txt`、`/llms-full.txt`、`/sitemap.xml`、`/robots.txt`、JSON-LD | 一次性摄取站点结构与内容 |

> 当前项目**没有**普通用户登录系统，普通访客都是游客流量。只有 admin 是密码登录（单一密码，HMAC 签名 cookie）。

---

## 3. 主要业务对象

### 3.1 表单提交（PostgreSQL 表）

- `trial_submissions`：试用申请。字段见 `src/lib/schemas.ts` 的 `trialFormSchema` 与 `supabase/migrations/001_init.sql`：
  - 必填：`name`、`contact`
  - 选填：`current_status`、`main_concern`、`goal`、`willing_followup`、`source_note`、UTM 系列、`landing_page`、`locale`、`ip_address`
- `partner_submissions`：机构合作。`partnerFormSchema`：
  - 必填：`org_name`、`contact_person`、`contact_method`
  - 选填：`org_type`、`cooperation_interest`、UTM、`landing_page`、`locale`、`ip_address`
- `tracking_events`：埋点事件。字段见 `src/lib/pg-data.ts` 的 `TrackingEventRow` + 001 migration。

### 3.2 GEO 配置 / 规则（DB-driven，运行期可覆盖）

- `geo_site_settings`：站点级元数据兜底（`site_name`、`default_title_template`、`default_description`、`default_locale`、`site_url`、`robots_policy`）。
- `geo_page_settings`：单页 metadata 覆盖（`meta_title`、`meta_description`、`canonical_url`、`og_*`、`noindex`、`jsonld_overrides`）。
- `geo_rules`：抽取规则（FAQ 标题排除正则、最少 FAQ 条数、HowTo 段落正则、`article_abstract_from_tldr`）。
- `geo_schema_toggles`：哪些 JSON-LD 在某条路径上开关（`enable_article` / `enable_faqpage` / `enable_howto` / `enable_breadcrumb` / `enable_website`）。

### 3.3 GEO 体检结果

- `geo_audit_runs`：每次体检的元信息 + 五维分数（`retrievability_score` / `chunkability_score` / `extractability_score` / `trust_score` / `attributability_score` + `overall_score`）+ Markdown / JSON 报告。
- `geo_audit_issues`：单次体检发现的结构化问题（`code`、`title`、`severity`、`layer`、`status`、`evidence`）。
- `geo_audit_decisions`、`geo_audit_decisions_enrich`：对 issue 的处置决定。

---

## 4. 主要业务流程（高度概括，详见 `03-core-flows.md`）

| 流程 | 输入 | 输出 |
|------|------|------|
| 内容浏览 | 用户访问 `/zh/guides` | 列表页按 cluster / faq / framework / concept / category 分组渲染 |
| 文章详情 | 访问 `/zh/guides/{category}/{slug}` | MDX 渲染 + Article / FAQ / HowTo / DefinedTerm / Breadcrumb JSON-LD + 相关文章 + cluster entry |
| Trial 转化 | 用户在 `/zh/trial` 填表 | `POST /api/trial` → Zod 校验 → rate limit → `trial_submissions` 落库 → 重定向 `/trial/success` |
| Partner 转化 | 用户在 `/zh/partner` 填表 | `POST /api/partner` → 同上链路 |
| 埋点 | 客户端事件 | `POST /api/track` → `tracking_events` 落库（失败不返回 5xx） |
| GEO 体检 | admin 在后台点「运行体检」 | `POST /api/admin/geo-audit/run` → spawn `python3 scripts/geo_principles_audit.py --json` → 解析 JSON + Markdown → 落 `geo_audit_runs` 与 `geo_audit_issues` |
| SEO/GEO 路由 | 爬虫访问 `/sitemap.xml`、`/robots.txt`、`/llms.txt` | 由 `src/app/sitemap.ts`、`src/app/robots.ts`、`src/app/llms.txt/route.ts` 动态生成 |

---

## 5. 输入 → 输出 的高层视角

```
用户访问 /zh/guides/{category}/{slug}
    ↓ Next.js App Router
generateStaticParams() 列出所有 (locale, category, slug)
    ↓
getArticleBySlug() 读 content/{locale}/{category}/{slug}.mdx，解析 frontmatter
    ↓ normalizeFrontmatter() 兜底 contentType / cluster / ctaType
    ↓
resolveGeoMetadata() 合并 geo_site_settings + geo_page_settings → 输出 metadata + canonical + alternates + robots
    ↓
getGeoSchemaToggles() 决定输出哪些 JSON-LD
    ↓
extractFaqPairsFromMarkdown() / extractHowToFromMarkdown() 从 MDX 文本现场抽取 FAQ / 步骤
    ↓
ArticleLayout + MDXRemote 渲染正文，附带 RelatedArticles、ClusterEntry、ArticleTracking
    ↓
返回 HTML（包含 JSON-LD <script>）
```

---

## 6. 当前已实现的业务逻辑

- 中日双语完整路径，含首页、guides 索引、guides 详情、faq、trial、partner、success 页。
- frontmatter normalization：`src/lib/content.ts` 的 `normalizeFrontmatter` 会兜底 `contentType` / `cluster` / `ctaType`、清洗智能引号、过滤空字符串、为高价值类型自动派生 `about` 字段。
- relatedSlugs 与 cluster 的「策略型相关文章」：`getStrategicRelatedArticles` 会按 contentType 做不同的优先级排序。
- 写入限流：`checkRateLimit`（10 分钟 3 次，IP 维度）保护 `/api/trial`、`/api/partner`、`/api/admin/geo-audit/run`。
- DB 缺失降级：所有写库点（`pg-data.ts` / `geo-audit-runs.ts` / `geo-settings.ts`）都会在 `DATABASE_URL` 缺失时返回兜底，不抛 500。trial / partner 在 DB 缺失时返回 503，埋点静默失败。
- GEO 五维体检：脚本 `scripts/geo_principles_audit.py` 输出 `retrievability/chunkability/extractability/trust/attributability` 五维分数 + 结构化 issues + Markdown 报告。
- 内容守门：`scripts/content-harness-check.mjs` 在 `verify:content` 中扫描所有 MDX，按 W001-W011 规则给 warning / error；当前 baseline 是 0 warnings。

## 7. 文档提到但尚未实现 / 仅部分实现的逻辑

- `docs/geo-implementation-phases.md` 中的「**阶段 6 答案页 + 术语页**」「**阶段 7 监测闭环**」标为 P2 可选阶段，对应代码尚未在仓库出现。
- `docs/geo-strategy.md` 中提到「区分来自大模型引用的 referral 流量」属于规划项；当前 `tracking_events` 没有专门的 LLM referral 维度。
- `docs/new-post-sop.md` 附录提到的「P1：补 ja 高优先级文章 frontmatter 缺失项」属于内容治理待办。`docs/content-warning-remediation-plan.md` 显示当前 `totalWarnings: 0`，但 SOP 历史快照里的待办（如 i18n 缺 key）需要单独核对当前代码。
- `geoPublishRequestSchema` / `geoPublishReviewSchema` / `geoPublishActionSchema`（在 `src/lib/schemas.ts`）暗示一个「草稿 → 待审 → 发布」的 GEO 配置发布流；**未在仓库中找到对应 API 路由实现**（`src/app/api/admin` 仅有 login / logout / session / geo-audit），属于「文档未提但 schema 已埋」的隐藏面，须确认是否计划中。

## 8. 业务上的边界与限制

由 `AGENTS.md` 第 5 节 + `content/zh/boundaries/what-we-dont-handle-yet.mdx` 类文章定义：

- 不做学校择校、签证申请、纯日语教学等「我们当前不接的」业务。
- 不做用户账号系统、不做支付、不做需求-供给撮合（仅是「线索表单」级别的转化）。
- 仅接 `zh` 与 `ja` 两个 locale，新增 locale 不是默认动作（`AGENTS.md` 第 5 节）。
- GEO 体检后台只做 GEO 仓库自检，**不是**通用 CMS。
- 受限的命名 / 分类 / cluster：枚举值都是硬编码常量（`CATEGORIES` / `CONTENT_TYPES` / `CLUSTERS`），扩展需要同时改 `content.ts`、`scripts/content-harness-check.mjs`、SOP 文档。

---

## 9. 转化漏斗与埋点事件

埋点事件名清单（来源：`README.md`、`src/lib/tracking-events.ts`、`tests/unit/tracking.test.ts`）：

- `page_view`
- `cta_click`
- `trial_form_started` / `trial_form_submitted`
- `partner_form_started` / `partner_form_submitted`
- 非 trial/partner 表单回退：`form_start` / `form_submit`

埋点客户端：`src/lib/tracking.ts`（优先 `navigator.sendBeacon`，失败回退 `fetch keepalive`）。

---

*若发现业务概念被悄悄重命名，请优先回去看 `src/lib/content.ts` 顶部的常量定义，那是事实源。*
