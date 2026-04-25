#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const BASELINE_DIR = path.join(__dirname, "baselines");
const HISTORY_DIR = path.join(BASELINE_DIR, "history");
const BASELINE_FILE = path.join(BASELINE_DIR, "content-warning-baseline.json");

function ensureBaselineDir() {
  if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
  }
}

function ensureHistoryDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function generateBaseline() {
  const checkPath = path.join(__dirname, "content-harness-check.mjs");

  const jsonOutput = execSync(`node "${checkPath}" --json`, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });

  const result = JSON.parse(jsonOutput);

  const baseline = {
    generatedAt: new Date().toISOString(),
    scanned: result.summary.scanned,
    blockingErrors: result.summary.blockingErrors,
    totalWarnings: result.summary.warnings,
    byCode: result.summary.byCode,
    bySeverity: result.summary.bySeverity,
    byCategory: result.summary.byCategory,
    byLocale: result.summary.byLocale,
    warnings: result.warnings,
  };

  ensureBaselineDir();
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  console.log(`Baseline saved to ${path.relative(ROOT, BASELINE_FILE)}`);
  console.log(`  scanned: ${baseline.scanned} files`);
  console.log(`  blocking errors: ${baseline.blockingErrors}`);
  console.log(`  total warnings: ${baseline.totalWarnings}`);
  console.log(`  severity: P1=${baseline.bySeverity.P1} P2=${baseline.bySeverity.P2} P3=${baseline.bySeverity.P3}`);

  saveToHistory(baseline);

  return baseline;
}

function saveToHistory(baseline) {
  ensureHistoryDir();
  const timestamp = baseline.generatedAt.replace(/[:.]/g, "-");
  const historyFile = path.join(HISTORY_DIR, `baseline-${timestamp}.json`);
  fs.writeFileSync(historyFile, JSON.stringify(baseline, null, 2));
  console.log(`  history snapshot: ${path.relative(ROOT, historyFile)}`);
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
}

function listHistoryFiles() {
  if (!fs.existsSync(HISTORY_DIR)) {
    return [];
  }
  return fs.readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith(".json"))
    .sort()
    .reverse();
}

function showBaseline() {
  const baseline = loadBaseline();
  if (!baseline) {
    console.error("No baseline found. Run `npm run audit:content:baseline` first.");
    process.exit(1);
  }
  console.log(`Content Warning Baseline (generated: ${baseline.generatedAt})`);
  console.log(`  scanned: ${baseline.scanned} files`);
  console.log(`  blocking errors: ${baseline.blockingErrors}`);
  console.log(`  total warnings: ${baseline.totalWarnings}`);
  console.log(`  severity: P1=${baseline.bySeverity.P1} P2=${baseline.bySeverity.P2} P3=${baseline.bySeverity.P3}`);
  console.log(`  category: template-level=${baseline.byCategory["template-level"]} article-level=${baseline.byCategory["article-level"]} translation-level=${baseline.byCategory["translation-level"]}`);
  console.log(`  by-locale: zh=${baseline.byLocale.zh} ja=${baseline.byLocale.ja}`);
  console.log(`  by-code: ${Object.entries(baseline.byCode).map(([k, v]) => `${k}=${v}`).join(" ")}`);
}

function showHistory() {
  const files = listHistoryFiles();
  if (files.length === 0) {
    console.log("No baseline history found. Run `npm run audit:content:baseline` to create the first snapshot.");
    return;
  }
  console.log(`Baseline History (${files.length} snapshot(s) in ${path.relative(ROOT, HISTORY_DIR)}/)`);
  for (const file of files.slice(0, 10)) {
    const fullPath = path.join(HISTORY_DIR, file);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const date = data.generatedAt ? new Date(data.generatedAt).toLocaleString() : file;
    console.log(`  ${file}`);
    console.log(`    ${date}  warnings=${data.totalWarnings}  blockingErrors=${data.blockingErrors}  P1=${data.bySeverity.P1} P2=${data.bySeverity.P2} P3=${data.bySeverity.P3}`);
  }
  if (files.length > 10) {
    console.log(`  ... and ${files.length - 10} more. Run \`npm run audit:content:baseline:trend\` for full trend.`);
  }
}

function showTrend() {
  const files = listHistoryFiles();
  if (files.length === 0) {
    console.log("No baseline history found. Run `npm run audit:content:baseline` to create the first snapshot.");
    return;
  }
  console.log(`Baseline Trend (${files.length} snapshot(s))`);
  console.log(`  file                                              date                        warnings  P1  P2  P3`);
  console.log(`  ${"-".repeat(95)}`);

  const sortedFiles = [...files].sort();
  let prevWarnings = null;
  for (const file of sortedFiles) {
    const fullPath = path.join(HISTORY_DIR, file);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const date = data.generatedAt ? new Date(data.generatedAt).toLocaleString() : file;
    const delta = prevWarnings !== null ? (data.totalWarnings - prevWarnings >= 0 ? `+${data.totalWarnings - prevWarnings}` : `${data.totalWarnings - prevWarnings}`) : "";
    const deltaStr = delta ? `(${delta})` : "";
    console.log(`  ${file.padEnd(46)} ${date.padEnd(26)} ${String(data.totalWarnings).padStart(8)}  ${String(data.bySeverity.P1).padStart(2)}  ${String(data.bySeverity.P2).padStart(2)}  ${String(data.bySeverity.P3).padStart(2)}  ${deltaStr}`);
    prevWarnings = data.totalWarnings;
  }
  console.log(`\n  Use \`npm run audit:content:diff\` to compare current state against the current baseline.`);
  console.log(`  Use \`npm run audit:content:baseline\` to save a new baseline snapshot.`);
}

const command = process.argv[2];

if (command === "generate") {
  generateBaseline();
} else if (command === "show") {
  showBaseline();
} else if (command === "history") {
  showHistory();
} else if (command === "trend") {
  showTrend();
} else if (!command) {
  const baseline = loadBaseline();
  if (baseline) {
    showBaseline();
  } else {
    console.log("No baseline found. Generating...");
    generateBaseline();
  }
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: node scripts/content-warning-baseline.mjs [generate|show|history|trend]");
  process.exit(1);
}