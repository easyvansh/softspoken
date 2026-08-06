import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { ArticleDetails } from "../components/ArticleDetails";
import { ParagraphNavigation } from "../components/PlayerControls";
import { PlaybackStatus } from "../components/PlaybackStatus";
import { PlayerSurface } from "../components/PlayerSurface";
import type { ExtractedArticle, PlaybackState } from "../types";

const idleState: PlaybackState = {
  status: "idle",
  currentParagraphIndex: 0,
  currentSentenceIndex: 0,
  paragraphCount: 0,
  completedParagraphCount: 0,
  speed: 1,
  pitch: 1,
  elapsedSeconds: 0,
  estimatedRemainingSeconds: 0,
};

describe("compact popup layout", () => {
  it("does not create a document-level scrolling container", async () => {
    const appCss = await readFile(
      new URL("../entrypoints/popup/App.css", import.meta.url),
      "utf8",
    );
    const baseCss = await readFile(
      new URL("../entrypoints/popup/style.css", import.meta.url),
      "utf8",
    );

    expect(appCss).not.toContain("overflow-y: auto");
    expect(appCss).not.toContain("max-height: 640px");
    expect(baseCss).toMatch(/body\s*{[^}]*overflow:\s*hidden/s);
  });

  it("keeps the SoftSpoken logo and exposes settings from the header", () => {
    const markup = renderToStaticMarkup(createElement(PlayerSurface));

    expect(markup).toContain('src="/icon/32.png"');
    expect(markup).toContain("SoftSpoken");
    expect(markup).toContain('aria-label="Toggle playback settings"');
    expect(markup.indexOf("SoftSpoken")).toBeLessThan(
      markup.indexOf("Checking page"),
    );
  });

  it("hides paragraph navigation until an article is playing", () => {
    const idleMarkup = renderNavigation(idleState);
    const selectionMarkup = renderNavigation({
      ...idleState,
      status: "playing",
      source: "selection",
      paragraphCount: 2,
    });
    const articleMarkup = renderNavigation({
      ...idleState,
      status: "playing",
      source: "article",
      paragraphCount: 3,
    });

    expect(idleMarkup).toBe("");
    expect(selectionMarkup).toBe("");
    expect(articleMarkup).toContain('aria-label="Go to previous paragraph"');
    expect(articleMarkup).toContain('aria-label="Go to next paragraph"');
  });

  it("renders article and playback metadata as compact summaries", () => {
    const articleMarkup = renderToStaticMarkup(
      createElement(ArticleDetails, {
        state: { status: "ready", article: createArticle() },
        speed: 1,
      }),
    );
    const playbackMarkup = renderToStaticMarkup(
      createElement(PlaybackStatus, {
        state: {
          ...idleState,
          status: "playing",
          source: "article",
          paragraphCount: 10,
          currentParagraphIndex: 2,
          completedParagraphCount: 2,
          elapsedSeconds: 75,
          estimatedRemainingSeconds: 240,
        },
      }),
    );

    expect(articleMarkup).toContain("6 min listen | 900 words");
    expect(articleMarkup).toContain("Article detected");
    expect(playbackMarkup).toContain("20% | 1:15 elapsed | 4:00 left");
  });
});

function renderNavigation(state: PlaybackState): string {
  return renderToStaticMarkup(
    createElement(ParagraphNavigation, {
      state,
      onPreviousParagraph: () => undefined,
      onNextParagraph: () => undefined,
    }),
  );
}

function createArticle(): ExtractedArticle {
  return {
    id: "article",
    source: "article",
    extractionMethod: "readability",
    title: "A compact article",
    pageUrl: "https://example.com/article",
    extractedAt: "2026-08-06T12:00:00.000Z",
    blocks: [],
    paragraphCount: 10,
    headingCount: 2,
    wordCount: 900,
    estimatedReadingMinutes: 5,
  };
}
