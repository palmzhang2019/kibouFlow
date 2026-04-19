# GEO 治理后台 — Selenium 单条主流程说明

本文档描述 **一条按推荐顺序连续执行** 的浏览器自动化流程，与 [`geo-admin-hermes-manual-test.md`](geo-admin-hermes-manual-test.md) 中的用例顺序对齐。可执行脚本位于仓库根目录相对路径：

**[`scripts/selenium_geo_admin_flow.py`](../scripts/selenium_geo_admin_flow.py)**

---

## 1. 依赖与环境

推荐使用仓库根目录下的虚拟环境 `.venv`（已在 `.gitignore` 中忽略）：

```bash
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

pip install -r scripts/requirements-selenium.txt
```

也可全局安装：`pip install "selenium>=4.15"`（与 `requirements-selenium.txt` 等价）。

- 本机需安装 **Google Chrome**；Selenium 4.6+ 通常可自动解析 ChromeDriver（依本机环境而定）。
- 被测站点已启动（例如 `npm run dev`）。
- 服务端已配置 `ADMIN_GEO_PASSWORD`、`ADMIN_SESSION_SECRET`（与脚本中的密码一致）。

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `GEO_ADMIN_PASSWORD` | 建议 | 与 `ADMIN_GEO_PASSWORD` 相同；**未设置时自动使用根目录 `.env` / `.env.local` 里的 `ADMIN_GEO_PASSWORD`** |
| `ADMIN_GEO_PASSWORD` | 二选一 | 写在根目录 `.env` 即可，脚本启动时会 `load_dotenv` 后读取 |
| `GEO_ADMIN_BASE_URL` | 否 | 默认 `http://localhost:3000` |
| `GEO_ADMIN_LOCALE` | 否 | 默认 `zh` |
| `GEO_ADMIN_HEADLESS` | 否 | 设为 `1` 时使用无头 Chrome |
| `GEO_ADMIN_SKIP_RUN` | 否 | 设为 `1` 时**不点击**「运行 GEO 体检」，仅打开运行页后回总览，再走后序步骤（适合 CI / 无 Python 环境） |

### Windows PowerShell 示例

根目录 **`.env`** 里已有 `ADMIN_GEO_PASSWORD`（或 `GEO_ADMIN_PASSWORD`）时，脚本会自动加载，只需：

```powershell
$env:GEO_ADMIN_SKIP_RUN = "1"   # 可选：快速冒烟
python scripts/selenium_geo_admin_flow.py
```

未使用 `.env` 时可临时指定密码：

```powershell
$env:GEO_ADMIN_PASSWORD = "你的后台密码"
python scripts/selenium_geo_admin_flow.py
```

### Linux / macOS 示例

```bash
# 密码已在根目录 .env 时可直接：
export GEO_ADMIN_SKIP_RUN=1   # 可选
python3 scripts/selenium_geo_admin_flow.py

# 或临时导出：
export GEO_ADMIN_PASSWORD='你的后台密码'
python3 scripts/selenium_geo_admin_flow.py
```

成功结束时标准输出一行：`PASS: Selenium 主流程完成`；失败则抛异常或返回非 0 退出码。

---

## 2. 脚本内步骤顺序（与 Hermes 推荐顺序对应）

| 顺序 | 动作 | 对应 Hermes / 说明 |
|------|------|---------------------|
| 1 | 打开 `/{locale}/admin/login`，填写密码，点「登录」 | TC-AUTH-01 |
| 2 | 断言进入总览，出现「总览台」标题 | TC-DASH-01 |
| 3a | **默认**：页头「运行体检」→ 点击「运行 GEO 体检」→ 最长等待 120s 至再次可点 | TC-RUN-01 |
| 3b | **SKIP**：仅打开运行页断言标题，再回「总览」 | 快速路径 |
| 4 | 断言页面含「运行成功」或「运行失败」（仅非 SKIP） | TC-RUN-01 |
| 5 | 若存在「查看本次记录」则进入报告详情并断言「分数摘要」「结构化问题」 | TC-HIST-02（分支） |
| 6 | 页头「历史」→ 历史列表；若表格有链接则点第一条进详情并断言「分数摘要」 | TC-HIST-01 / 02 |
| 7 | 页头「问题」→ 问题中心；若表内有 issue 链接则点第一条进「问题详情」 | TC-ISS-01 / 02 |
| 8 | 直接访问「决策 / 验证 / 标准」页并断言各页 H2 | TC-HUB-01 |
| 9 | 回到总览 | — |
| 10 | 点击「退出登录」，断言回到登录页 | TC-AUTH-02 |

脚本**不包含**：未登录访问 401、纯 API 调用、决策表单提交（可在 Hermes 中单测或后续扩展脚本）。

---

## 3. 注意事项

- 站点在 `/{locale}/layout` 中另有全站 `<Header />`（同为 `<header>`）。脚本通过 **`h1` 含「GEO 治理后台」** 限定后台顶栏，避免误选全站导航。

- **完整体检**依赖服务端能执行 `scripts/geo_principles_audit.py`（本机 Python 等）；超时 120s 仍不够时可改脚本内 `audit_wait_sec`。
- 无 `DATABASE_URL` 或尚无历史记录时，部分分支（「查看本次记录」、历史首行、问题首行）会被跳过，属预期。
- 若需 **日语环境**，将 `GEO_ADMIN_LOCALE=ja`，并视情况把脚本中断言里的中文标题改为日文（当前脚本按中文 UI 编写）。

---

## 4. 与可执行文件的关系

- **说明**：本文档（`docs/geo-admin-selenium-e2e-flow.md`）。
- **实现**：[`scripts/selenium_geo_admin_flow.py`](../scripts/selenium_geo_admin_flow.py)。

修改流程时请同步更新脚本与本文档第二节表格。
