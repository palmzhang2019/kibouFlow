const DEFAULT_EXCLUDED_HEADINGS = new Set([
  // zh — align with docs/geo-phase-3-plan.md
  "这页解决什么问题",
  "推荐阅读顺序",
  "常见误区",
  "下一步建议",
  "案例库怎么用",
  "按问题类型浏览",
  "阅读一个案例时看什么",
  // ja — mirror headings in cluster / case MDX
  "何を解決するページか",
  "おすすめの読み順",
  "よくある誤解",
  "次の一歩",
]);

export interface FaqPair {
  name: string;
  text: string;
}

export interface FaqExtractorOptions {
  excludeHeadingPatterns?: RegExp[];
  minItems?: number;
}

function isExcluded(
  heading: string,
  extraPatterns: RegExp[] | undefined,
  fixed: Set<string>,
): boolean {
  if (fixed.has(heading.trim())) return true;
  if (extraPatterns) {
    return extraPatterns.some((re) => re.test(heading));
  }
  return false;
}

/**
 * Split MDX/Markdown body by `##` headings; treat each block as FAQ Q/A.
 * Headings in the exclusion set are skipped (non-QA sections).
 */
export function extractFaqPairsFromMarkdown(
  markdown: string,
  options?: FaqExtractorOptions,
): FaqPair[] {
  const lines = markdown.split(/\r?\n/);
  const pairs: FaqPair[] = [];
  let i = 0;

  while (i < lines.length) {
    const hm = lines[i].match(/^##\s+(.+)$/);
    if (!hm) {
      i++;
      continue;
    }
    const name = hm[1].trim();
    i++;
    if (isExcluded(name, options?.excludeHeadingPatterns, DEFAULT_EXCLUDED_HEADINGS)) {
      while (i < lines.length && !/^##\s/.test(lines[i])) i++;
      continue;
    }
    const bodyLines: string[] = [];
    while (i < lines.length && !/^##\s/.test(lines[i])) {
      bodyLines.push(lines[i]);
      i++;
    }
    const text = bodyLines.join("\n").trim();
    if (name && text) {
      pairs.push({ name, text });
    }
  }

  const minItems = options?.minItems ?? 1;
  if (pairs.length < minItems) return [];
  return pairs;
}
