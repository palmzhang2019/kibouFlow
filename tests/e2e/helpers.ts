import type { Page } from "@playwright/test";

export async function collectSchemaTypes(page: Page): Promise<string[]> {
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  const types: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = await scripts.nth(i).textContent();
    if (!raw?.trim()) continue;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const pushType = (node: Record<string, unknown>) => {
      const t = node["@type"];
      if (typeof t === "string") types.push(t);
      else if (Array.isArray(t)) {
        for (const x of t) {
          if (typeof x === "string") types.push(x);
        }
      }
    };
    if (Array.isArray(data)) {
      for (const node of data) {
        if (node && typeof node === "object") pushType(node as Record<string, unknown>);
      }
    } else if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d["@graph"])) {
        for (const node of d["@graph"]) {
          if (node && typeof node === "object") pushType(node as Record<string, unknown>);
        }
      } else {
        pushType(d);
      }
    }
  }
  return types;
}