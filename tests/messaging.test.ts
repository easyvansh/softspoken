import { describe, expect, it } from "vitest";
import {
  isArticleExtractionResponse,
  isPageInformationResponse,
  isPlaybackProgressRecord,
  isPlaybackProgressResponse,
  isPlaybackResponse,
  isSelectionTextResponse,
  isSettingsResponse,
  isSoftSpokenMessage,
  isUserSettings,
  isVoiceListResponse,
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
        settings: { speed: 1.25, pitch: 1 },
      }),
    ).toBe(true);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.playback.checkpoint",
        target: "background",
        state: {
          status: "paused",
          currentParagraphIndex: 0,
          currentSentenceIndex: 0,
          paragraphCount: 1,
          completedParagraphCount: 0,
          speed: 1,
          pitch: 1,
          elapsedSeconds: 3,
          estimatedRemainingSeconds: 8,
        },
      }),
    ).toBe(true);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.selection.request",
        target: "content",
      }),
    ).toBe(true);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.playback.progress-request",
      }),
    ).toBe(true);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.settings.update-request",
        settings: { speed: 1.25, pitch: 1.5, voiceId: "voice-one" },
      }),
    ).toBe(true);
    expect(
      isSoftSpokenMessage({
        type: "softspoken.speech.voices",
        target: "offscreen",
        preferredVoiceId: "voice-one",
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
        settings: { speed: 9, pitch: 1 },
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

describe("settings and voice validation", () => {
  it("accepts valid settings and voice-list responses", () => {
    const settings = { speed: 1.25, pitch: 1.5, voiceId: "voice-one" };

    expect(isUserSettings(settings)).toBe(true);
    expect(isSettingsResponse({ ok: true, settings })).toBe(true);
    expect(
      isVoiceListResponse({
        ok: true,
        voices: [
          {
            id: "voice-one",
            name: "Voice One",
            lang: "en-US",
            localService: true,
            default: false,
          },
        ],
      }),
    ).toBe(true);
  });

  it("rejects malformed settings and voices", () => {
    expect(isUserSettings({ speed: 1, pitch: 9 })).toBe(false);
    expect(
      isVoiceListResponse({
        ok: true,
        voices: [{ id: "voice-one", name: "Voice One" }],
      }),
    ).toBe(false);
  });
});

describe("playback progress validation", () => {
  it("accepts local progress records and responses", () => {
    const progress = {
      version: 1,
      articleId: "article-one",
      url: "https://example.com/article",
      title: "Article",
      paragraphIndex: 2,
      sentenceIndex: 1,
      timestamp: "2026-08-06T12:00:00.000Z",
      speed: 1.25,
      pitch: 1,
      selectedVoiceId: "voice-one",
    };

    expect(isPlaybackProgressRecord(progress)).toBe(true);
    expect(isPlaybackProgressResponse({ ok: true, progress })).toBe(true);
  });

  it("rejects malformed progress data", () => {
    expect(
      isPlaybackProgressRecord({
        version: 1,
        articleId: "article-one",
        url: "https://example.com/article",
        title: "Article",
        paragraphIndex: -1,
        sentenceIndex: 0,
        timestamp: "not a date",
        speed: 1,
        pitch: 1,
      }),
    ).toBe(false);
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
          currentSentenceIndex: 1,
          paragraphCount: 2,
          completedParagraphCount: 0,
          speed: 1.25,
          pitch: 1,
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
          currentSentenceIndex: 0,
          paragraphCount: 1,
          completedParagraphCount: 0,
          speed: 1,
          pitch: 1,
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
