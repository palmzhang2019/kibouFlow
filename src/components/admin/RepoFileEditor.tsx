"use client";

import { useCallback, useEffect, useState } from "react";

export function RepoFileEditor({
  fileKey,
  title,
  relativePath,
}: {
  fileKey: string;
  title: string;
  relativePath: string;
}) {
  const [content, setContent] = useState("");
  const [absolutePath, setAbsolutePath] = useState<string | null>(null);
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [loadMsg, setLoadMsg] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadMsg(null);
    try {
      const res = await fetch(`/api/admin/repo-files/${encodeURIComponent(fileKey)}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        content?: string;
        absolutePath?: string;
        writeEnabled?: boolean;
      };
      if (!res.ok) {
        setLoadMsg(data.error ?? `加载失败（${res.status}）`);
        setContent("");
        return;
      }
      setContent(data.content ?? "");
      setAbsolutePath(data.absolutePath ?? null);
      setWriteEnabled(Boolean(data.writeEnabled));
    } catch {
      setLoadMsg("网络错误");
    } finally {
      setLoading(false);
    }
  }, [fileKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/repo-files/${encodeURIComponent(fileKey)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveMsg(data.error ?? `保存失败（${res.status}）`);
        return;
      }
      setSaveMsg("已写入磁盘。请用 Git 查看 diff，并执行体检/单测验证。");
    } catch {
      setSaveMsg("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          仓库内路径 <code className="rounded bg-muted px-1">{relativePath}</code>
          {absolutePath ? (
            <>
              {" "}
              · 绝对路径 <code className="rounded bg-muted px-1 break-all">{absolutePath}</code>
            </>
          ) : null}
        </p>
        <p className="mt-2 text-xs text-amber-900 dark:text-amber-100">
          仅允许白名单内的少数文件。Serverless（如 Vercel）部署通常无法写盘——请在本地或自托管 Node
          环境使用；生产写盘需设置{" "}
          <code className="rounded bg-muted px-1">ADMIN_ENABLE_REPO_FILE_WRITE=true</code>。
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">加载中…</p>
      ) : loadMsg ? (
        <p className="text-sm text-red-700 dark:text-red-300">{loadMsg}</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="min-h-[480px] w-full rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving || !writeEnabled}
              onClick={() => void save()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存到磁盘"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void load()}
              className="rounded-md border border-border px-3 py-1.5 text-sm"
            >
              重新加载
            </button>
            {!writeEnabled ? (
              <span className="text-xs text-muted-foreground">当前环境禁止写入</span>
            ) : null}
          </div>
          {saveMsg ? <p className="text-sm text-muted-foreground">{saveMsg}</p> : null}
        </>
      )}
    </div>
  );
}
