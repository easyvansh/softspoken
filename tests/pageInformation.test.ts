import { describe, expect, it } from "vitest";
import { createPageInformation, isPageSnapshot } from "../core";

describe("createPageInformation", () => {
  it("normalizes the title and hostname for a regular page", () => {
    expect(
      createPageInformation({
        title: "  An excellent article  ",
        pageUrl: "https://www.example.com/articles/one?ref=home",
        selectedText: "",
      }),
    ).toEqual({
      title: "An excellent article",
      hostname: "www.example.com",
      pageUrl: "https://www.example.com/articles/one?ref=home",
      hasSelectedText: false,
    });
  });

  it("falls back for an empty title and ignores whitespace-only selections", () => {
    expect(
      createPageInformation({
        title: "   ",
        pageUrl: "http://localhost:3000/",
        selectedText: " \n\t ",
      }),
    ).toEqual({
      title: "Untitled page",
      hostname: "localhost",
      pageUrl: "http://localhost:3000/",
      hasSelectedText: false,
    });
  });

  it("counts trimmed selected text by Unicode code point", () => {
    expect(
      createPageInformation({
        title: "Selection",
        pageUrl: "https://example.com/",
        selectedText: "  A\u{1f600}B  ",
      }),
    ).toMatchObject({
      hasSelectedText: true,
      selectedTextCharacterCount: 3,
    });
  });

  it("rejects malformed and unsupported page URLs", () => {
    const baseSnapshot = { title: "Page", selectedText: "" };

    expect(
      createPageInformation({ ...baseSnapshot, pageUrl: "not a url" }),
    ).toBeUndefined();
    expect(
      createPageInformation({
        ...baseSnapshot,
        pageUrl: "chrome://extensions",
      }),
    ).toBeUndefined();
  });
});

describe("isPageSnapshot", () => {
  it("validates serializable page snapshots", () => {
    expect(
      isPageSnapshot({
        title: "Page",
        pageUrl: "https://example.com/",
        selectedText: "text",
      }),
    ).toBe(true);
    expect(
      isPageSnapshot({
        title: "Page",
        pageUrl: "https://example.com/",
        selectedText: 12,
      }),
    ).toBe(false);
    expect(isPageSnapshot(null)).toBe(false);
  });
});
