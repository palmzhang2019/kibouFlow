# 任务：为 kibouFlow 项目补写缺失的 E2E 测试

## 你的角色

你是一位熟悉 Playwright + Next.js 的高级测试工程师。你的任务是为一个中日双语网站补写缺失的 E2E 测试，覆盖核心用户旅程。

## 项目背景

- 技术栈：Next.js 16 App Router、React 19、TypeScript 5
- 支持的语言：`zh`（中文）、`ja`（日文）
- 测试框架：Playwright（Chromium 桌面端）
- 测试目录：`tests/e2e/`
- 基础 URL：`http://127.0.0.1:3000`
- 开发服务器：`npm run dev`，Playwright 配置了 `webServer` 自动启动

## Playwright 配置

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

## 现有 E2E 测试风格（你必须严格遵循）

### 风格 A — 页面可达性 + 内容验证

```typescript
import { expect, test } from "@playwright/test";

test.describe("Core locale and conversion flows", () => {
  test("zh and ja home pages are reachable", async ({ page }) => {
    const zh = await page.goto("/zh");
    expect(zh?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText("kibouFlow");

    const ja = await page.goto("/ja");
    expect(ja?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText("kibouFlow");
  });
});
```

### 风格 B — 表单字段可见性

```typescript
test("trial page form fields and success page are reachable", async ({ page }) => {
  await page.goto("/zh/trial");
  await expect(page.locator('form input[name="name"]')).toBeVisible();
  await expect(page.locator('form input[name="contact"]')).toBeVisible();
  await expect(page.locator('form button[type="submit"]')).toBeVisible();

  const success = await page.goto("/zh/trial/success");
  expect(success?.ok()).toBeTruthy();
  await expect(page.locator("h1")).toBeVisible();
});
```

### 风格 C — JSON-LD 结构化数据验证

项目使用一个 `collectSchemaTypes` 辅助函数从页面中提取 JSON-LD 的 `@type`：

```typescript
async function collectSchemaTypes(page: Page): Promise<string[]> {
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  const types: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = await scripts.nth(i).textContent();
    if (!raw?.trim()) continue;
    let data: unknown;
    try { data = JSON.parse(raw); } catch { continue; }
    const pushType = (node: Record<string, unknown>) => {
      const t = node["@type"];
      if (typeof t === "string") types.push(t);
      else if (Array.isArray(t)) {
        for (const x of t) { if (typeof x === "string") types.push(x); }
      }
    };
    if (Array.isArray(data)) {
      for (const node of data) {
        if (node && typeof node === "object") pushType(node as Record<string, unknown>);
      }
    } else if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d["@graph"])) {
        for (const node of d["@graph"]) {
          if (node && typeof node === "object") pushType(node as Record<string, unknown>);
        }
      } else { pushType(d); }
    }
  }
  return types;
}

test("FAQ MDX article exposes FAQPage and Article JSON-LD", async ({ page }) => {
  const res = await page.goto("/zh/guides/boundaries/faq-japanese-path");
  expect(res?.ok()).toBeTruthy();
  const types = await collectSchemaTypes(page);
  expect(types).toContain("FAQPage");
  expect(types).toContain("Article");
  expect(types).toContain("BreadcrumbList");
});
```

### 风格 D — API 健康检查

```typescript
test("session endpoint is reachable without auth", async ({ request }) => {
  const res = await request.get("/api/admin/session");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty("authenticated");
  expect(body.authenticated).toBe(false);
});
```

---

## 现有 E2E 覆盖情况

已有的 3 个 spec 文件覆盖了：
- zh / ja 首页可达
- /zh/guides 列表页 + 点击进入详情页
- trial / partner 表单字段可见性 + success 页面可达
- 3 篇特定文章的 JSON-LD schema type 检查
- Admin API 健康检查（login 拒绝错误密码、session 未认证状态）

## 页面路由清单

| 路由 | 描述 |
|------|------|
| `/:locale` | 首页 |
| `/:locale/guides` | 内容总览（文章列表） |
| `/:locale/guides/:category` | 分类页（problems / paths / boundaries / cases） |
| `/:locale/guides/:category/:slug` | 文章详情页 |
| `/:locale/trial` | Trial 表单页 |
| `/:locale/trial/success` | Trial 提交成功页 |
| `/:locale/partner` | Partner 表单页 |
| `/:locale/partner/success` | Partner 提交成功页 |
| `/:locale/faq` | FAQ 页面（手风琴式 Q&A） |
| `/:locale/admin/login` | Admin 登录页 |
| `/:locale/admin/geo-audit` | GEO 审计 Dashboard |
| `/:locale/admin/geo-audit/*` | 审计后台子页面（约 10 个） |

## 关键交互组件

### LanguageSwitcher（语言切换按钮）

位于 Header 右侧，点击后在 zh ↔ ja 之间切换。实现方式是调用 `router.replace(pathname, { locale: targetLocale })`。

