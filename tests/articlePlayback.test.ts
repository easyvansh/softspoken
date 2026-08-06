import { describe, expect, it } from "vitest";
import {
  createArticleSpeechChunks,
  estimateRemainingSpeechSeconds,
} from "../core";
import type { ArticleBlock, ExtractedArticle } from "../types";

describe("article playback sessions", () => {
  it("builds a five-minute article session", () => {
    const article = createTimedArticle("five-minute", 5, 150);
    const chunks = createArticleSpeechChunks(article);

    expect(chunks).toHaveLength(5);
    expect(estimateRemainingSpeechSeconds(chunks, 0, 1)).toBe(300);
    expect(estimateRemainingSpeechSeconds(chunks, 2, 1)).toBe(180);
  });

  it("builds a fifteen-minute article session", () => {
    const article = createTimedArticle("fifteen-minute", 15, 150);
    const chunks = createArticleSpeechChunks(article);

    expect(chunks).toHaveLength(15);
    expect(estimateRemainingSpeechSeconds(chunks, 0, 1)).toBe(900);
    expect(estimateRemainingSpeechSeconds(chunks, 0, 1.5)).toBe(600);
  });

  it("keeps a long Wikipedia page paragraph-addressable", () => {
    const article = createTimedArticle("long-wikipedia", 40, 100, true);
    const chunks = createArticleSpeechChunks(article);

    expect(chunks).toHaveLength(40);
    expect(chunks[0]?.text).toMatch(/^Section 1 /);
    expect(chunks[39]?.text).toMatch(/^Section 40 /);
    expect(estimateRemainingSpeechSeconds(chunks, 20, 1)).toBe(816);
  });
});

function createTimedArticle(
  id: string,
  paragraphCount: number,
  wordsPerParagraph: number,
  includeHeadings = false,
): ExtractedArticle {
  const blocks: ArticleBlock[] = [];

  for (let index = 0; index < paragraphCount; index += 1) {
    if (includeHeadings) {
      blocks.push({
        id: `heading-${index}`,
        index: blocks.length,
        kind: "heading",
        level: 2,
        text: `Section ${index + 1}`,
      });
    }

    blocks.push({
      id: `paragraph-${index}`,
      index: blocks.length,
      kind: "paragraph",
      text: Array.from({ length: wordsPerParagraph }, () => "word").join(" "),
    });
  }

  const wordCount = paragraphCount * wordsPerParagraph;

  return {
    id,
    source: "article",
    extractionMethod: "readability",
    title: id,
    pageUrl: `https://example.com/${id}`,
    extractedAt: "2026-08-06T12:00:00.000Z",
    blocks,
    paragraphCount,
    headingCount: includeHeadings ? paragraphCount : 0,
    wordCount,
    estimatedReadingMinutes: Math.ceil(wordCount / 200),
  };
}
