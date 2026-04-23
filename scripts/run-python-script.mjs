#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const [scriptArg, ...scriptArgs] = process.argv.slice(2);

if (!scriptArg) {
  console.error("Usage: node scripts/run-python-script.mjs <script.py> [args...]");
  process.exit(2);
}

const scriptPath = path.resolve(ROOT, scriptArg);
if (!fs.existsSync(scriptPath)) {
  console.error(`Python harness failed: script not found: ${path.relative(ROOT, scriptPath)}`);
  process.exit(2);
}

const candidates =
  process.platform === "win32"
    ? [
        { command: "py", prefixArgs: ["-3"] },
        { command: "python", prefixArgs: [] },
        { command: "python3", prefixArgs: [] },
      ]
    : [
        { command: "python3", prefixArgs: [] },
        { command: "python", prefixArgs: [] },
      ];

for (const candidate of candidates) {
  const result = spawnSync(
    candidate.command,
    [...candidate.prefixArgs, scriptPath, ...scriptArgs],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    },
  );

  if (result.error?.code === "ENOENT") {
    continue;
  }

  if (result.error) {
    console.error(
      `Python harness failed while running ${candidate.command}: ${result.error.message}`,
    );
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

console.error(
  "Python harness failed: no usable Python interpreter found. Tried py -3, python, and python3.",
);
process.exit(1);
