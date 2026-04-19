/** 与 `scripts/geo_principles_audit.py` 的 `print("\\n--- JSON ---\\n")` 一致 */
export const GEO_AUDIT_JSON_APPENDIX_SEP = "\n--- JSON ---\n";

/** 兼容手拷/少数环境：分隔行顶格、无前导换行 */
const GEO_AUDIT_JSON_APPENDIX_SEP_ALT = "--- JSON ---\n";

const SEP_VARIANTS = [GEO_AUDIT_JSON_APPENDIX_SEP, GEO_AUDIT_JSON_APPENDIX_SEP_ALT] as const;

/** 报告渲染用：去掉尾部机器可读 JSON */
export function stripGeoAuditJsonAppendix(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n");
  let bestIdx = -1;
  let bestLen = 0;
  for (const sep of SEP_VARIANTS) {
    const idx = normalized.lastIndexOf(sep);
    if (idx > bestIdx) {
      bestIdx = idx;
      bestLen = sep.length;
    }
  }
  if (bestIdx === -1) return markdown;
  return normalized.slice(0, bestIdx).trimEnd();
}

/** 定位正文与 JSON 尾段；`jsonPart` 从 `{` 或空白起至文末 */
export function splitGeoAuditMarkdownBodyAndJsonTail(markdown: string): {
  body: string;
  jsonPart: string;
  separator: string;
} | null {
  const normalized = markdown.replace(/\r\n/g, "\n");
  for (const sep of SEP_VARIANTS) {
    const idx = normalized.indexOf(sep);
    if (idx !== -1) {
      return {
        body: normalized.slice(0, idx).trimEnd(),
        jsonPart: normalized.slice(idx + sep.length),
        separator: sep,
      };
    }
  }
  return null;
}