```typescript
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common.lang");
  const targetLocale = locale === "zh" ? "ja" : "zh";
  const label = locale === "zh" ? t("ja") : t("zh");

  function handleSwitch() {
    router.replace(pathname, { locale: targetLocale });
  }

  return (
    <button onClick={handleSwitch} title={t("switch")}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
      <svg ...>...</svg>
      {label}
    </button>
  );
}
```

### Header 导航

桌面端有 5 个导航项：home、trial、partner、guides、faq。移动端有汉堡菜单按钮（`aria-label="Toggle menu"`）。

```typescript
const navItems = [
  { key: "home", href: "/" },
  { key: "trial", href: "/trial" },
  { key: "partner", href: "/partner" },
  { key: "guides", href: "/guides" },
  { key: "faq", href: "/faq" },
] as const;
```

### TrialForm（Trial 表单）

字段：name（必填）、contact（必填）、current_status（下拉）、main_concern（文本域）、goal（文本域）、willing_followup（单选）、source_note
提交到 `/api/trial`，成功后跳转 `/trial/success`
429 → 显示 "太多请求" 错误；非 ok → 显示 "提交失败" 错误

```typescript
// 表单 HTML 选择器
'form input[name="name"]'
'form input[name="contact"]'
'form select[name="current_status"]'
'form textarea[name="main_concern"]'
'form textarea[name="goal"]'
'form input[name="willing_followup"]'
'form input[name="source_note"]'
'form button[type="submit"]'
```

### PartnerForm（Partner 表单）

字段：org_name（必填）、contact_person（必填）、contact_method（必填）、org_type（下拉）、cooperation_interest（文本域）
提交到 `/api/partner`，成功后跳转 `/partner/success`

```typescript
// 表单 HTML 选择器
'form input[name="org_name"]'
'form input[name="contact_person"]'
'form input[name="contact_method"]'
'form select[name="org_type"]'
'form textarea[name="cooperation_interest"]'
'form button[type="submit"]'
```

### FAQ 页面

使用 `FAQQuestionGroup` 组件渲染分组的 Q&A，有 FAQPage JSON-LD schema。
zh 标题：`常见问题与服务边界`
ja 标题：`対応範囲とよくある質問`

---

## 需要你编写的测试文件

请创建以下 4 个新的 spec 文件：

### 文件 1: `tests/e2e/form-submission.spec.ts`

**测试 trial 和 partner 表单的完整提交流程**

测试用例：

```
describe("Trial form submission flow")

  test("zh trial form submits successfully and redirects to success page")
  → 访问 /zh/trial
  → 填写 name 和 contact（必填字段）
  → 点击 submit 按钮
  → 等待 API 响应（可以 mock 或使用真实 dev server）
  → 断言 URL 变为 /zh/trial/success
  → 断言成功页面有 h1

  test("trial form shows validation when required fields are empty")
  → 访问 /zh/trial
  → 直接点击 submit（不填写任何字段）
  → 断言 HTML5 required 校验触发（name 字段获得 :invalid 伪类）
  → 断言页面 URL 没有变化（没有跳转）

  test("ja partner form submits successfully and redirects to success page")
  → 访问 /ja/partner
  → 填写 org_name、contact_person、contact_method（必填字段）
  → 点击 submit 按钮
  → 断言 URL 变为 /ja/partner/success
  → 断言成功页面有 h1
```

**重要注意事项**:
- 表单提交会 POST 到 `/api/trial` 或 `/api/partner`，在 dev server 环境下如果没有配置数据库，API 会返回 503
- 你可以使用 `page.route()` 来拦截 API 请求并 mock 返回 `{ success: true }`：
```typescript
await page.route("**/api/trial", (route) => {
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
});
```
- 填写字段用 `page.locator('input[name="name"]').fill("测试用户")`
- 点击提交用 `page.locator('button[type="submit"]').click()`
- 等待跳转用 `await page.waitForURL("**/trial/success")`

---

### 文件 2: `tests/e2e/language-switcher.spec.ts`

**测试语言切换功能**

测试用例：

```
describe("Language switching")

  test("switching language on home page changes URL and content")
  → 访问 /zh
  → 确认页面语言为中文（可以检查 html[lang] 或页面内容中包含中文特征文本）
  → 找到语言切换按钮（header 中包含 svg 图标的 button）
  → 点击语言切换按钮
  → 等待 URL 变为 /ja
  → 确认页面语言已变为日文

  test("switching language on guides page preserves path")
  → 访问 /zh/guides
  → 点击语言切换按钮
  → 等待 URL 变为 /ja/guides（路径保留，只有 locale 变化）
  → 确认页面内容为日文

  test("switching language on trial page preserves path")
  → 访问 /zh/trial
  → 点击语言切换按钮
  → 等待 URL 变为 /ja/trial
```

**定位语言切换按钮的方法**:
- 按钮有 `title` 属性（来自 `t("switch")`），但具体文案取决于 i18n 配置
- 更稳定的定位方式：使用按钮在 Header nav 中的位置，或者使用 svg 子元素特征
- 建议用 `page.locator('header button').filter({ has: page.locator('svg') })` 或类似策略
- 也可以用 `page.getByRole('button')` 配合内容过滤

