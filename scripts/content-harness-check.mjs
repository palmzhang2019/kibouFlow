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
];
const RELATED_SLUG_PATTERN = /^(problems|paths|boundaries|cases)\/[a-z0-9-]+$/;

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

function validateFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const relative = path.relative(ROOT, filePath).replaceAll("\\", "/");
  const locale = path.basename(path.dirname(path.dirname(filePath)));
  const categoryFromDir = path.basename(path.dirname(filePath));
  const slugFromFile = path.basename(filePath, ".mdx");
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
      errors.push(`${relative}: missing required frontmatter '${field}'`);
    }
  }

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
    warnings.push(`${relative}: non-canonical contentType '${contentType}'`);
  }

  if (cluster && !CLUSTERS.includes(cluster)) {
    warnings.push(`${relative}: non-canonical cluster '${cluster}'`);
  }

  if (ctaType && !CTA_TYPES.includes(ctaType)) {
    warnings.push(`${relative}: non-canonical ctaType '${ctaType}'`);
  }

  if (data.relatedSlugs != null && !Array.isArray(data.relatedSlugs)) {
    errors.push(`${relative}: relatedSlugs must be an array when present`);
  }

  for (const related of toArray(data.relatedSlugs)) {
    const normalized = normalizeString(related);
    if (!normalized || !RELATED_SLUG_PATTERN.test(normalized)) {
      warnings.push(`${relative}: relatedSlugs entry '${String(related)}' is non-canonical`);
    }
  }

  if (!Array.isArray(data.tldr) || data.tldr.length === 0) {
    warnings.push(`${relative}: missing tldr frontmatter`);
  }

  if (!Array.isArray(data.suitableFor) || data.suitableFor.length === 0) {
    warnings.push(`${relative}: missing suitableFor frontmatter`);
  }

  if (!Array.isArray(data.notSuitableFor) || data.notSuitableFor.length === 0) {
    warnings.push(`${relative}: missing notSuitableFor frontmatter`);
  }

  if (!Array.isArray(data.relatedSlugs) || data.relatedSlugs.length === 0) {
    warnings.push(`${relative}: missing relatedSlugs`);
  }

  const internalLinks = countInternalLinks(content);
  if (internalLinks < 2) {
    warnings.push(`${relative}: only ${internalLinks} internal links found in article body`);
  }

  if (!hasNextSteps(content)) {
    warnings.push(`${relative}: missing next-step section heading`);
  }

  if (!pairedLocaleExists(locale, categoryFromDir, slugFromFile)) {
    warnings.push(`${relative}: missing paired locale article`);
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
  for (const warning of allWarnings.slice(0, 20)) {
    console.warn(`- ${warning}`);
  }
  if (allWarnings.length > 20) {
    console.warn(`- ... and ${allWarnings.length - 20} more warning(s)`);
  }
} else {
  console.log("content harness check found no warnings");
}
