# kibouFlow Harness Engineering 下一步执行任务（Phase 9：Admin GEO 手动测试清单自动化，适配 MiniMax M2.7）

> 请你作为一个 **Admin GEO Browser Automation 收口代理**，在当前项目根目录继续推进 `kibouFlow` 的 harness engineering。
>
> 当前主线状态：
> - Phase 1 ~ Phase 8-A 已完成，不要重复做。
> - content / SEO-GEO / Admin GEO / flows 四条 CI guardrail 已落地。
> - `verify:e2e:smoke` 已运行三个 Playwright spec，并已接入 `flows-governance.yml`。
> - `flows-governance.yml` 的 path filter 已显式包含全部三个 E2E smoke spec，job 名称已更新为 `E2E Smoke Guard`。
>
> 本阶段的目标不是继续扩大 CI，而是把 **Admin GEO 手动测试清单** 中低依赖、高价值的部分进一步沉淀成可执行自动化。

---

## 0. 执行边界

### 可以改

- `scripts/selenium_geo_admin_flow.py`
- `docs/geo-admin-selenium-e2e-flow.md`
- `docs/geo-admin-hermes-manual-test.md`
- `docs/dev-test-seo-geo-loop-plan.md`
- 必要时少量更新 `package.json`，但只有新增明确命令入口时才改

### 谨慎改

- `tests/e2e/**`
- `.github/workflows/**`

只有在你证明现有 Selenium 路径不适合本阶段目标时，才考虑新增 Playwright spec 或 workflow。默认优先复用现有 Selenium 主流程。

### 不要改

- 不要修改 `.env*`
- 不要修改 `node_modules/`、`.next/`、`test-results/`
- 不要升级依赖，不要改 `package-lock.json`
- 不要新增 DB migration
- 不要把 Admin GEO 浏览器自动化直接接入 CI，除非你同时解决服务启动、浏览器、密码、session secret、Python/Selenium 依赖等环境问题
- 不要强行自动化依赖真实数据库、真实历史记录、真实 issue 数据或完整 GEO 体检产物的用例

---

## 1. 当前已知现状

现有手动清单：

- `docs/geo-admin-hermes-manual-test.md`

现有自动化说明：

- `docs/geo-admin-selenium-e2e-flow.md`

现有自动化脚本：

- `scripts/selenium_geo_admin_flow.py`

现有命令入口：

- `npm run audit:admin:selenium`

现有 Selenium 主流程已经覆盖较多后台路径：

- 登录成功
- 总览页
- 运行体检页（支持 `GEO_ADMIN_SKIP_RUN=1` 跳过真实体检）
- 历史页
- 问题中心
- 决策 / 验证 / 标准占位页
- 退出登录

但它可能还没有充分覆盖这些低依赖缺口：

- TC-NAV-01：未登录访问受保护页应重定向到登录页
- TC-AUTH-02 的加强版：退出后再次访问受保护页应回到登录页
- TC-API-01：未带 Cookie 请求 admin API 应返回 401（如适合放入本脚本或单独轻量测试）

请以实际文件为准，不要只照搬以上判断。

---

## 2. 本阶段目标

最小目标：

1. 建立 `geo-admin-hermes-manual-test.md` 与 `selenium_geo_admin_flow.py` 的覆盖映射
2. 选择 1~3 个低依赖、高价值、稳定的手动用例补进自动化
3. 优先复用 `scripts/selenium_geo_admin_flow.py` 和 `npm run audit:admin:selenium`
4. 同步文档，让后续 agent 知道哪些手动项已自动化、哪些仍需要人工验证

推荐优先自动化：

- 未登录访问 `/{locale}/admin/geo-audit` 重定向到 `/{locale}/admin/login`
- 退出登录后再次访问 `/{locale}/admin/geo-audit` 仍重定向到登录页

可评估但不要强行做：

- 未带 Cookie 请求 `/api/admin/geo-audit/history` 返回 401

暂不建议自动化：

