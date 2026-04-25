#!/usr/bin/env node

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const LOCALES = ["zh", "ja"];
const CATEGORIES = ["problems", "paths", "boundaries", "cases"];
const CONTENT_TYPES = [
  "problem",
  "path",
  "boundary",
  "case",
  "faq",
  "framework",
  "concept",
  "cluster",
];
const CLUSTERS = [
  "job-prep",
  "japanese-path",
  "direction-sorting",
  "partner-needs",
];
const CTA_TYPES = ["trial", "partner", "both"];
const NEXT_STEPS_PATTERNS = [
  /^##\s*下一步建议/m,
  /^##\s*下一步行动/m,
  /^##\s*下一步/m,
  /^##\s*推荐的下一步/m,
  /^##\s*次のステップ/m,
  /^##\s*次にやること/m,
  /^##\s*次の行動/m,
  /^##\s*次の一歩/m,
];
const RELATED_SLUG_PATTERN = /^(problems|paths|boundaries|cases)\/[a-z0-9-]+$/;

const WARNING_CODES = {
  NON_CANONICAL_CONTENT_TYPE: "W001",
  NON_CANONICAL_CLUSTER: "W002",
  NON_CANONICAL_CTA_TYPE: "W003",
  NON_CANONICAL_RELATED_SLUG: "W004",
  MISSING_TLDR: "W005",
  MISSING_SUITABLE_FOR: "W006",
  MISSING_NOT_SUITABLE_FOR: "W007",
  MISSING_RELATED_SLUGS: "W008",
  INSUFFICIENT_INTERNAL_LINKS: "W009",
  MISSING_NEXT_STEP: "W010",
  MISSING_PAIRED_LOCALE: "W011",
};

const WARNING_DEFINITIONS = {
  W001: { severity: "P3", category: "article-level" },
  W002: { severity: "P3", category: "article-level" },
  W003: { severity: "P3", category: "article-level" },
  W004: { severity: "P3", category: "article-level" },
  W005: { severity: "P2", category: "article-level" },
  W006: { severity: "P2", category: "article-level" },
  W007: { severity: "P2", category: "article-level" },
  W008: { severity: "P2", category: "article-level" },
  W009: { severity: "P1", category: "article-level" },
  W010: { severity: "P1", category: "template-level" },
  W011: { severity: "P3", category: "translation-level" },
};

function normalizeString(value) {
  if (typeof value !== "string") return undefined;
  let normalized = value.trim();
  const quotePairs = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
    ["‘", "’"],
  ];
  for (const [start, end] of quotePairs) {
    if (normalized.startsWith(start) && normalized.endsWith(end)) {
      normalized = normalized.slice(start.length, normalized.length - end.length).trim();
      break;
    }
  }
  return normalized.length > 0 ? normalized : undefined;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function countInternalLinks(body) {
  const markdownLinks = body.match(/\[[^\]]+\]\((\/[^)]+)\)/g) ?? [];
  const mdxLinks = body.match(/<Link\s+[^>]*href=["']\/[^"']+["'][^>]*>/g) ?? [];
  return markdownLinks.length + mdxLinks.length;
}

function hasNextSteps(body) {
  return NEXT_STEPS_PATTERNS.some((pattern) => pattern.test(body));
}

function pairedLocaleExists(locale, category, slug) {
  const sibling = locale === "zh" ? "ja" : "zh";
  return fs.existsSync(path.join(CONTENT_DIR, sibling, category, `${slug}.mdx`));
}

function makeWarning(code, filePath, message) {
  const relative = path.relative(ROOT, filePath).replaceAll("\\", "/");
  const parts = relative.split("/");
  const locale = parts[1] || "";
  const categoryDir = parts[2] || "";
  const slug = path.basename(filePath, ".mdx");
  const def = WARNING_DEFINITIONS[code] || { severity: "P3", category: "unknown" };
  return {
    code,
    severity: def.severity,
    category: def.category,
    file: relative,
    locale,
    categoryDir,
    slug,
    message,
  };
}

function validateFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const errors = [];
  const warnings = [];
  const category = normalizeString(data.category);
  const slug = normalizeString(data.slug);
  const contentType = normalizeString(data.contentType);
  const cluster = normalizeString(data.cluster);
  const ctaType = normalizeString(data.ctaType);

  const requiredFields = ["title", "description", "category", "slug", "publishedAt"];
  for (const field of requiredFields) {
    const value = normalizeString(data[field]);
    if (!value) {
      errors.push(`${filePath}: missing required frontmatter '${field}'`);
    }
  }

  const relative = path.relative(ROOT, filePath).replaceAll("\\", "/");
  const locale = path.basename(path.dirname(path.dirname(filePath)));
  const categoryFromDir = path.basename(path.dirname(filePath));
  const slugFromFile = path.basename(filePath, ".mdx");

  if (!LOCALES.includes(locale)) {
    errors.push(`${relative}: file is not under a supported locale directory`);
  }

  if (!CATEGORIES.includes(categoryFromDir)) {
    errors.push(`${relative}: file is not under a supported category directory`);
  }

  if (category && category !== categoryFromDir) {
    errors.push(
      `${relative}: frontmatter category '${category}' does not match directory '${categoryFromDir}'`,
    );
  }

  if (slug && slug !== slugFromFile) {
    errors.push(
      `${relative}: frontmatter slug '${slug}' does not match filename '${slugFromFile}'`,
    );
  }

  if (contentType && !CONTENT_TYPES.includes(contentType)) {
    warnings.push(makeWarning(WARNING_CODES.NON_CANONICAL_CONTENT_TYPE, filePath, `non-canonical contentType '${contentType}'`));
  }

  if (cluster && !CLUSTERS.includes(cluster)) {
    warnings.push(makeWarning(WARNING_CODES.NON_CANONICAL_CLUSTER, filePath, `non-canonical cluster '${cluster}'`));
  }

  if (ctaType && !CTA_TYPES.includes(ctaType)) {
    warnings.push(makeWarning(WARNING_CODES.NON_CANONICAL_CTA_TYPE, filePath, `non-canonical ctaType '${ctaType}'`));
  }

  if (data.relatedSlugs != null && !Array.isArray(data.relatedSlugs)) {
    errors.push(`${relative}: relatedSlugs must be an array when present`);
  }

  for (const related of toArray(data.relatedSlugs)) {
    const normalized = normalizeString(related);
    if (!normalized || !RELATED_SLUG_PATTERN.test(normalized)) {
      warnings.push(makeWarning(WARNING_CODES.NON_CANONICAL_RELATED_SLUG, filePath, `relatedSlugs entry '${String(related)}' is non-canonical`));
    }
  }

  if (!Array.isArray(data.tldr) || data.tldr.length === 0) {
    warnings.push(makeWarning(WARNING_CODES.MISSING_TLDR, filePath, `missing tldr frontmatter`));
  }

  if (!Array.isArray(data.suitableFor) || data.suitableFor.length === 0) {
    warnings.push(makeWarning(WARNING_CODES.MISSING_SUITABLE_FOR, filePath, `missing suitableFor frontmatter`));
  }

  if (!Array.isArray(data.notSuitableFor) || data.notSuitableFor.length === 0) {
    warnings.push(makeWarning(WARNING_CODES.MISSING_NOT_SUITABLE_FOR, filePath, `missing notSuitableFor frontmatter`));
  }

  if (!Array.isArray(data.relatedSlugs) || data.relatedSlugs.length === 0) {
    warnings.push(makeWarning(WARNING_CODES.MISSING_RELATED_SLUGS, filePath, `missing relatedSlugs`));
  }

  const internalLinks = countInternalLinks(content);
  if (internalLinks < 2) {
    warnings.push(makeWarning(WARNING_CODES.INSUFFICIENT_INTERNAL_LINKS, filePath, `only ${internalLinks} internal links found in article body`));
  }

  if (!hasNextSteps(content)) {
    warnings.push(makeWarning(WARNING_CODES.MISSING_NEXT_STEP, filePath, `missing next-step section heading`));
  }

  if (!pairedLocaleExists(locale, categoryFromDir, slugFromFile)) {
    warnings.push(makeWarning(WARNING_CODES.MISSING_PAIRED_LOCALE, filePath, `missing paired locale article`));
  }

  return { errors, warnings };
}

const allFiles = walk(CONTENT_DIR);

if (allFiles.length === 0) {
  console.error("content harness check failed: no MDX files found under content/");
  process.exit(1);
}

const allErrors = [];
const allWarnings = [];

for (const file of allFiles) {
  const { errors, warnings } = validateFile(file);
  allErrors.push(...errors);
  allWarnings.push(...warnings);
}

const jsonMode = process.argv.includes("--json");
const verboseMode = process.argv.includes("--verbose");

const summary = {
  scanned: allFiles.length,
  blockingErrors: allErrors.length,
  warnings: allWarnings.length,
  byCode: {},
  bySeverity: { P1: 0, P2: 0, P3: 0 },
  byCategory: { "template-level": 0, "article-level": 0, "translation-level": 0 },
  byLocale: { zh: 0, ja: 0 },
  details: allWarnings,
};

for (const w of allWarnings) {
  summary.byCode[w.code] = (summary.byCode[w.code] || 0) + 1;
  summary.bySeverity[w.severity]++;
  summary.byCategory[w.category]++;
  summary.byLocale[w.locale]++;
}

if (jsonMode) {
  console.log(JSON.stringify({ errors: allErrors, warnings: allWarnings, summary }, null, 2));
  process.exit(allErrors.length > 0 ? 1 : 0);
}

console.log(`content harness check scanned ${allFiles.length} MDX files`);

if (allErrors.length > 0) {
  console.error(`content harness check found ${allErrors.length} error(s):`);
  for (const error of allErrors) {
    console.error(`- ${error}`);
  }
  if (allWarnings.length > 0) {
    console.error(`content harness check also found ${allWarnings.length} warning(s)`);
  }
  process.exit(1);
}

console.log("content harness check found no blocking errors");

if (allWarnings.length > 0) {
  console.warn(`content harness check found ${allWarnings.length} warning(s):`);
  const displayWarnings = verboseMode ? allWarnings : allWarnings.slice(0, 20);
  for (const w of displayWarnings) {
    console.warn(`- [${w.code}] ${w.file}: ${w.message}`);
  }
  if (!verboseMode && allWarnings.length > 20) {
    console.warn(`- ... and ${allWarnings.length - 20} more warning(s)`);
  }
  console.warn(`\n  severity: P1=${summary.bySeverity.P1} P2=${summary.bySeverity.P2} P3=${summary.bySeverity.P3}`);
  console.warn(`  category: template-level=${summary.byCategory["template-level"]} article-level=${summary.byCategory["article-level"]} translation-level=${summary.byCategory["translation-level"]}`);
  console.warn(`  by-code: ${Object.entries(summary.byCode).map(([k,v]) => `${k}=${v}`).join(" ")}`);
} else {
  console.log("content harness check found no warnings");
}
