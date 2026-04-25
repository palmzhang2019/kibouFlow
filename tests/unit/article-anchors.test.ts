import { describe, expect, it } from "vitest";
import { slugifyHeading, getNodeText, resolveHeadingId } from "@/lib/article-anchors";

describe("slugifyHeading", () => {
  it("converts English text to lowercase hyphenated slug", () => {
    expect(slugifyHeading("Hello World")).toBe("hello-world");
  });

  it("preserves Chinese characters", () => {
    expect(slugifyHeading("下一步建议")).toBe("下一步建议");
  });

  it("preserves Japanese hiragana and katakana", () => {
    expect(slugifyHeading("はじめに")).toBe("はじめに");
    expect(slugifyHeading("コーヒー")).toBe("コーヒー");
  });

  it("removes Markdown formatting symbols", () => {
    expect(slugifyHeading("`code` and *bold*")).toBe("code-and-bold");
  });

  it("removes tilde and underscore", () => {
    expect(slugifyHeading("~strikethrough~ and _underline_")).toBe("strikethrough-and-underline");
  });

  it("collapses multiple spaces to single hyphen", () => {
    expect(slugifyHeading("  multiple   spaces   here  ")).toBe("multiple-spaces-here");
  });

  it("removes special characters like question marks and exclamation marks", () => {
    expect(slugifyHeading("What? Is this!")).toBe("what-is-this");
  });

  it("removes hash symbols", () => {
    expect(slugifyHeading("### Heading")).toBe("heading");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugifyHeading("  ---  Hello World  ---  ")).toBe("hello-world");
  });

  it("collapses multiple consecutive hyphens", () => {
    expect(slugifyHeading("one---two---three")).toBe("one-two-three");
  });

  it("returns empty string for empty input", () => {
    expect(slugifyHeading("")).toBe("");
  });

  it("removes ASCII punctuation while preserving CJK", () => {
    expect(slugifyHeading("Hello, World! How are you?")).toBe("hello-world-how-are-you");
  });

  it("normalizes NFKC", () => {
    expect(slugifyHeading("①②③")).toBe("123");
  });
});

describe("getNodeText", () => {
  it("returns string as-is", () => {
    expect(getNodeText("hello")).toBe("hello");
  });

  it("converts number to string", () => {
    expect(getNodeText(42)).toBe("42");
  });

  it("returns empty string for null", () => {
    expect(getNodeText(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getNodeText(undefined)).toBe("");
  });

  it("flattens arrays by recursively getting text", () => {
    expect(getNodeText(["hello", " ", "world"])).toBe("hello world");
  });

  it("handles nested arrays", () => {
    expect(getNodeText(["a", ["b", "c"], "d"])).toBe("abcd");
  });

  it("returns empty string for unrecognized object", () => {
    expect(getNodeText({} as unknown)).toBe("");
  });
});

describe("resolveHeadingId", () => {
  it("returns the provided id when given", () => {
    expect(resolveHeadingId("children", "custom-id")).toBe("custom-id");
  });

  it("generates slug from children when id is not provided", () => {
    expect(resolveHeadingId("Hello World")).toBe("hello-world");
  });

  it("generates slug from array children", () => {
    expect(resolveHeadingId(["Hello", " ", "World"])).toBe("hello-world");
  });

  it("returns undefined when children produce empty slug", () => {
    expect(resolveHeadingId("   ")).toBeUndefined();
  });

  it("returns undefined for null/undefined children with no id", () => {
    expect(resolveHeadingId(null as unknown)).toBeUndefined();
    expect(resolveHeadingId(undefined as unknown)).toBeUndefined();
  });

  it("prefers explicit id over generated slug", () => {
    expect(resolveHeadingId("some text", "my-id")).toBe("my-id");
  });
});
