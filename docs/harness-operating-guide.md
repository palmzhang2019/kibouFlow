# kibouFlow Harness 日常使用指南

这份文档回答一个问题：

**今天如果我要开发、修改、迭代、做 SEO/GEO 优化，这套已经搭好的 harness 能帮我做什么，我应该怎么用它维护项目？**

它不是 harness 建设史。建设史看 [`dev-test-seo-geo-loop-plan.md`](dev-test-seo-geo-loop-plan.md)。测试分层看 [`testing-strategy.md`](testing-strategy.md)。

---

## 1. Harness 能帮你做什么

当前 harness 已经从“建设阶段”进入“维护与增强阶段”。它主要帮你做六件事：

1. **快速判断改动类型**
   - 内容文章
   - 页面 / UI / route
   - SEO/GEO 结构
   - Admin GEO 后台
   - 用户 flows / E2E
   - 发布前检查

2. **给出对应验证入口**
   - 不需要临时拼命令
   - 按任务类型选择 `verify:*` / `audit:*`

3. **阻止低质量内容回归**
   - `verify:content` 当前基线是 `0 warnings`
   - `audit:content:diff:strict` 会阻止 content warning 回归
   - baseline / history / trend 可以追踪变化

4. **保护 SEO/GEO 结构入口**
   - sitemap
   - robots
   - llms.txt / llms-full.txt
   - JSON-LD
   - site URL / content metadata

5. **保护 Admin GEO 和核心用户 flows**
   - Admin login/session/API 通过 `verify:admin-geo`
   - trial / partner / guides / E2E smoke 通过 `verify:e2e:smoke`
   - Admin 后台浏览器主流程可用 `audit:admin:selenium` 本地执行

6. **让后续维护有规则**
   - 新增 E2E spec 不能默认塞进 CI
   - 扩 CI、升级依赖、新增 workflow 都不是默认动作
   - 真实 CI 未观察时不能写成“CI 已通过”

---

## 2. 你每天应该怎么用

### Step 1：先判断任务类型

开工前先问自己：

| 你要做什么 | 首先看什么 |
|-----------|------------|
| 改 MDX / 内容文章 | `new-post-sop.md`、`content-warning-remediation-plan.md` |
| 改页面 / route / 表单 | `testing-strategy.md`、相关 route/component |
| 做 SEO/GEO 优化 | `seo-geo-audit.md`、`geo-strategy.md`、`testing-strategy.md` |
| 改 Admin GEO 后台 | `geo-backend-operation-guide.md`、`geo-admin-hermes-manual-test.md` |
| 改 E2E / 浏览器测试 | `testing-strategy.md` Section 7 |
| 调整 harness / CI | `dev-test-seo-geo-loop-plan.md`、`testing-strategy.md` |

### Step 2：改动前看工作树

先看当前是否已有别人的改动：

```bash
git status --short
```

如果看到 unrelated dirty files，不要顺手回滚。只改你这次任务需要改的文件。

### Step 3：小范围修改

默认原则：

- 能改内容源文件，就不要硬编码 UI 修补
- 能用现有 helper，就不要新造抽象
- 能跑小验证，就不要一上来跑全量
- 只在发现重复问题时增强 harness

### Step 4：按任务类型跑最小验证

使用下面的命令矩阵。

---

## 3. 命令矩阵

| 场景 | 首选命令 | 说明 |
|------|----------|------|
| 日常代码回归 | `npm run verify:local` | 单元 + 集成 + build |
| 内容 / MDX / frontmatter | `npm run verify:content` | 内容检查 + content/JSON-LD 相关单测 |
| 内容 warning 防回归 | `npm run audit:content:diff:strict` | CI 级 strict diff |
| SEO/GEO 结构 | `npm run verify:seo-geo` | sitemap / robots / llms / site URL + build |
| Admin GEO API / session | `npm run verify:admin-geo` | admin login/session/geo-audit API |
| 核心用户 flows smoke | `npm run verify:e2e:smoke` | 当前全部三个 Playwright E2E spec |
| 只看 core flows | `npm run verify:flows` | 本地 focused flows check |
| 发布前综合检查 | `npm run verify:publish` | 内容 + SEO/GEO + build |
| 保存内容 baseline | `npm run audit:content:baseline` | 会追加 history 快照 |
| 查看 baseline history | `npm run audit:content:baseline:history` | 列出历史快照 |
| 查看 warning trend | `npm run audit:content:baseline:trend` | 查看 warnings 趋势 |
| Admin 后台 Selenium 主流程 | `npm run audit:admin:selenium` | 本地/人工触发，不是默认 CI |

