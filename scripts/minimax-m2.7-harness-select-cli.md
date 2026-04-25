# kibouFlow Harness 下一步执行任务：交互式 `harness:select` CLI（适配 MiniMax M2.7）

> 请你作为一个 **Harness CLI 实现代理**，在当前项目根目录为 `kibouFlow` 实现一个轻量交互式 harness selector。
>
> 当前 harness 主线已经完成，项目进入维护与增强阶段。不要继续新增建设型 phase，不要扩 CI。  
> 这次任务只做一件事：把已经存在的 `verify:*` / `audit:*` 命令包装成一个友好的交互式入口：
>
> ```bash
> npm run harness:select
> ```
>
> 它应该询问“这次改了什么”，然后根据选择建议并执行对应验证命令。

---

## 0. 任务边界

### 可以改

- `package.json`
- `scripts/` 下新增一个轻量 Node.js 脚本，例如：
  - `scripts/harness-select.mjs`
- `docs/harness-operating-guide.md`
- `docs/dev-test-seo-geo-loop-plan.md`（只需要补一小段说明，不要重写历史）
- `docs/docs-index.md`（如需要）

### 不要改

- 不要修改 `.env*`
- 不要修改 `node_modules/`、`.next/`、`test-results/`
- 不要修改 `package-lock.json`
- 不要新增依赖
- 不要新增 workflow
- 不要新增 E2E spec
- 不要扩大 CI
- 不要把 Selenium / manual checks 默认塞进 CI
- 不要把真实 CI 未观察写成已通过

---

## 1. 当前可复用命令

请先核实 `package.json`，当前应已有这些命令：

```bash
npm run verify:local
npm run verify:content
npm run verify:seo-geo
npm run verify:admin-geo
npm run verify:flows
npm run verify:e2e:smoke
npm run verify:publish
npm run audit:content:diff:strict
npm run audit:content:baseline
npm run audit:content:baseline:history
npm run audit:content:baseline:trend
npm run audit:admin:selenium
```

这次不要重写这些命令，只做 selector 编排。

---

## 2. 目标体验

用户运行：

```bash
npm run harness:select
```

CLI 显示一个简洁菜单，例如：

```text
kibouFlow Harness Selector

这次主要改了什么？可输入多个编号，用逗号分隔。

1. 内容 / MDX / frontmatter
2. SEO/GEO 结构（sitemap / robots / llms / JSON-LD）
3. 页面 / UI / route / component
4. Trial / Partner / Guides 核心用户流程
5. Admin GEO API / session / backend
6. Admin GEO 浏览器主流程（本地 Selenium）
7. E2E / Playwright spec
8. 发布前综合检查
9. 只查看 content baseline history / trend
0. 退出
```

用户选择后，CLI 应：

1. 输出将要运行的命令列表
2. 询问确认：

```text
将运行:
- npm run verify:content
- npm run audit:content:diff:strict

是否执行？(y/N)
```

3. 用户确认后顺序执行命令
4. 任一命令失败时立即退出，并保留该命令的退出码
5. 用户不确认时不执行，只打印建议命令

---

## 3. 命令映射建议

请以 `docs/harness-operating-guide.md` 和 `docs/testing-strategy.md` 为准，默认采用以下映射。

| 选择 | 含义 | 建议命令 |
|------|------|----------|
| 1 | 内容 / MDX / frontmatter | `npm run verify:content` + `npm run audit:content:diff:strict` |
| 2 | SEO/GEO 结构 | `npm run verify:seo-geo` |
| 3 | 页面 / UI / route / component | `npm run verify:local` |
| 4 | Trial / Partner / Guides 核心用户流程 | `npm run verify:e2e:smoke` |
| 5 | Admin GEO API / session / backend | `npm run verify:admin-geo` |
| 6 | Admin GEO 浏览器主流程 | `npm run audit:admin:selenium` |
| 7 | E2E / Playwright spec | `npm run verify:e2e:smoke` |
| 8 | 发布前综合检查 | `npm run verify:publish` + `npm run verify:e2e:smoke` |
| 9 | content baseline history / trend | `npm run audit:content:baseline:history` + `npm run audit:content:baseline:trend` |

