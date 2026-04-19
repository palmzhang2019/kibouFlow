"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { GeoAuditMarkdown } from "@/components/admin/GeoAuditMarkdown";

type RunState = "idle" | "running" | "success" | "failed";

type RunResponse = {
  ok: boolean;
  id: string | null;
  persisted: boolean;
  issues_inserted?: number;
  exitCode: number | null;
  markdown: string;
  json: unknown;
  issues?: { code: string; title: string; severity: string; layer: string }[];
  stderr: string;
  command: string[];
  error?: string;
  used_llm?: boolean;
  llm_model?: string | null;
  script_version?: string | null;
  target_path?: string | null;
  overall_score?: number | null;
};

export function GeoAuditRunner() {
  const router = useRouter();
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);

  const runAudit = async () => {
    setRunState("running");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/geo-audit/run", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as RunResponse & { error?: string };
      if (res.status === 401) {
        setError("未登录或会话已过期，请重新登录。");
        setRunState("idle");
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `请求失败（HTTP ${res.status}）`);
        setResult({
          ok: data.ok ?? false,
          id: data.id ?? null,
          persisted: data.persisted ?? false,
          issues_inserted: typeof data.issues_inserted === "number" ? data.issues_inserted : undefined,
          exitCode: data.exitCode ?? null,
          markdown: data.markdown ?? "",
          json: data.json ?? null,
          issues: Array.isArray(data.issues) ? data.issues : undefined,
          stderr: data.stderr ?? "",
          command: data.command ?? [],
          used_llm: data.used_llm,
          llm_model: data.llm_model,
          script_version: data.script_version,
          target_path: data.target_path,
          overall_score: data.overall_score,
        });
        setRunState(data.ok ? "success" : "failed");
        return;
      }
      setResult({
        ok: data.ok,
        id: data.id ?? null,
        persisted: data.persisted ?? false,
        issues_inserted: typeof data.issues_inserted === "number" ? data.issues_inserted : undefined,
        exitCode: data.exitCode,
        markdown: data.markdown,
        json: data.json,
        issues: Array.isArray(data.issues) ? data.issues : undefined,
        stderr: data.stderr,
        command: data.command,
        used_llm: data.used_llm,
        llm_model: data.llm_model,
        script_version: data.script_version,
        target_path: data.target_path,
        overall_score: data.overall_score,
      });
      setRunState(data.ok ? "success" : "failed");
    } catch {
      setError("网络错误，请稍后重试。");
      setRunState("idle");
    }
  };

  const statusLabel =
    runState === "idle"
      ? "未运行"
      : runState === "running"
        ? "运行中"
        : runState === "success"
          ? "运行成功"
          : "运行失败";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">运行 GEO 体检</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          在服务器上执行 <code className="text-xs">scripts/geo_principles_audit.py</code>（需 Python；Docker
          镜像已包含脚本与 content/src/docs）。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={runState === "running"}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          onClick={() => void runAudit()}
        >
          {runState === "running" ? "运行中…" : "运行 GEO 体检"}
        </button>
        <span className="text-sm text-muted-foreground">
          状态：<span className="font-medium text-foreground">{statusLabel}</span>
        </span>
        {result?.id ? (
          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={() => router.push(`/admin/geo-audit/history/${result.id}`)}
          >
            查看本次记录
          </button>
        ) : null}
      </div>

      {!result?.persisted && result?.ok ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          本次结果未入库：请确认服务端已配置{" "}
          <code className="rounded bg-muted px-1">DATABASE_URL</code>（PostgreSQL 连接串），修改{" "}
          <code className="rounded bg-muted px-1">.env.local</code> 后需重启进程；并确认已在该库按序执行{" "}
          <code className="rounded bg-muted px-1">supabase/migrations/</code> 下全部 SQL 完成建表。
        </p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>退出码: {result.exitCode ?? "—"}</span>
            {result.overall_score != null ? <span>总分: {result.overall_score}</span> : null}
            {result.issues ? <span>结构化问题: {result.issues.length} 条</span> : null}
            {result.persisted && result.ok && result.issues_inserted != null ? (
              <span>已写入 geo_audit_issues: {result.issues_inserted} 行</span>
            ) : null}
            <span>LLM: {result.used_llm ? `是（${result.llm_model ?? "—"}）` : "否"}</span>
            {result.script_version ? <span>脚本: {result.script_version}</span> : null}
            <span className={result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
              {result.ok ? "成功" : "失败"}
            </span>
          </div>
          {result.stderr ? (
            <pre
              className={
                result.ok
                  ? "max-h-40 overflow-auto rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground"
                  : "max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-red-800 dark:text-red-200"
              }
            >
              {result.stderr}
            </pre>
          ) : null}

          <section>
            <h3 className="mb-3 text-sm font-medium">最新报告（渲染）</h3>
            <div className="rounded-lg border border-border bg-background p-4">
              <GeoAuditMarkdown markdown={result.markdown || "（无 Markdown 输出）"} />
            </div>
          </section>

          <details className="rounded-lg border border-border">
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium">原始 Markdown</summary>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap border-t border-border p-4 text-xs leading-relaxed">
              {result.markdown}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
