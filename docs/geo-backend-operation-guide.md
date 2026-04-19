# GEO 体检后台操作指南

本仓库后台已收敛为 **仅用于 GEO 仓库自动化体检**：登录后运行 Python 脚本、查看 Markdown 报告、浏览历史记录。

---

## 1. 入口与环境变量

- **登录页**：`/{locale}/admin/login`（示例：`/zh/admin/login`）
- **体检主页**：`/{locale}/admin/geo-audit`
- **历史列表**：`/{locale}/admin/geo-audit/history`
- **历史详情**：`/{locale}/admin/geo-audit/history/{id}`

必填（否则无法登录）：

- `ADMIN_GEO_PASSWORD`
- `ADMIN_SESSION_SECRET`

数据库（PostgreSQL）：

- `DATABASE_URL`：连接串，例如 `postgresql://user:pass@127.0.0.1:5432/kibouflow`。未配置时表单/埋点/历史写入会失败或降级（见各 API 行为）。
- 修改 `.env.local` 后需重启 `next dev` / `next start`。
- 自托管库：在目标库中按文件名序号执行 `supabase/migrations/` 下全部 SQL 即可完成建表（迁移已不含 Supabase 专用 RLS）。

未配置 `DATABASE_URL` 时，GEO 体检仍可运行，但 **不会保存历史**。

其它可选：

- `GEO_AUDIT_USE_LLM=1` + `OPENAI_API_KEY`：在脚本输出末尾附加「LLM 归纳与建议（附录）」；模型默认 `GEO_AUDIT_OPENAI_MODEL=chatgpt-5.4-mini`（请以 OpenAI 文档为准）。

---

## 2. 使用流程

1. 打开登录页，输入 `ADMIN_GEO_PASSWORD`。
2. 进入主页后点击 **运行 GEO 体检**。
3. 等待完成后阅读 **渲染报告**；需要可复制 **原始 Markdown**。
4. 点击 **历史记录** 查看过往运行；点某条进入详情。

---

## 3. API（仅供维护）

- `POST /api/admin/geo-audit/run`：执行 `scripts/geo_principles_audit.py --json` 并（若已配置）写入 `geo_audit_runs`。
- `GET /api/admin/geo-audit/history`：历史列表。
- `GET /api/admin/geo-audit/history/{id}`：单次详情。

均需已登录（`geo_admin_session` Cookie）。

---

## 4. 数据库迁移

SQL 文件在 `supabase/migrations/`。在**任意 PostgreSQL** 上按文件名序号执行全部脚本即可。

---

## 5. 说明

前台 `guides` 等内容页仍可能读取 `geo_rules` 等表；与本「体检后台」无菜单级耦合。体检报告中的分数为 **启发式规则结果**，不能替代真实检索与引用环境实测。
