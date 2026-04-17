/** Deep-remove undefined so JSON-LD serializes predictably (arrays omit undefined entries). */
export function stripUndefinedDeep<T>(input: T): T {
  if (input === undefined || input === null) {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((v) => stripUndefinedDeep(v))
      .filter((v) => v !== undefined) as T;
  }
  if (typeof input === "object" && input.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out as T;
  }
  return input;
}