---

### 文件 3: `tests/e2e/navigation.spec.ts`

**测试导航结构**

测试用例：

```
describe("Desktop navigation")

  test("header contains all main navigation links")
  → 访问 /zh
  → 断言 header 中包含指向 /zh/trial、/zh/partner、/zh/guides、/zh/faq 的链接
  → （导航项的文案由 i18n 控制，不要硬编码文案，用 href 匹配）

  test("clicking guides link navigates to guides page")
  → 访问 /zh
  → 点击 header 中 href 包含 "/guides" 的链接
  → 断言 URL 变为 /zh/guides
  → 断言页面有 h1

  test("category pages are reachable")
  → 对 4 个分类 ["problems", "paths", "boundaries", "cases"] 各访问一次
  → 如 /zh/guides/problems、/zh/guides/paths 等
  → 断言每个页面返回 200 且有 h1

describe("FAQ page")

  test("faq page is reachable and has structured data")
  → 访问 /zh/faq
  → 断言页面返回 200
  → 断言 h1 包含 "常见问题" 或 "服务边界"
  → 使用 collectSchemaTypes 检查包含 "FAQPage" 和 "BreadcrumbList"

  test("ja faq page is reachable")
  → 访问 /ja/faq
  → 断言页面返回 200
  → 断言 h1 包含 "対応範囲" 或 "よくある質問"

describe("Mobile navigation")

  test("mobile hamburger menu opens and shows navigation links")
  → 设置移动视口：await page.setViewportSize({ width: 375, height: 812 })
  → 访问 /zh
  → 断言桌面导航不可见（hidden md:flex 的 nav）
  → 点击汉堡菜单按钮（aria-label="Toggle menu"）
  → 断言移动导航菜单中的链接可见
```

**`collectSchemaTypes` 辅助函数**: 请从上面"风格 C"章节复制完整的 `collectSchemaTypes` 函数，或者抽取到一个共享文件 `tests/e2e/helpers.ts` 中，然后在需要的 spec 文件中导入。

---

### 文件 4: `tests/e2e/seo-metadata.spec.ts`

**测试 SEO 元数据和双语一致性**

测试用例：

```
describe("SEO metadata")

  test("home page has correct meta tags for zh")
  → 访问 /zh
  → 断言 document.title 包含 "kibouFlow"
  → 断言 meta[name="description"] 有内容且非空
  → 断言 link[rel="canonical"] 存在

  test("home page has correct meta tags for ja")
  → 访问 /ja
  → 同上

  test("article page has og:title and og:description")
  → 访问 /zh/guides/boundaries/faq-japanese-path
  → 断言 meta[property="og:title"] 存在且非空
  → 断言 meta[property="og:description"] 存在且非空

  test("hreflang alternates are present on guides page")
  → 访问 /zh/guides
  → 断言 link[hreflang="zh"] 存在
  → 断言 link[hreflang="ja"] 存在
  → 断言 link[hreflang="x-default"] 存在

describe("Bilingual content parity")

  test("all four category pages are reachable in both locales")
  → 对 ["problems", "paths", "boundaries", "cases"] × ["zh", "ja"] 共 8 个组合
  → 访问每个 /:locale/guides/:category
  → 断言全部返回 200
```

**获取 meta 标签内容的方法**:
```typescript
const desc = await page.locator('meta[name="description"]').getAttribute("content");
expect(desc).toBeTruthy();

const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
expect(ogTitle).toBeTruthy();

const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute("href");
expect(canonicalHref).toBeTruthy();

const hreflangZh = await page.locator('link[hreflang="zh"]').getAttribute("href");
expect(hreflangZh).toBeTruthy();
```

---

## 输出格式

请按以下格式输出 **4 个完整的 spec 文件**，每个用 markdown 代码块包裹：

```
### tests/e2e/xxx.spec.ts

\`\`\`typescript
// 完整测试代码
\`\`\`
```

如果需要共享辅助函数（如 `collectSchemaTypes`），也输出一个辅助文件：

```
### tests/e2e/helpers.ts

\`\`\`typescript
// 辅助函数
\`\`\`
```

## 质量要求

1. 每个 spec 文件必须能在 `npx playwright test tests/e2e/xxx.spec.ts` 下独立运行
2. 使用 `@playwright/test` 的 `test` 和 `expect`，不要用 `describe`（Playwright 用 `test.describe`）
3. 不要引入项目中不存在的依赖
4. 选择器要稳定——优先用 `[name="xxx"]`、`[href*="xxx"]`、`[aria-label="xxx"]`、`role` 等语义化选择器，避免用 CSS 类名
5. 表单提交测试使用 `page.route()` mock API 响应，避免依赖真实数据库
6. 不要硬编码 i18n 文案（可能会变），优先用 HTML 属性和 URL 来断言
7. 测试用例描述用英文
8. 每个测试保持独立，不依赖其他测试的执行顺序
9. 使用 `await page.waitForURL()` 等待导航完成，不要用固定的 `setTimeout`
10. 移动端测试使用 `page.setViewportSize()` 而不是创建新的 project