---

## 4. 按任务类型操作

### A. 改内容文章 / 新增 MDX

适用：`content/zh/**`、`content/ja/**`

建议流程：

1. 读目标文章和对应语言文章
2. 检查 frontmatter：`title`、`description`、`category`、`slug`、`publishedAt`
3. 保持 `tldr`、`suitableFor`、`notSuitableFor`、`relatedSlugs`
4. 保持至少 2 个正文内链
5. 保持结尾 next-step section
6. 跑：

```bash
npm run verify:content
```

如果改动影响发布质量或 GEO 可抽取性，再跑：

```bash
npm run verify:publish
```

如果你更新了 baseline，确认这是有意行为：

```bash
npm run audit:content:baseline
npm run audit:content:baseline:trend
```

### B. 改页面 / UI / route

适用：`src/app/[locale]/**`、`src/components/**`

建议流程：

1. 先确认 zh / ja 是否都受影响
2. 看 route metadata / JSON-LD 是否相关
3. 改最小范围
4. 根据影响选择：

```bash
npm run verify:local
```

如果影响 trial / partner / guides / 首页：

```bash
npm run verify:e2e:smoke
```

如果影响 SEO metadata 或结构化数据：

```bash
npm run verify:seo-geo
```

### C. 做 SEO/GEO 优化

适用：metadata、JSON-LD、sitemap、robots、llms、content loader、site URL、SEO 组件。

建议流程：

1. 判断是内容语义问题，还是站点结构输出问题
2. 内容语义优先改 MDX
3. 结构输出才改 `src/app/sitemap.ts`、`src/app/robots.ts`、`src/app/llms.txt/**`、`src/components/seo/**`、`src/lib/seo/**`
4. 跑：

```bash
npm run verify:seo-geo
```

如果同时改内容：

```bash
npm run verify:content
```

如需本地 GEO 审计：

```bash
npm run audit:seo-geo:local
npm run audit:geo:repo
```

### D. 改 Admin GEO 后台

适用：

- `src/app/[locale]/admin/**`
- `src/app/api/admin/**`
- `src/lib/admin-session.ts`
- `src/lib/require-admin-api.ts`
- `src/lib/geo-audit-*`
- `scripts/selenium_geo_admin_flow.py`

建议流程：

1. 保持 login -> session -> run -> history 的链路
2. 如果 `DATABASE_URL` 缺失，降级行为要明确
3. 不随意改 migration
4. 跑：

```bash
npm run verify:admin-geo
```

如果改了后台浏览器主流程，并且本地环境具备浏览器、站点启动、admin env：

```bash
npm run audit:admin:selenium
```

如果环境不具备，不要写“通过”。写成 blocked，并说明缺什么。

### E. 改 E2E / 浏览器自动化

先看 [`testing-strategy.md`](testing-strategy.md) Section 7。

当前分层：

| Tier | 名称 | 入口 |
|------|------|------|
| Tier 1 | CI E2E smoke | `npm run verify:e2e:smoke` |
| Tier 2 | Focused flows check | `npm run verify:flows` |
| Tier 3 | Local/manual browser automation | `npm run audit:admin:selenium` |
| Tier 4 | Environment-dependent manual checks | `docs/geo-admin-hermes-manual-test.md` |
| Tier 5 | Future full/nightly E2E | 暂不实现 |

当前所有 Playwright E2E spec 都已经是 Tier 1。

