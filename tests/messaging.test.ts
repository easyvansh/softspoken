import { describe, expect, it } from "vitest";
import {
  isArticleExtractionResponse,
  isPageInformationResponse,
  isPlaybackResponse,
  isSelectionTextResponse,
  isSoftSpokenMessage,
} from "../messaging";

describe("isSoftSpokenMessage", () => {
  it("accepts known SoftSpoken message discriminators", () => {
    expect(isSoftSpokenMessage({ type: "softspoken.page-info.request" })).toBe(
      true,
    );
    expect(
      isSoftSpokenMessage({
        type: "softspoken.playback.listen-request",
        source: "selection",
        speed: 1.25,
      }),
    ).toBe(true);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.selection.request",
        target: "content",
      }),
    ).toBe(true);
  });

  it("rejects unknown external data", () => {
    expect(isSoftSpokenMessage(null)).toBe(false);
    expect(isSoftSpokenMessage({ type: "starter.hello" })).toBe(false);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.playback.listen-request",
        source: "selection",
        speed: 9,
      }),
    ).toBe(false);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.speech.command",
        target: "popup",
        command: "pause",
      }),
    ).toBe(false);
    expect(isSoftSpokenMessage({})).toBe(false);
  });
});

describe("isArticleExtractionResponse", () => {
  it("accepts a structured extracted article", () => {
    expect(
      isArticleExtractionResponse({
        ok: true,
        article: {
          id: "article-one",
          source: "article",
          extractionMethod: "readability",
          title: "Article",
          pageUrl: "https://example.com/article",
          author: "Author",
          siteName: "Example",
          extractedAt: "2026-08-06T12:00:00.000Z",
          blocks: [
            {
              id: "block-0",
              index: 0,
              kind: "paragraph",
              text: "Article paragraph.",
            },
          ],
          paragraphCount: 1,
          headingCount: 0,
          wordCount: 2,
          estimatedReadingMinutes: 1,
        },
      }),
    ).toBe(true);
  });

  it("rejects malformed article blocks and accepts extraction failures", () => {
    expect(
      isArticleExtractionResponse({
        ok: true,
        article: {
          id: "article-one",
          source: "article",
          extractionMethod: "readability",
          title: "Article",
          pageUrl: "https://example.com/article",
          extractedAt: "2026-08-06T12:00:00.000Z",
          blocks: [{ kind: "heading", level: 9, text: "Bad heading" }],
          paragraphCount: 0,
          headingCount: 1,
          wordCount: 2,
          estimatedReadingMinutes: 1,
        },
      }),
    ).toBe(false);
    expect(
      isArticleExtractionResponse({
        ok: false,
        error: {
          reason: "no-readable-content",
          message: "No article found.",
        },
      }),
    ).toBe(true);
  });
});

describe("selection and playback response validation", () => {
  it("accepts valid responses", () => {
    expect(isSelectionTextResponse({ ok: true, text: "Selected text" })).toBe(
      true,
    );
    expect(
      isPlaybackResponse({
        ok: true,
        state: {
          status: "playing",
          source: "article",
          articleId: "article-one",
          currentParagraphIndex: 0,
          paragraphCount: 2,
          completedParagraphCount: 0,
          speed: 1.25,
          elapsedSeconds: 5,
          estimatedRemainingSeconds: 30,
        },
      }),
    ).toBe(true);
    expect(
      isPlaybackResponse({
        ok: false,
        error: {
          reason: "empty-selection",
          message: "Select some text.",
        },
      }),
    ).toBe(true);
  });

  it("rejects malformed responses", () => {
    expect(isSelectionTextResponse({ ok: true, text: 42 })).toBe(false);
    expect(
      isPlaybackResponse({
        ok: true,
        state: {
          status: "speaking",
          currentParagraphIndex: 0,
          paragraphCount: 1,
          completedParagraphCount: 0,
          speed: 1,
          elapsedSeconds: 0,
          estimatedRemainingSeconds: 10,
        },
      }),
    ).toBe(false);
    expect(
      isPlaybackResponse({
        ok: false,
        error: { reason: "remote-error", message: "No." },
      }),
    ).toBe(false);
  });
});

describe("isPageInformationResponse", () => {
  it("accepts valid success and failure responses", () => {
    expect(
      isPageInformationResponse({
        ok: true,
        page: {
          title: "Page",
          hostname: "example.com",
          pageUrl: "https://example.com/",
          hasSelectedText: true,
          selectedTextCharacterCount: 12,
        },
      }),
    ).toBe(true);
    expect(
      isPageInformationResponse({
        ok: false,
        error: {
          reason: "unsupported-page",
          message: "Unsupported page.",
        },
      }),
    ).toBe(true);
  });

  it("rejects malformed responses", () => {
    expect(
      isPageInformationResponse({
        ok: true,
        page: {
          title: "Page",
          hostname: "example.com",
          pageUrl: "https://example.com/",
          hasSelectedText: true,
        },
      }),
    ).toBe(false);
    expect(
      isPageInformationResponse({
        ok: false,
        error: { reason: "unknown", message: "Unknown." },
      }),
    ).toBe(false);
    expect(isPageInformationResponse(undefined)).toBe(false);
  });
});
