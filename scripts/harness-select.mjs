#!/usr/bin/env node

import { createInterface } from "readline/promises";
import { spawnSync } from "child_process";
import { stdin as input, stdout as output } from "process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const OPTIONS = [
  {
    id: "1",
    label: "内容 / MDX / frontmatter",
    commands: [
      { cmd: npmCommand, args: ["run", "verify:content"] },
      { cmd: npmCommand, args: ["run", "audit:content:diff:strict"] },
    ],
  },
  {
    id: "2",
    label: "SEO/GEO 结构（sitemap / robots / llms / JSON-LD）",
    commands: [
      { cmd: npmCommand, args: ["run", "verify:seo-geo"] },
    ],
  },
  {
    id: "3",
    label: "页面 / UI / route / component",
    commands: [
      { cmd: npmCommand, args: ["run", "verify:local"] },
    ],
  },
  {
    id: "4",
    label: "Trial / Partner / Guides 核心用户流程",
    commands: [
      { cmd: npmCommand, args: ["run", "verify:e2e:smoke"] },
    ],
  },
  {
    id: "5",
    label: "Admin GEO API / session / backend",
    commands: [
      { cmd: npmCommand, args: ["run", "verify:admin-geo"] },
    ],
  },
  {
    id: "6",
    label: "Admin GEO 浏览器主流程（本地 Selenium）",
    commands: [
      { cmd: npmCommand, args: ["run", "audit:admin:selenium"] },
    ],
  },
  {
    id: "7",
    label: "E2E / Playwright spec",
    commands: [
      { cmd: npmCommand, args: ["run", "verify:e2e:smoke"] },
    ],
  },
  {
    id: "8",
    label: "发布前综合检查",
    commands: [
      { cmd: npmCommand, args: ["run", "verify:publish"] },
      { cmd: npmCommand, args: ["run", "verify:e2e:smoke"] },
    ],
  },
  {
    id: "9",
    label: "只查看 content baseline history / trend",
    commands: [
      { cmd: npmCommand, args: ["run", "audit:content:baseline:history"] },
      { cmd: npmCommand, args: ["run", "audit:content:baseline:trend"] },
    ],
  },
  {
    id: "0",
    label: "退出",
    commands: [],
    exit: true,
  },
];

function showHelp() {
  console.log(`
kibouFlow Harness Selector

用法：
  npm run harness:select         # 交互式选择
  npm run harness:select -- --help   # 显示本帮助
  npm run harness:select -- --dry-run # 选择后只打印命令，不执行

这次主要改了什么？可输入多个编号，用逗号分隔。

菜单：
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

命令映射：
  1 → verify:content + audit:content:diff:strict
  2 → verify:seo-geo
  3 → verify:local
  4 → verify:e2e:smoke
  5 → verify:admin-geo
  6 → audit:admin:selenium
  7 → verify:e2e:smoke
  8 → verify:publish + verify:e2e:smoke
  9 → audit:content:baseline:history + audit:content:baseline:trend

注意：
  - 选择后需要确认才会执行
  - --dry-run 模式只打印命令，不执行
  - audit:content:baseline 不会默认执行
  - Selenium 仍依赖本地环境
`);
}

function parseSelection(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function buildCommandList(selectedIds) {
  const seen = new Set();
  const commands = [];

  for (const id of selectedIds) {
    const option = OPTIONS.find((o) => o.id === id);
    if (!option) continue;
    for (const cmd of option.commands) {
      const key = `${cmd.cmd}|${cmd.args.join("|")}`;
      if (!seen.has(key)) {
        seen.add(key);
        commands.push(cmd);
      }
    }
  }

  return commands;
}

function printCommands(commands) {
  console.log("\n将运行:");
  for (const { cmd, args } of commands) {
    const fullCmd = cmd === npmCommand ? `npm run ${args.slice(1).join(" ").replace(/"/g, "")}` : `${cmd} ${args.join(" ")}`;
    console.log(`  - npm run ${args[1]} ${args.slice(2).join(" ")}`.trim());
  }
}

function executeCommands(commands) {
  for (const { cmd, args } of commands) {
    console.log(`\n> ${args.join(" ")}\n`);
    const isWindowsCmd = process.platform === "win32" && cmd.toLowerCase().endsWith(".cmd");
    const result = isWindowsCmd
      ? spawnSync(
          process.env.ComSpec || "cmd.exe",
          ["/d", "/s", "/c", `${cmd} ${args.join(" ")}`],
          {
            cwd: process.cwd(),
            stdio: "inherit",
            shell: false,
            env: process.env,
          },
        )
      : spawnSync(cmd, args, {
          cwd: process.cwd(),
          stdio: "inherit",
          shell: false,
          env: process.env,
        });

    if (result.error) {
      console.error(`命令启动失败: ${cmd}`);
      console.error(result.error.message);
      process.exit(1);
    }

    if ((result.status ?? 1) !== 0) {
      console.error(`命令失败，退出码: ${result.status ?? 1}`);
      process.exit(result.status ?? 1);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isHelp = args.includes("--help");

  if (isHelp) {
    showHelp();
    return;
  }

  console.log("kibouFlow Harness Selector\n");
  console.log("这次主要改了什么？可输入多个编号，用逗号分隔。\n");

  for (const opt of OPTIONS) {
    console.log(`  ${opt.id}. ${opt.label}`);
  }

  console.log();

  const rl = createInterface({ input, output });
  const answer = await rl.question("请选择: ");
  rl.close();

  const selectedIds = parseSelection(answer);

  if (selectedIds.length === 0) {
    console.log("未选择任何选项。");
    return;
  }

  const commands = buildCommandList(selectedIds);

  if (commands.length === 0) {
    console.log("没有可执行的命令。");
    return;
  }

  printCommands(commands);

  if (isDryRun) {
    console.log("\n[dry-run] 不执行命令。");
    return;
  }

  const rl2 = createInterface({ input, output });
  const confirm = await rl2.question("\n是否执行？(y/N) ");
  rl2.close();

  if (confirm.trim().toLowerCase() !== "y") {
    console.log("已取消。");
    return;
  }

  executeCommands(commands);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
