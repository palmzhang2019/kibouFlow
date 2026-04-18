"use client";

import { useMemo, useState } from "react";

type SiteForm = {
  site_name: string;
  default_title_template: string;
  default_description: string;
  default_locale: "zh" | "ja";
  site_url: string;
  robots_policy: string;
};

type PageForm = {
  locale: "zh" | "ja";
  path: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  noindex: boolean;
  jsonld_overrides: string;
};

type RulesForm = {
  locale: "zh" | "ja";
  faq_exclude_heading_patterns: string;
  faq_min_items: number;
  howto_section_patterns: string;
  howto_min_steps: number;
  article_abstract_from_tldr: boolean;
};

type ToggleForm = {
  locale: "zh" | "ja";
  path: string;
  enable_article: boolean;
  enable_faqpage: boolean;
  enable_howto: boolean;
  enable_breadcrumb: boolean;
  enable_website: boolean;
};

type RoleForm = {
  user_id: string;
  role: "admin" | "editor" | "reviewer";
};

const defaultSite: SiteForm = {
  site_name: "GEO",
  default_title_template: "%s | GEO",
  default_description: "先整理希望，再判断路径，再导向下一步",
  default_locale: "zh",
  site_url: "https://kibouflow.com",
  robots_policy: "",
};

const defaultPage: PageForm = {
  locale: "zh",
  path: "/zh",
  meta_title: "",
  meta_description: "",
  canonical_url: "",
  og_title: "",
  og_description: "",
  og_image: "",
  noindex: false,
  jsonld_overrides: "{}",
};

const defaultRules: RulesForm = {
  locale: "zh",
  faq_exclude_heading_patterns: "[]",
  faq_min_items: 2,
  howto_section_patterns: "[]",
  howto_min_steps: 2,
  article_abstract_from_tldr: false,
};

const defaultToggles: ToggleForm = {
  locale: "zh",
  path: "/zh",
  enable_article: true,
  enable_faqpage: true,
  enable_howto: true,
  enable_breadcrumb: true,
  enable_website: true,
};

