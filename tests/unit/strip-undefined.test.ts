import { describe, expect, it } from "vitest";
import { stripUndefinedDeep } from "@/lib/seo/strip-undefined";

describe("stripUndefinedDeep", () => {
  it("removes undefined object keys and array holes", () => {
    const input = {
      a: 1,
      b: undefined,
      c: [{ x: 1 }, undefined, { y: 2 }],
    };
    expect(stripUndefinedDeep(input)).toEqual({
      a: 1,
      c: [{ x: 1 }, { y: 2 }],
    });
  });

  it("leaves primitives unchanged", () => {
    expect(stripUndefinedDeep("x")).toBe("x");
    expect(stripUndefinedDeep(null)).toBe(null);
  });
});
