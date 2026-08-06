import { describe, expect, it } from "vitest";
import { normalizeSpeechText, splitSpeechChunks } from "../core";

describe("normalizeSpeechText", () => {
  it("collapses whitespace and trims the result", () => {
    expect(normalizeSpeechText("  First\n\tsecond   third.  ")).toBe(
      "First second third.",
    );
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeSpeechText(" \n\t ")).toBe("");
  });
});

describe("splitSpeechChunks", () => {
  it("returns no chunks for empty normalized text", () => {
    expect(splitSpeechChunks(" \n ")).toEqual([]);
  });

  it("keeps short normalized text in one chunk", () => {
    expect(splitSpeechChunks("  A short\nselection.  ")).toEqual([
      "A short selection.",
    ]);
  });

  it("prefers sentence boundaries and keeps chunks bounded", () => {
    const chunks = splitSpeechChunks(
      "First sentence is here. Second sentence is somewhat longer. Third sentence ends.",
      45,
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 45)).toBe(true);
    expect(chunks.join(" ")).toBe(
      "First sentence is here. Second sentence is somewhat longer. Third sentence ends.",
    );
  });

  it("falls back to word and hard boundaries", () => {
    expect(splitSpeechChunks("alpha beta gamma delta", 10)).toEqual([
      "alpha beta",
      "gamma",
      "delta",
    ]);
    expect(splitSpeechChunks("abcdefghijkl", 5)).toEqual([
      "abcde",
      "fghij",
      "kl",
    ]);
  });

  it("rejects invalid maximum lengths", () => {
    expect(() => splitSpeechChunks("text", 0)).toThrow(RangeError);
  });
});