export function GeoSettingsMvp() {
  const [site, setSite] = useState<SiteForm>(defaultSite);
  const [page, setPage] = useState<PageForm>(defaultPage);
  const [rules, setRules] = useState<RulesForm>(defaultRules);
  const [toggles, setToggles] = useState<ToggleForm>(defaultToggles);
  const [previewMarkdown, setPreviewMarkdown] = useState("## 问题\n答案\n\n## 推荐阅读顺序\n1. 第一步");
  const [previewResult, setPreviewResult] = useState("{}");
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [roleForm, setRoleForm] = useState<RoleForm>({ user_id: "", role: "editor" });
  const [publishPayload, setPublishPayload] = useState(
    '{"scope":"rules","locale":"zh","draft_json":{"locale":"zh","faq_min_items":2},"status":"pending"}',
  );
  const [reviewRequestId, setReviewRequestId] = useState("");
  const [healthResult, setHealthResult] = useState("{}");
  const [auditResult, setAuditResult] = useState("{}");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const pagePreview = useMemo(() => {
    try {
      const parsed = JSON.parse(page.jsonld_overrides || "{}");
      return JSON.stringify(
        {
          locale: page.locale,
          path: page.path,
          title: page.meta_title || site.default_title_template.replace("%s", site.site_name),
          description: page.meta_description || site.default_description,
          canonical: page.canonical_url || page.path,
          noindex: page.noindex,
          jsonld_overrides: parsed,
        },
        null,
        2,
      );
    } catch {
      return JSON.stringify(
        {
          error: "jsonld_overrides 不是合法 JSON",
        },
        null,
        2,
      );
    }
  }, [page, site]);

  async function loadSiteSettings() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/geo/site-settings");
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "加载站点配置失败");
      setLoading(false);
      return;
    }
    if (json.data) {
      setSite({
        site_name: json.data.site_name,
        default_title_template: json.data.default_title_template,
        default_description: json.data.default_description,
        default_locale: json.data.default_locale,
        site_url: json.data.site_url,
        robots_policy: json.data.robots_policy ?? "",
      });
    }
    setLoading(false);
  }

  async function saveSiteSettings() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/geo/site-settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(site),
    });
    const json = await res.json();
    setMessage(res.ok ? "站点配置已保存" : json.error ?? "站点配置保存失败");
    setLoading(false);
  }

  async function loadPageSettings() {
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams({ locale: page.locale, path: page.path });
    const res = await fetch(`/api/admin/geo/page-settings?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "加载页面配置失败");
      setLoading(false);
      return;
    }
    if (json.data) {
      setPage((prev) => ({
        ...prev,
        ...json.data,
        jsonld_overrides: JSON.stringify(json.data.jsonld_overrides ?? {}, null, 2),
      }));
    }
    setMessage(json.source === "none" ? "未命中配置，显示空配置" : "页面配置已加载");
    setLoading(false);
  }

  async function savePageSettings() {
    setLoading(true);
    setMessage("");
    let overrides = {};
    try {
      overrides = JSON.parse(page.jsonld_overrides || "{}");
    } catch {
      setMessage("jsonld_overrides 不是合法 JSON");
      setLoading(false);
      return;
    }

    const payload = {
      ...page,
      jsonld_overrides: overrides,
    };
    const res = await fetch("/api/admin/geo/page-settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setMessage(res.ok ? "页面配置已保存" : json.error ?? "页面配置保存失败");
    setLoading(false);
  }

  async function loadRules() {
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams({ locale: rules.locale });
    const res = await fetch(`/api/admin/geo/rules?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "加载规则失败");
      setLoading(false);
      return;
    }
    setRules({
      locale: json.data.locale,
      faq_exclude_heading_patterns: JSON.stringify(
        json.data.faq_exclude_heading_patterns ?? [],
        null,
        2,
      ),
      faq_min_items: json.data.faq_min_items ?? 2,
      howto_section_patterns: JSON.stringify(json.data.howto_section_patterns ?? [], null, 2),
      howto_min_steps: json.data.howto_min_steps ?? 2,
      article_abstract_from_tldr: !!json.data.article_abstract_from_tldr,
    });
    setMessage(json.source === "none" ? "未命中规则，显示默认值" : "规则已加载");
    setLoading(false);
  }

  async function saveRules() {
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        locale: rules.locale,
        faq_exclude_heading_patterns: JSON.parse(rules.faq_exclude_heading_patterns || "[]"),
        faq_min_items: Number(rules.faq_min_items),
        howto_section_patterns: JSON.parse(rules.howto_section_patterns || "[]"),
        howto_min_steps: Number(rules.howto_min_steps),
        article_abstract_from_tldr: rules.article_abstract_from_tldr,
      };
      const res = await fetch("/api/admin/geo/rules", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setMessage(res.ok ? "规则已保存" : json.error ?? "规则保存失败");
    } catch {
      setMessage("规则 JSON 格式不合法");
    } finally {
      setLoading(false);
    }
  }

  async function loadSchemaToggles() {
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams({ locale: toggles.locale, path: toggles.path });
    const res = await fetch(`/api/admin/geo/schema-toggles?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "加载开关失败");
      setLoading(false);
      return;
    }
    setToggles({
      locale: json.data.locale,
      path: json.data.path,
      enable_article: !!json.data.enable_article,
      enable_faqpage: !!json.data.enable_faqpage,
      enable_howto: !!json.data.enable_howto,
      enable_breadcrumb: !!json.data.enable_breadcrumb,
      enable_website: !!json.data.enable_website,
    });
    setMessage(json.source === "none" ? "未命中开关配置，显示默认全开" : "开关已加载");
    setLoading(false);
  }

  async function saveSchemaToggles() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/geo/schema-toggles", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toggles),
    });
    const json = await res.json();
    setMessage(res.ok ? "开关已保存" : json.error ?? "开关保存失败");
    setLoading(false);
  }

  async function previewRules() {
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        locale: rules.locale,
        markdown: previewMarkdown,
        ruleOverrides: {
          locale: rules.locale,
          faq_exclude_heading_patterns: JSON.parse(rules.faq_exclude_heading_patterns || "[]"),
          faq_min_items: Number(rules.faq_min_items),
          howto_section_patterns: JSON.parse(rules.howto_section_patterns || "[]"),
          howto_min_steps: Number(rules.howto_min_steps),
          article_abstract_from_tldr: rules.article_abstract_from_tldr,
        },
      };
      const res = await fetch("/api/admin/geo/rules/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "预览失败");
      } else {
        setPreviewResult(JSON.stringify(json, null, 2));
        setMessage("预览成功");
      }
    } catch {
      setMessage("预览参数格式错误");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    const res = await fetch("/api/admin/geo/rules/logs?limit=20");
    const json = await res.json();
    setLogs(json.data ?? []);
  }

  async function rollbackByLogId(logId: string) {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/geo/rules/rollback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ log_id: logId }),
    });
    const json = await res.json();
    setMessage(res.ok ? "回滚成功" : json.error ?? "回滚失败");
    setLoading(false);
    await loadLogs();
  }

  async function saveRoleBinding() {
    const res = await fetch("/api/admin/geo/role-bindings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(roleForm),
    });
    const json = await res.json();
    setMessage(res.ok ? "角色绑定已保存" : json.error ?? "角色绑定失败");
  }

  async function createPublishRequest() {
    try {
      const payload = JSON.parse(publishPayload);
      const res = await fetch("/api/admin/geo/publish-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setMessage(res.ok ? "提审请求已创建" : json.error ?? "提审请求失败");
    } catch {
      setMessage("提审 JSON 格式错误");
    }
  }

  async function approveRequest() {
    const res = await fetch(`/api/admin/geo/publish-requests/${reviewRequestId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "published", review_comment: "ok" }),
    });
    const json = await res.json();
    setMessage(res.ok ? "审核完成" : json.error ?? "审核失败");
  }

  async function publishRequest(emergency = false) {
    const res = await fetch(`/api/admin/geo/publish-requests/${reviewRequestId}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emergency, reason: emergency ? "hotfix" : undefined }),
    });
    const json = await res.json();
    setMessage(res.ok ? "发布完成" : json.error ?? "发布失败");
  }

  async function loadHealth() {
    const res = await fetch("/api/admin/geo/health?locale=zh&window=7");
    const json = await res.json();
    setHealthResult(JSON.stringify(json, null, 2));
  }

  async function loadAudit() {
    const res = await fetch("/api/admin/geo/audit-logs");
    const json = await res.json();
    setAuditResult(JSON.stringify(json, null, 2));
  }

  async function exportSnapshot(format: "json" | "csv") {
    const res = await fetch(`/api/admin/geo/export?format=${format}&days=90`);
    if (format === "json") {
      const json = await res.json();
      setAuditResult(JSON.stringify(json, null, 2));
    } else {
      const text = await res.text();
      setAuditResult(text.slice(0, 2000));
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">GEO 配置中心（MVP）</h1>
      <p className="text-sm text-muted">
        覆盖优先级：page config &gt; site default &gt; existing code default
      </p>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">站点配置</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="border rounded px-3 py-2"
            value={site.site_name}
            onChange={(e) => setSite((v) => ({ ...v, site_name: e.target.value }))}
            placeholder="site_name"
          />
          <input
            className="border rounded px-3 py-2"
            value={site.default_title_template}
            onChange={(e) =>
              setSite((v) => ({ ...v, default_title_template: e.target.value }))
            }
            placeholder="default_title_template"
          />
          <input
            className="border rounded px-3 py-2 sm:col-span-2"
            value={site.default_description}
            onChange={(e) => setSite((v) => ({ ...v, default_description: e.target.value }))}
            placeholder="default_description"
          />
          <input
            className="border rounded px-3 py-2 sm:col-span-2"
            value={site.site_url}
            onChange={(e) => setSite((v) => ({ ...v, site_url: e.target.value }))}
            placeholder="site_url"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={loadSiteSettings}
            disabled={loading}
          >
            加载站点配置
          </button>
          <button
            type="button"
            className="bg-black text-white rounded px-3 py-2"
            onClick={saveSiteSettings}
            disabled={loading}
          >
            保存站点配置
          </button>
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">页面配置</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="border rounded px-3 py-2"
            value={page.locale}
            onChange={(e) =>
              setPage((v) => ({ ...v, locale: e.target.value as "zh" | "ja" }))
            }
          >
            <option value="zh">zh</option>
            <option value="ja">ja</option>
          </select>
          <input
            className="border rounded px-3 py-2"
            value={page.path}
            onChange={(e) => setPage((v) => ({ ...v, path: e.target.value }))}
            placeholder="/zh/guides/..."
          />
          <input
            className="border rounded px-3 py-2 sm:col-span-2"
            value={page.meta_title}
            onChange={(e) => setPage((v) => ({ ...v, meta_title: e.target.value }))}
            placeholder="meta_title"
          />
          <input
            className="border rounded px-3 py-2 sm:col-span-2"
            value={page.meta_description}
            onChange={(e) => setPage((v) => ({ ...v, meta_description: e.target.value }))}
            placeholder="meta_description"
          />
          <input
            className="border rounded px-3 py-2 sm:col-span-2"
            value={page.canonical_url}
            onChange={(e) => setPage((v) => ({ ...v, canonical_url: e.target.value }))}
            placeholder="canonical_url"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={page.noindex}
              onChange={(e) => setPage((v) => ({ ...v, noindex: e.target.checked }))}
            />
            noindex
          </label>
          <textarea
            className="border rounded px-3 py-2 sm:col-span-2 min-h-28"
            value={page.jsonld_overrides}
            onChange={(e) => setPage((v) => ({ ...v, jsonld_overrides: e.target.value }))}
            placeholder='{"@type":"Article"}'
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={loadPageSettings}
            disabled={loading}
          >
            查询页面配置
          </button>
          <button
            type="button"
            className="bg-black text-white rounded px-3 py-2"
            onClick={savePageSettings}
            disabled={loading}
          >
            保存页面配置
          </button>
        </div>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">JSON 预览</h2>
        <pre className="text-xs overflow-auto bg-gray-50 rounded p-3">{pagePreview}</pre>
      </section>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">规则配置（Phase 2）</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="border rounded px-3 py-2"
            value={rules.locale}
            onChange={(e) => setRules((v) => ({ ...v, locale: e.target.value as "zh" | "ja" }))}
          >
            <option value="zh">zh</option>
            <option value="ja">ja</option>
          </select>
          <input
            className="border rounded px-3 py-2"
            type="number"
            value={rules.faq_min_items}
            onChange={(e) => setRules((v) => ({ ...v, faq_min_items: Number(e.target.value) }))}
            placeholder="faq_min_items"
          />
          <textarea
            className="border rounded px-3 py-2 sm:col-span-2 min-h-24"
            value={rules.faq_exclude_heading_patterns}
            onChange={(e) =>
              setRules((v) => ({ ...v, faq_exclude_heading_patterns: e.target.value }))
            }
            placeholder='["推荐阅读顺序"]'
          />
          <input
            className="border rounded px-3 py-2"
            type="number"
            value={rules.howto_min_steps}
            onChange={(e) => setRules((v) => ({ ...v, howto_min_steps: Number(e.target.value) }))}
            placeholder="howto_min_steps"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rules.article_abstract_from_tldr}
              onChange={(e) =>
                setRules((v) => ({ ...v, article_abstract_from_tldr: e.target.checked }))
              }
            />
            article_abstract_from_tldr
          </label>
          <textarea
            className="border rounded px-3 py-2 sm:col-span-2 min-h-24"
            value={rules.howto_section_patterns}
            onChange={(e) =>
              setRules((v) => ({ ...v, howto_section_patterns: e.target.value }))
            }
            placeholder='["判断框架","おすすめ"]'
          />
        </div>
        <div className="flex gap-3">
          <button className="border rounded px-3 py-2" type="button" onClick={loadRules}>
            加载规则
          </button>
          <button className="bg-black text-white rounded px-3 py-2" type="button" onClick={saveRules}>
            保存规则
          </button>
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">页面 Schema 开关（Phase 2）</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="border rounded px-3 py-2"
            value={toggles.locale}
            onChange={(e) =>
              setToggles((v) => ({ ...v, locale: e.target.value as "zh" | "ja" }))
            }
          >
            <option value="zh">zh</option>
            <option value="ja">ja</option>
          </select>
          <input
            className="border rounded px-3 py-2"
            value={toggles.path}
            onChange={(e) => setToggles((v) => ({ ...v, path: e.target.value }))}
            placeholder="/zh/guides/..."
          />
          {(
            [
              "enable_article",
              "enable_faqpage",
              "enable_howto",
              "enable_breadcrumb",
              "enable_website",
            ] as const
          ).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={toggles[key]}
                onChange={(e) => setToggles((v) => ({ ...v, [key]: e.target.checked }))}
              />
              {key}
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="border rounded px-3 py-2" type="button" onClick={loadSchemaToggles}>
            查询开关
          </button>
          <button
            className="bg-black text-white rounded px-3 py-2"
            type="button"
            onClick={saveSchemaToggles}
          >
            保存开关
          </button>
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">规则预览</h2>
        <textarea
          className="border rounded px-3 py-2 w-full min-h-36"
          value={previewMarkdown}
          onChange={(e) => setPreviewMarkdown(e.target.value)}
        />
        <div className="flex gap-3">
          <button className="bg-black text-white rounded px-3 py-2" type="button" onClick={previewRules}>
            运行预览
          </button>
        </div>
        <pre className="text-xs overflow-auto bg-gray-50 rounded p-3">{previewResult}</pre>
      </section>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">变更日志与回滚</h2>
        <button className="border rounded px-3 py-2" type="button" onClick={loadLogs}>
          刷新日志
        </button>
        <div className="space-y-2">
          {logs.map((log) => {
            const id = String(log.id ?? "");
            return (
              <div key={id} className="border rounded p-2 text-xs">
                <div>
                  {String(log.scope ?? "")} | {String(log.locale ?? "")} | {String(log.path ?? "")}
                </div>
                <div className="mt-1">{String(log.created_at ?? "")}</div>
                <button
                  className="mt-2 border rounded px-2 py-1"
                  type="button"
                  onClick={() => rollbackByLogId(id)}
                  disabled={!id || loading}
                >
                  回滚到该版本
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Phase 3 - 权限与审批</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="border rounded px-3 py-2"
            value={roleForm.user_id}
            onChange={(e) => setRoleForm((v) => ({ ...v, user_id: e.target.value }))}
            placeholder="user_id"
          />
          <select
            className="border rounded px-3 py-2"
            value={roleForm.role}
            onChange={(e) =>
              setRoleForm((v) => ({ ...v, role: e.target.value as RoleForm["role"] }))
            }
          >
            <option value="admin">admin</option>
            <option value="editor">editor</option>
            <option value="reviewer">reviewer</option>
          </select>
        </div>
        <button className="border rounded px-3 py-2" type="button" onClick={saveRoleBinding}>
          保存角色绑定
        </button>
        <textarea
          className="border rounded px-3 py-2 w-full min-h-24"
          value={publishPayload}
          onChange={(e) => setPublishPayload(e.target.value)}
        />
        <div className="flex gap-3">
          <button className="border rounded px-3 py-2" type="button" onClick={createPublishRequest}>
            创建提审请求
          </button>
          <input
            className="border rounded px-3 py-2"
            value={reviewRequestId}
            onChange={(e) => setReviewRequestId(e.target.value)}
            placeholder="request_id"
          />
          <button className="border rounded px-3 py-2" type="button" onClick={approveRequest}>
            审核通过
          </button>
          <button className="border rounded px-3 py-2" type="button" onClick={() => publishRequest(false)}>
            发布
          </button>
          <button className="border rounded px-3 py-2" type="button" onClick={() => publishRequest(true)}>
            紧急发布
          </button>
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4">
        <h2 className="font-semibold">Phase 3 - 健康看板与导出审计</h2>
        <div className="flex gap-3">
          <button className="border rounded px-3 py-2" type="button" onClick={loadHealth}>
            加载健康看板
          </button>
          <button className="border rounded px-3 py-2" type="button" onClick={loadAudit}>
            加载审计日志
          </button>
          <button className="border rounded px-3 py-2" type="button" onClick={() => exportSnapshot("json")}>
            导出 JSON
          </button>
          <button className="border rounded px-3 py-2" type="button" onClick={() => exportSnapshot("csv")}>
            导出 CSV
          </button>
        </div>
        <pre className="text-xs overflow-auto bg-gray-50 rounded p-3">{healthResult}</pre>
        <pre className="text-xs overflow-auto bg-gray-50 rounded p-3">{auditResult}</pre>
      </section>

      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
