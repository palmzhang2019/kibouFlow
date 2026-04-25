#!/usr/bin/env node

import { spawnSync } from "child_process";

const target = process.argv[2];

if (!target) {
  console.error("Usage: node scripts/run-harness-verify.mjs <target>");
  process.exit(2);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nextCommand =
  process.platform === "win32"
    ? ".\\node_modules\\.bin\\next.cmd"
    : "./node_modules/.bin/next";
const vitestCommand =
  process.platform === "win32"
    ? ".\\node_modules\\.bin\\vitest.cmd"
    : "./node_modules/.bin/vitest";

const tasks = {
  local: [
    { command: vitestCommand, args: ["run", "tests/unit"] },
    { command: vitestCommand, args: ["run", "tests/integration"] },
    { command: nextCommand, args: ["build"] },
  ],
  publish: [
    { command: process.execPath, args: ["scripts/content-harness-check.mjs"] },
    {
      command: vitestCommand,
      args: [
        "run",
        "tests/unit/content.test.ts",
        "tests/unit/article-jsonld.test.ts",
        "tests/unit/organization-jsonld.test.ts",
        "tests/unit/seo-site-url.test.ts",
        "tests/unit/sitemap.test.ts",
        "tests/integration/llms.route.test.ts",
        "tests/integration/robots.route.test.ts",
      ],
    },
    { command: nextCommand, args: ["build"] },
  ],
  flows: [{ command: npmCommand, args: ["run", "test:e2e", "--", "tests/e2e/core-flows.spec.ts"] }],
  "e2e:smoke": [
    { command: npmCommand, args: ["run", "test:e2e", "--", "tests/e2e/core-flows.spec.ts"] },
    { command: npmCommand, args: ["run", "test:e2e", "--", "tests/e2e/geo-phase3-health.spec.ts"] },
    { command: npmCommand, args: ["run", "test:e2e", "--", "tests/e2e/geo-rules-preview.spec.ts"] },
  ],
};

const selected = tasks[target];
if (!selected) {
  console.error(`Unknown harness verify target: ${target}`);
  process.exit(2);
}

function quoteArg(value) {
  if (!/[\s"]/u.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

for (const step of selected) {
  const isWindowsCmd = process.platform === "win32" && step.command.toLowerCase().endsWith(".cmd");
  const result = isWindowsCmd
    ? spawnSync(
        process.env.ComSpec || "cmd.exe",
        ["/d", "/s", "/c", `${quoteArg(step.command)} ${step.args.map(quoteArg).join(" ")}`],
        {
          cwd: process.cwd(),
          stdio: "inherit",
          shell: false,
          env: process.env,
        },
      )
    : spawnSync(step.command, step.args, {
        cwd: process.cwd(),
        stdio: "inherit",
        shell: false,
        env: process.env,
      });

  if (result.error) {
    console.error(`Harness verify step failed to start: ${step.command}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}
