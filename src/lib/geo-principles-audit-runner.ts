import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export interface PrinciplesAuditJson {
  scores?: Record<string, number>;
  facts?: Record<string, unknown>;
  used_llm?: boolean;
  llm_model?: string | null;
  script_version?: string | null;
  target_path?: string | null;
}

export interface PrinciplesAuditResult {
  ok: boolean;
  exitCode: number | null;
  markdown: string;
  json: PrinciplesAuditJson | null;
  stderr: string;
  command: string[];
}

function pickPythonBinary(): string {
  if (process.env.GEO_AUDIT_PYTHON?.trim()) return process.env.GEO_AUDIT_PYTHON.trim();
  return process.platform === "win32" ? "python" : "python3";
}

function splitStdout(stdout: string): { markdown: string; json: PrinciplesAuditResult["json"] } {
  const sep = "\n--- JSON ---\n";
  const idx = stdout.indexOf(sep);
  if (idx === -1) {
    return { markdown: stdout.trimEnd(), json: null };
  }
  const md = stdout.slice(0, idx).trimEnd();
  const jsonPart = stdout.slice(idx + sep.length).trim();
  try {
    return { markdown: md, json: JSON.parse(jsonPart) as PrinciplesAuditJson };
  } catch {
    return { markdown: md, json: null };
  }
}

/**
 * 在进程 cwd（应为仓库根）下执行 `scripts/geo_principles_audit.py --json`。
 */
export async function runGeoPrinciplesAuditScript(): Promise<PrinciplesAuditResult> {
  const root = process.cwd();
  const script = path.join(root, "scripts", "geo_principles_audit.py");
  const py = pickPythonBinary();
  const args = [script, "--json"];

  if (process.env.GEO_AUDIT_SKIP === "1") {
    return {
      ok: true,
      exitCode: 0,
      markdown: "（已跳过：`GEO_AUDIT_SKIP=1`）",
      json: {
        scores: {},
        facts: {},
        used_llm: false,
        script_version: "skip",
        target_path: process.cwd(),
      },
      stderr: "",
      command: [py, ...args],
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(py, args, {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024,
      timeout: 90_000,
      windowsHide: true,
      encoding: "utf8",
    });
    const { markdown, json } = splitStdout(stdout);
    return {
      ok: true,
      exitCode: 0,
      markdown,
      json,
      stderr: stderr ?? "",
      command: [py, ...args],
    };
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException & {
      code?: string;
      status?: number;
      stdout?: string;
      stderr?: string;
    };
    const stdout = typeof err.stdout === "string" ? err.stdout : "";
    const { markdown, json } = splitStdout(stdout);
    return {
      ok: false,
      exitCode: typeof err.status === "number" ? err.status : null,
      markdown: markdown || stdout || "(无输出)",
      json,
      stderr: [err.stderr, err.message].filter(Boolean).join("\n"),
      command: [py, ...args],
    };
  }
}