- 历史列表必须有真实记录
- 问题详情必须有真实 issue
- 决策提交必须有 `007` migration 和 issue 数据
- 完整运行 GEO 体检并断言落库

---

## 3. 推荐执行步骤

### A. 核实现状

优先读取：

- `AGENTS.md`
- `package.json`
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/geo-admin-hermes-manual-test.md`
- `docs/geo-admin-selenium-e2e-flow.md`
- `scripts/selenium_geo_admin_flow.py`
- `src/app/[locale]/admin/**`
- `src/app/api/admin/**`
- `src/lib/admin-session.ts`
- `src/lib/require-admin-api.ts`

输出简短结论：

1. 现有 Selenium 主流程覆盖哪些 Hermes TC
2. 哪些 TC 仍只能人工验证
3. 哪些 TC 最适合本阶段补入自动化

### B. 最小实现

默认方案：

1. 在 `scripts/selenium_geo_admin_flow.py` 登录前，先访问受保护页并断言跳转到 login
2. 在退出登录后，再访问受保护页并断言仍跳转到 login
3. 保持 `GEO_ADMIN_SKIP_RUN=1` 路径仍然可用，避免本地 smoke 被完整体检耗时拖住

如果你判断 TC-API-01 也很适合补入：

- 可以用 Python 标准库请求未授权 API，并断言 HTTP 401
- 或选择不做，只在文档中说明它已有集成测试覆盖 / 更适合 API 层测试

不要为了本阶段新增复杂 fixture、真实 DB 依赖或新的 CI secrets。

### C. 文档同步

至少更新：

- `docs/geo-admin-selenium-e2e-flow.md`
- `docs/dev-test-seo-geo-loop-plan.md`

建议按需更新：

- `docs/geo-admin-hermes-manual-test.md`

文档需要写清：

1. Selenium 主流程现在覆盖了哪些 Hermes TC
2. 哪些 TC 仍保留为手动或环境依赖验证
3. `GEO_ADMIN_SKIP_RUN=1` 仍是快速 smoke 路径
4. 本阶段没有默认接入 CI 的原因

### D. 验证

至少运行一个不依赖浏览器环境的静态验证：

```bash
python -m py_compile scripts/selenium_geo_admin_flow.py
```

如果本地环境具备：

- 已启动站点
- Chrome / Selenium 可用
- `ADMIN_GEO_PASSWORD` 或 `GEO_ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

则运行：

```bash
npm run audit:admin:selenium
```

如果缺少环境，不要伪造通过；请明确说明 blocked 原因。

可选运行：

```bash
npm run verify:admin-geo
```

---

## 4. 验收标准

本阶段完成需要满足：

1. 自动化覆盖至少补齐一个低依赖 Admin GEO 手动用例
2. `scripts/selenium_geo_admin_flow.py` 仍保持单条主流程可读，不变成复杂测试框架
3. 文档能说明 Selenium 覆盖范围与手动保留范围
4. 不引入 DB migration、依赖升级、全量 E2E CI 或新 secrets 要求
5. 验证命令执行结果被明确记录

---

## 5. 最终输出格式

请最终按下面结构输出：

### 1. 结论

- Phase 9 是否完成最小闭环

### 2. 覆盖映射

- 现有 Selenium 覆盖哪些 Hermes TC
- 本次新增覆盖哪些 TC
- 哪些 TC 仍保留手动验证

### 3. 本次改动

- 按文件列出改动

### 4. 命令入口

- `audit:admin:selenium` 是否继续作为入口
- 是否新增命令，如有请说明用途

### 5. 验证结果

- 跑了哪些命令
- 哪些通过
- 哪些因环境 blocked

### 6. 下一步建议

- 推荐下一阶段 1~3 件事

---

## 6. 一句话任务总结

这次任务的本质是：**复用现有 Admin GEO Selenium 主流程，把 Hermes 手动清单中最稳定、最低依赖的后台验证项自动化，同时保持它是本地/人工触发的轻量 guardrail，而不是重型 CI。**
