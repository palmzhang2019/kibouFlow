/** Section titles after which we read a `1.` ordered list as HowTo steps (zh + ja). */
const HOWTO_SECTION_HEADINGS = new Set([
  "推荐阅读顺序",
  "判断框架",
  "判断维度",
  "おすすめの読み順",
  "判断軸",
]);

export interface HowToStep {
  text: string;
}

export interface HowToExtract {
  name?: string;
  steps: HowToStep[];
}

function cleanHowToStepText(raw: string): string {
  let s = raw.trim().replace(/\s+$/g, "");
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  return s.trim();
}

/**
 * Find the first matching `##` section in HOWTO_SECTION_HEADINGS and collect
 * subsequent `^\d+\.\s` list items until the next `##`.
 */
export function extractHowToFromMarkdown(markdown: string): HowToExtract | null {
  const lines = markdown.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const hm = lines[i].match(/^##\s+(.+)$/);
    if (!hm) continue;
    const title = hm[1].trim();
    if (!HOWTO_SECTION_HEADINGS.has(title)) continue;

    const steps: HowToStep[] = [];
    let j = i + 1;
    while (j < lines.length && !/^##\s/.test(lines[j])) {
      const lm = lines[j].match(/^\s*\d+\.\s+(.+)$/);
      if (lm) {
        steps.push({ text: cleanHowToStepText(lm[1]) });
      }
      j++;
    }
    if (steps.length >= 2) {
      return { name: title, steps };
    }
    i = j - 1;
  }

  return null;
}
