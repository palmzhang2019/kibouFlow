#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const BASELINE_FILE = path.join(__dirname, "baselines", "content-warning-baseline.json");

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
}

function loadCurrentResults() {
  const checkPath = path.join(__dirname, "content-harness-check.mjs");
  const jsonOutput = execSync(`node "${checkPath}" --json`, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return JSON.parse(jsonOutput);
}

function computeDiff(baseline, current) {
  const changes = {
    baselineGeneratedAt: baseline.generatedAt,
    diffGeneratedAt: new Date().toISOString(),
    baselineTotalWarnings: baseline.totalWarnings,
    currentTotalWarnings: current.summary.warnings,
    delta: current.summary.warnings - baseline.totalWarnings,
    byCode: {},
    newCodes: [],
    removedCodes: [],
    increasedCodes: [],
    decreasedCodes: [],
    bySeverity: {
      P1: { baseline: baseline.bySeverity.P1, current: current.summary.bySeverity.P1, delta: current.summary.bySeverity.P1 - baseline.bySeverity.P1 },
      P2: { baseline: baseline.bySeverity.P2, current: current.summary.bySeverity.P2, delta: current.summary.bySeverity.P2 - baseline.bySeverity.P2 },
      P3: { baseline: baseline.bySeverity.P3, current: current.summary.bySeverity.P3, delta: current.summary.bySeverity.P3 - baseline.bySeverity.P3 },
    },
    newWarnings: [],
    resolvedWarnings: [],
  };

  const baselineCodes = Object.keys(baseline.byCode);
  const currentCodes = Object.keys(current.summary.byCode);

  for (const code of currentCodes) {
    const baselineCount = baseline.byCode[code] || 0;
    const currentCount = current.summary.byCode[code];
    if (!baselineCodes.includes(code)) {
      changes.newCodes.push({ code, count: currentCount });
    } else if (currentCount > baselineCount) {
      changes.increasedCodes.push({ code, baseline: baselineCount, current: currentCount, delta: currentCount - baselineCount });
    } else if (currentCount < baselineCount) {
      changes.decreasedCodes.push({ code, baseline: baselineCount, current: currentCount, delta: currentCount - baselineCount });
    }
    changes.byCode[code] = {
      baseline: baselineCount,
      current: currentCount,
      delta: currentCount - baselineCount,
    };
  }

  for (const code of baselineCodes) {
    if (!currentCodes.includes(code)) {
      changes.removedCodes.push({ code, baseline: baseline.byCode[code] });
    }
  }

  const baselineSlugs = new Set(baseline.warnings.map(w => `${w.code}:${w.file}`));
  for (const w of current.warnings) {
    const key = `${w.code}:${w.file}`;
    if (!baselineSlugs.has(key)) {
      changes.newWarnings.push(w);
    }
  }

  const currentSlugs = new Set(current.warnings.map(w => `${w.code}:${w.file}`));
  for (const w of baseline.warnings) {
    const key = `${w.code}:${w.file}`;
    if (!currentSlugs.has(key)) {
      changes.resolvedWarnings.push(w);
    }
  }

  return changes;
}

function printHumanReadable(diff) {
  console.log(`Content Warning Diff (baseline: ${diff.baselineGeneratedAt})`);
  console.log(`  delta: ${diff.delta >= 0 ? "+" : ""}${diff.delta} warnings (${diff.baselineTotalWarnings} -> ${diff.currentTotalWarnings})`);
  console.log(`  severity change: P1=${diff.bySeverity.P1.delta} P2=${diff.bySeverity.P2.delta} P3=${diff.bySeverity.P3.delta}`);

  if (diff.newCodes.length > 0) {
    console.log(`  new warning types: ${diff.newCodes.map(c => `${c.code}(${c.count})`).join(" ")}`);
  }
  if (diff.increasedCodes.length > 0) {
    console.log(`  increased: ${diff.increasedCodes.map(c => `${c.code}(+${c.delta})`).join(" ")}`);
  }
  if (diff.decreasedCodes.length > 0) {
    console.log(`  decreased: ${diff.decreasedCodes.map(c => `${c.code}(${c.delta})`).join(" ")}`);
  }
  if (diff.removedCodes.length > 0) {
    console.log(`  resolved types: ${diff.removedCodes.map(c => c.code).join(" ")}`);
  }

  if (diff.newWarnings.length > 0) {
    console.log(`  new warnings (${diff.newWarnings.length}):`);
    for (const w of diff.newWarnings.slice(0, 10)) {
      console.log(`    - [${w.code}] ${w.file}`);
    }
    if (diff.newWarnings.length > 10) {
      console.log(`    ... and ${diff.newWarnings.length - 10} more`);
    }
  }

  if (diff.resolvedWarnings.length > 0) {
    console.log(`  resolved warnings (${diff.resolvedWarnings.length}):`);
    for (const w of diff.resolvedWarnings.slice(0, 10)) {
      console.log(`    - [${w.code}] ${w.file}`);
    }
    if (diff.resolvedWarnings.length > 10) {
      console.log(`    ... and ${diff.resolvedWarnings.length - 10} more`);
    }
  }
}

const jsonMode = process.argv.includes("--json");
const strictMode = process.argv.includes("--strict");

const baseline = loadBaseline();
if (!baseline) {
  console.error("No baseline found. Run `npm run audit:content:baseline` first.");
  process.exit(1);
}

const current = loadCurrentResults();
const diff = computeDiff(baseline, current);

if (jsonMode) {
  console.log(JSON.stringify(diff, null, 2));
} else {
  printHumanReadable(diff);
}

if (strictMode) {
  let hasRegression = false;
  const regressedItems = [];

  if (diff.delta > 0) {
    hasRegression = true;
    regressedItems.push(`total warnings increased by ${diff.delta}`);
  }

  if (diff.newCodes.length > 0) {
    hasRegression = true;
    regressedItems.push(`new warning types introduced: ${diff.newCodes.map(c => c.code).join(", ")}`);
  }

  if (diff.bySeverity.P1.delta > 0) {
    hasRegression = true;
    regressedItems.push(`P1 severity increased by ${diff.bySeverity.P1.delta}`);
  }

  if (baseline.totalWarnings === 0 && diff.currentTotalWarnings > 0) {
    hasRegression = true;
    regressedItems.push(`baseline=0 but now has ${diff.currentTotalWarnings} warning(s)`);
  }

  if (hasRegression) {
    console.error("\n[STRICT MODE] REGRESSION DETECTED:");
    for (const item of regressedItems) {
      console.error(`  - ${item}`);
    }
    console.error(`\nFailing CI check. Run \`npm run audit:content:baseline\` to update baseline if this is an intentional improvement.`);
    process.exit(1);
  } else {
    console.log("\n[STRICT MODE] No regression detected. CI check passed.");
    process.exit(0);
  }
}