import { isSpeechSpeed } from "@/types";
import type {
  ArticleExtractionResponse,
  PageInformationResponse,
  PlaybackResponse,
  SelectionTextResponse,
  SoftSpokenMessage,
  SoftSpokenMessageType,
} from "./types";

export const softSpokenMessageTypes = [
  "softspoken.page-info.request",
  "softspoken.selection.request",
  "softspoken.article.extract-request",
  "softspoken.article.content-request",
  "softspoken.playback.listen-request",
  "softspoken.playback.command-request",
  "softspoken.playback.speed-request",
  "softspoken.playback.state-request",
  "softspoken.speech.start",
  "softspoken.speech.command",
  "softspoken.speech.speed",
  "softspoken.speech.state-request",
  "softspoken.speech.restore",
  "softspoken.playback.state-changed",
] as const satisfies readonly SoftSpokenMessageType[];

const messageTypeSet = new Set<string>(softSpokenMessageTypes);
const playbackCommands = new Set([
  "pause",
  "resume",
  "stop",
  "previous-paragraph",
  "next-paragraph",
]);

export function isSoftSpokenMessage(
  value: unknown,
): value is SoftSpokenMessage {
  if (
    !isRecord(value) ||
    typeof value.type !== "string" ||
    !messageTypeSet.has(value.type)
  ) {
    return false;
  }

  switch (value.type) {
    case "softspoken.page-info.request":
    case "softspoken.article.extract-request":
    case "softspoken.playback.state-request":
      return true;
    case "softspoken.selection.request":
      return value.target === "content";
    case "softspoken.article.content-request":
      return value.target === "content";
    case "softspoken.playback.listen-request":
      return (
        isSpeechSpeed(value.speed) &&
        (value.source === "selection" ||
          (value.source === "article" && isExtractedArticle(value.article)))
      );
    case "softspoken.playback.speed-request":
      return isSpeechSpeed(value.speed);
    case "softspoken.playback.command-request":
      return isPlaybackCommand(value.command);
    case "softspoken.speech.start":
      return (
        value.target === "offscreen" &&
        isSpeechSpeed(value.speed) &&
        Array.isArray(value.chunks) &&
        value.chunks.length > 0 &&
        value.chunks.every(isSpeechChunk) &&
        (value.source === "selection" ||
          (value.source === "article" && typeof value.articleId === "string"))
      );
    case "softspoken.speech.command":
      return value.target === "offscreen" && isPlaybackCommand(value.command);
    case "softspoken.speech.speed":
      return value.target === "offscreen" && isSpeechSpeed(value.speed);
    case "softspoken.speech.state-request":
      return value.target === "offscreen";
    case "softspoken.speech.restore":
      return (
        value.target === "offscreen" &&
        isPlaybackSessionCheckpoint(value.checkpoint)
      );
    case "softspoken.playback.state-changed":
      return value.target === "popup" && isPlaybackState(value.state);
  }

  return false;
}

export function isArticleExtractionResponse(
  value: unknown,
): value is ArticleExtractionResponse {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }

  return value.ok
    ? isExtractedArticle(value.article)
    : isArticleExtractionError(value.error);
}

export function isExtractedArticle(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.source !== "article" ||
    (value.extractionMethod !== "readability" &&
      value.extractionMethod !== "fallback") ||
    typeof value.title !== "string" ||
    typeof value.pageUrl !== "string" ||
    typeof value.extractedAt !== "string" ||
    !Array.isArray(value.blocks) ||
    !value.blocks.every(isArticleBlock) ||
    !isNonNegativeInteger(value.paragraphCount) ||
    !isNonNegativeInteger(value.headingCount) ||
    !isNonNegativeInteger(value.wordCount) ||
    !isNonNegativeInteger(value.estimatedReadingMinutes)
  ) {
    return false;
  }

  return (
    (value.author === undefined || typeof value.author === "string") &&
    (value.siteName === undefined || typeof value.siteName === "string")
  );
}

