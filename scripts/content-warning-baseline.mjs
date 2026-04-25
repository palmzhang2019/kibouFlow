#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const BASELINE_DIR = path.join(__dirname, "baselines");
const BASELINE_FILE = path.join(BASELINE_DIR, "content-warning-baseline.json");

function ensureBaselineDir() {
  if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
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
  return baseline;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
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

const command = process.argv[2];

if (command === "generate") {
  generateBaseline();
} else if (command === "show") {
  showBaseline();
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
  console.error("Usage: node scripts/content-warning-baseline.mjs [generate|show]");
  process.exit(1);
}