新增 Playwright spec 前必须判断：

1. 是否低依赖、快速、稳定？
2. 是否可在 GitHub Actions Ubuntu + Chromium 稳定运行？
3. 是否依赖真实 DB、Python、admin secrets、历史数据？
4. 是否更适合 Selenium 本地自动化或手动清单？

不要默认把新 spec 加进 CI。

### F. 发布前检查

发布前建议：

```bash
npm run verify:publish
npm run verify:e2e:smoke
```

如果这次发布含 Admin GEO：

```bash
npm run verify:admin-geo
```

如果这次发布含内容：

```bash
npm run verify:content
npm run audit:content:diff:strict
```

---

## 5. CI 怎么帮你守住项目

当前四条 workflow：

| Workflow | 守什么 | 命令 |
|----------|--------|------|
| `content-governance.yml` | 内容 warning / baseline 回归 | `verify:content` + `audit:content:diff:strict` |
| `seo-geo-governance.yml` | sitemap / robots / llms / JSON-LD / SEO 结构 | `verify:seo-geo` |
| `admin-geo-governance.yml` | Admin login/session/GEO audit API | `verify:admin-geo` |
| `flows-governance.yml` | core flows + E2E smoke | `verify:e2e:smoke` |

注意：

- Phase 10 只完成了本地等价检查，真实 GitHub Actions 首次运行仍待下一次相关路径 push / PR 后观察。
- 如果没有看到真实 CI 运行，不要写“CI 已通过”。
- 如果 workflow 没触发，要先判断是不是 path filter 未命中。

---

## 6. 什么时候要更新 harness

不要每次小改都扩 harness。

只有这些情况值得更新 harness：

- 同类错误重复出现两次以上
- 内容 warning 类型需要新增确定性规则
- SEO/GEO 输出结构有新入口
- Admin API payload 或 session 逻辑改变
- 新 E2E spec 通过 tier review 后确实应进入 smoke
- CI 真实运行暴露出明确配置问题

更新 harness 时，至少同步：

- 脚本或 workflow
- 相关测试
- `docs/dev-test-seo-geo-loop-plan.md`
- `docs/testing-strategy.md` 或具体 SOP

---

## 7. 不要默认做的事

除非任务明确要求，不要默认：

- 扩 CI
- 新增 workflow
- 新增 E2E
- 升级依赖
- 修改 `package-lock.json`
- 改 DB migration
- 删除或重写内容 taxonomy
- 把真实 CI 未观察写成已通过
- 把 Selenium / 手动项强塞进默认 CI

---

## 8. 常见场景速查

### 我改了一篇文章

跑：

```bash
npm run verify:content
```

发布前再跑：

```bash
npm run verify:publish
```

### 我改了 sitemap / robots / llms

跑：

```bash
npm run verify:seo-geo
```

### 我改了 trial / partner 表单

跑：

```bash
npm run verify:local
npm run verify:e2e:smoke
```

### 我改了 Admin login/session/API

跑：

```bash
npm run verify:admin-geo
```

### 我改了后台浏览器流程

先跑语法或脚本级检查；环境具备时再跑：

```bash
npm run audit:admin:selenium
```

### 我新增了 Playwright spec

先看 `testing-strategy.md` Section 7，做 tier review。

不要默认加入 `verify:e2e:smoke`。

---

## 9. 当前维护 Backlog

这些是按需事项，不是默认下一步：

1. **真实 CI 首次 push 后观察**
   - 本地等价检查已通过
   - 真实 GitHub Actions 运行记录仍待观察

2. **TC-API-02 体检 API 自动化评估**
   - 需要 Python 环境、服务端脚本执行能力，可能还需要真实 DB
   - 暂不默认自动化

3. **未来新增 E2E spec 的 tier review**
   - 新增前先判断 Tier
   - 不默认扩 CI

---

## 10. 一句话原则

**先判断任务类型，再选择最小验证；发现重复问题才增强 harness；不要把维护阶段重新变成无边界的建设阶段。**