export function isPageInformationResponse(
  value: unknown,
): value is PageInformationResponse {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }

  return value.ok
    ? isPageInformation(value.page)
    : isPageInformationError(value.error);
}

export function isSelectionTextResponse(
  value: unknown,
): value is SelectionTextResponse {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }

  return value.ok
    ? typeof value.text === "string"
    : isPlaybackError(value.error);
}

export function isPlaybackResponse(value: unknown): value is PlaybackResponse {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }

  return value.ok ? isPlaybackState(value.state) : isPlaybackError(value.error);
}

export function isPlaybackState(value: unknown): value is PlaybackState {
  return (
    isRecord(value) &&
    isPlaybackStatus(value.status) &&
    (value.source === undefined ||
      value.source === "selection" ||
      value.source === "article") &&
    (value.articleId === undefined || typeof value.articleId === "string") &&
    isNonNegativeInteger(value.currentParagraphIndex) &&
    isNonNegativeInteger(value.paragraphCount) &&
    isNonNegativeInteger(value.completedParagraphCount) &&
    isSpeechSpeed(value.speed) &&
    isNonNegativeInteger(value.elapsedSeconds) &&
    isNonNegativeInteger(value.estimatedRemainingSeconds) &&
    (value.errorMessage === undefined || typeof value.errorMessage === "string")
  );
}

export function isSpeechChunk(value: unknown): value is SpeechChunk {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    isNonNegativeInteger(value.wordCount)
  );
}

function isPlaybackSessionCheckpoint(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.chunks) &&
    value.chunks.length > 0 &&
    value.chunks.every(isSpeechChunk) &&
    isPlaybackState(value.state) &&
    value.state.paragraphCount === value.chunks.length &&
    value.state.currentParagraphIndex < value.chunks.length &&
    value.state.completedParagraphCount <= value.chunks.length
  );
}

function isPageInformation(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.title !== "string" ||
    typeof value.hostname !== "string" ||
    typeof value.pageUrl !== "string" ||
    typeof value.hasSelectedText !== "boolean"
  ) {
    return false;
  }

  return value.hasSelectedText
    ? typeof value.selectedTextCharacterCount === "number" &&
        Number.isInteger(value.selectedTextCharacterCount) &&
        value.selectedTextCharacterCount > 0
    : value.selectedTextCharacterCount === undefined;
}

function isArticleBlock(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isNonNegativeInteger(value.index) ||
    typeof value.text !== "string"
  ) {
    return false;
  }

  return value.kind === "paragraph"
    ? value.level === undefined
    : value.kind === "heading" &&
        typeof value.level === "number" &&
        Number.isInteger(value.level) &&
        value.level >= 1 &&
        value.level <= 6;
}

const extractionFailureReasons = new Set([
  "unsupported-page",
  "no-readable-content",
  "unexpected-error",
]);

function isArticleExtractionError(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.reason === "string" &&
    extractionFailureReasons.has(value.reason) &&
    typeof value.message === "string"
  );
}

const pageInformationFailureReasons = new Set([
  "no-active-tab",
  "unsupported-page",
  "inaccessible-page",
  "invalid-page-response",
  "messaging-failure",
]);

function isPageInformationError(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.reason === "string" &&
    pageInformationFailureReasons.has(value.reason) &&
    typeof value.message === "string"
  );
}

const playbackFailureReasons = new Set([
  "empty-selection",
  "selection-unavailable",
  "no-playback-session",
  "speech-unavailable",
  "speech-error",
  "messaging-failure",
]);

function isPlaybackError(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.reason === "string" &&
    playbackFailureReasons.has(value.reason) &&
    typeof value.message === "string"
  );
}

function isPlaybackCommand(value: unknown): boolean {
  return typeof value === "string" && playbackCommands.has(value);
}

function isPlaybackStatus(value: unknown): boolean {
  return (
    typeof value === "string" &&
    [
      "idle",
      "loading",
      "playing",
      "paused",
      "stopped",
      "completed",
      "error",
    ].includes(value)
  );
}

function isNonNegativeInteger(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