如果用户选择多个选项：

- 合并命令
- 去重
- 保持合理顺序

建议顺序：

1. `verify:content`
2. `audit:content:diff:strict`
3. `verify:admin-geo`
4. `verify:seo-geo`
5. `verify:local`
6. `verify:e2e:smoke`
7. `verify:publish`
8. audit / history / selenium 类命令按选择顺序或说明排序

不要默认运行 `audit:content:baseline`，因为它会更新 baseline/history。只在未来明确增加“保存 baseline”选项时才允许。

---

## 4. 实现要求

### 技术要求

- 使用 Node.js 内置模块实现，例如：
  - `readline/promises`
  - `child_process`
  - `process`
- 不引入第三方依赖
- 脚本应兼容 Windows PowerShell
- 运行命令时优先通过当前平台的 npm：
  - Windows：`npm.cmd`
  - 其他：`npm`
- 子命令执行时使用 `stdio: "inherit"`，让用户能看到真实输出
- 不要用 shell 拼复杂字符串；用 `spawnSync` / `spawn` 参数数组执行

### 建议脚本路径

```text
scripts/harness-select.mjs
```

### package.json 新增命令

```json
"harness:select": "node scripts/harness-select.mjs"
```

### CLI 参数支持（建议）

至少支持：

```bash
npm run harness:select -- --help
```

输出菜单说明和映射，不执行命令。

可以按需支持：

```bash
npm run harness:select -- --dry-run
```

让用户选择后只打印命令，不执行。

如果实现 `--dry-run`，请写入文档。

---

## 5. 文档同步

至少更新：

- `docs/harness-operating-guide.md`

需要写清：

1. `npm run harness:select` 是日常入口
2. 它只是帮助选择和执行现有命令，不替代人工判断
3. baseline 生成不会默认执行
4. Selenium 入口仍依赖本地环境
5. 新增 E2E spec 仍需 tier review

按需更新：

- `docs/dev-test-seo-geo-loop-plan.md`
  - 只补一句维护增强记录即可，不要重写 phase 历史
- `docs/docs-index.md`
  - 如果 `harness-operating-guide.md` 已被索引，不需要再改

---

## 6. 验证要求

至少执行：

```bash
npm run harness:select -- --help
```

如果实现了 `--dry-run`，执行一次 dry run，例如：

```bash
npm run harness:select -- --dry-run
```

如果 CLI 需要交互，无法在当前环境自动输入，请用可说明的方式验证：

- `--help` 能运行
- 脚本语法无误
- 文档已同步

不要为了验证而强行跑所有 heavy verify 命令。

可选静态验证：

```bash
node --check scripts/harness-select.mjs
```

---

## 7. 验收标准

本任务完成需要满足：

1. `npm run harness:select` 已存在
2. `npm run harness:select -- --help` 能输出菜单 / 映射
3. CLI 能根据用户选择生成正确命令列表
4. 多选时命令去重
5. 默认需要确认后才执行
6. `--dry-run`（如实现）不执行命令
7. 文档已说明如何使用
8. 没有新增依赖、workflow、E2E、CI 范围

---

## 8. 最终输出格式

请最终按下面结构输出：

### 1. 结论

- `harness:select` 是否完成

### 2. 本次改动

- 按文件列出改动

### 3. CLI 行为

- 菜单选项
- 命令映射
- 是否支持 `--help` / `--dry-run`

### 4. 验证结果

- 跑了哪些命令
- 哪些通过
- 哪些没有跑以及原因

### 5. 使用方式

- 给用户的最短使用说明

### 6. 风险与遗留

- 交互式命令在 CI 中不应默认使用
- Selenium 仍依赖本地环境
- baseline 仍不默认更新

---

## 9. 一句话任务总结

这次任务的本质是：**把已经建好的 harness 命令矩阵包装成一个轻量交互式 selector，让日常开发者不用记命令，也能按改动类型选择正确验证组合。**
