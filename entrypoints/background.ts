import {
  createArticleSpeechChunks,
  createPageInformation,
  createSelectionSpeechChunks,
  initialPlaybackState,
  isPageSnapshot,
  isPotentiallySupportedPage,
  normalizeSpeechText,
} from "@/core";
import {
  isArticleExtractionResponse,
  isPlaybackResponse,
  isSelectionTextResponse,
  isSoftSpokenMessage,
} from "@/messaging";
import type {
  ArticleExtractionRequest,
  ArticleExtractionResponse,
  OffscreenSpeechRequest,
  PageInformationResponse,
  PlaybackResponse,
  SelectionTextRequest,
} from "@/messaging";
import type {
  ExtractedArticle,
  PageInformationFailureReason,
  PageSnapshot,
  PlaybackFailureReason,
  SpeechSpeed,
} from "@/types";

const offscreenDocumentPath = "/offscreen.html";
let creatingOffscreenDocument: Promise<void> | undefined;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!isSoftSpokenMessage(message)) {
      return false;
    }

    switch (message.type) {
      case "softspoken.page-info.request":
        return getCurrentPageInformation();
      case "softspoken.article.extract-request":
        return getCurrentArticle();
      case "softspoken.playback.listen-request":
        return message.source === "selection"
          ? listenToCurrentSelection(message.speed)
          : listenToArticle(message.article, message.speed);
      case "softspoken.playback.command-request":
        return sendToOffscreen(
          {
            type: "softspoken.speech.command",
            target: "offscreen",
            command: message.command,
          },
          false,
        );
      case "softspoken.playback.speed-request":
        return sendToOffscreen({
          type: "softspoken.speech.speed",
          target: "offscreen",
          speed: message.speed,
        });
      case "softspoken.playback.state-request":
        return getPlaybackState();
      default:
        return false;
    }
  });
});

async function getCurrentPageInformation(): Promise<PageInformationResponse> {
  const activeTab = await getActiveTab();

  if (!activeTab.ok) {
    return pageFailure(activeTab.reason, activeTab.message);
  }

  let snapshot: PageSnapshot | undefined;

  try {
    snapshot = await injectPageReader(activeTab.tabId);
  } catch {
    return pageFailure(
      "inaccessible-page",
      "Chrome did not allow SoftSpoken to inspect this page.",
    );
  }

  if (!isPageSnapshot(snapshot)) {
    return pageFailure(
      "invalid-page-response",
      "SoftSpoken could not read valid information from this page.",
    );
  }

  const page = createPageInformation(snapshot);

  if (page === undefined) {
    return pageFailure(
      "unsupported-page",
      "SoftSpoken cannot inspect browser, extension, local, or other restricted pages.",
    );
  }

  return { ok: true, page };
}

async function getCurrentArticle(): Promise<ArticleExtractionResponse> {
  const activeTab = await getActiveTab();

  if (!activeTab.ok) {
    return {
      ok: false,
      error: {
        reason: "unsupported-page",
        message: "SoftSpoken cannot extract an article from this tab.",
      },
    };
  }

  try {
    await injectPageReader(activeTab.tabId);
  } catch {
    return {
      ok: false,
      error: {
        reason: "unsupported-page",
        message: "Chrome did not allow SoftSpoken to inspect this page.",
      },
    };
  }

  const extractionRequest: ArticleExtractionRequest = {
    type: "softspoken.article.content-request",
    target: "content",
  };

  try {
    const response: unknown = await browser.tabs.sendMessage<
      ArticleExtractionRequest,
      unknown
    >(activeTab.tabId, extractionRequest);

    if (isArticleExtractionResponse(response)) {
      return response;
    }
  } catch {
    // Return the stable extraction error below.
  }

  return {
    ok: false,
    error: {
      reason: "unexpected-error",
      message: "SoftSpoken could not extract this article.",
    },
  };
}

async function listenToCurrentSelection(
  speed: SpeechSpeed,
): Promise<PlaybackResponse> {
  const activeTab = await getActiveTab();

  if (!activeTab.ok) {
    return playbackFailure(
      "selection-unavailable",
      "SoftSpoken cannot read a selection from this tab.",
    );
  }

  try {
    await injectPageReader(activeTab.tabId);
  } catch {
    return playbackFailure(
      "selection-unavailable",
      "Chrome did not allow SoftSpoken to read this selection.",
    );
  }

  const selectionRequest: SelectionTextRequest = {
    type: "softspoken.selection.request",
    target: "content",
  };

  let selectionResponse: unknown;

  try {
    selectionResponse = await browser.tabs.sendMessage<
      SelectionTextRequest,
      unknown
    >(activeTab.tabId, selectionRequest);
  } catch {
    return playbackFailure(
      "selection-unavailable",
      "SoftSpoken could not read the selected text. Please select it again.",
    );
  }

  if (!isSelectionTextResponse(selectionResponse) || !selectionResponse.ok) {
    return playbackFailure(
      "selection-unavailable",
      "SoftSpoken could not read the selected text. Please select it again.",
    );
  }

  const text = normalizeSpeechText(selectionResponse.text);

  if (text.length === 0) {
    return playbackFailure(
      "empty-selection",
      "Select some text on the page before pressing Listen.",
    );
  }

  const chunks = createSelectionSpeechChunks(text);

  return sendToOffscreen({
    type: "softspoken.speech.start",
    target: "offscreen",
    source: "selection",
    chunks,
    speed,
  });
}

function listenToArticle(
  article: ExtractedArticle,
  speed: SpeechSpeed,
): Promise<PlaybackResponse> {
  const chunks = createArticleSpeechChunks(article);

  if (chunks.length === 0) {
    return Promise.resolve(
      playbackFailure(
        "selection-unavailable",
        "SoftSpoken could not prepare this article for playback.",
      ),
    );
  }

  return sendToOffscreen({
    type: "softspoken.speech.start",
    target: "offscreen",
    source: "article",
    articleId: article.id,
    chunks,
    speed,
  });
}

async function getPlaybackState(): Promise<PlaybackResponse> {
  if (!(await hasOffscreenDocument())) {
    return { ok: true, state: initialPlaybackState };
  }

  return sendToOffscreen(
    {
      type: "softspoken.speech.state-request",
      target: "offscreen",
    },
    false,
  );
}

async function sendToOffscreen(
  message: OffscreenSpeechRequest,
  createIfMissing = true,
): Promise<PlaybackResponse> {
  try {
    if (createIfMissing) {
      await ensureOffscreenDocument();
    } else if (!(await hasOffscreenDocument())) {
      return playbackFailure(
        "no-playback-session",
        "There is no active playback session.",
      );
    }

    const response: unknown = await browser.runtime.sendMessage<
      OffscreenSpeechRequest,
      unknown
    >(message);

    if (isPlaybackResponse(response)) {
      return response;
    }
  } catch {
    // Return the stable error below instead of exposing browser internals.
  }

  return playbackFailure(
    "speech-unavailable",
    "SoftSpoken could not start the local speech engine.",
  );
}

async function ensureOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (creatingOffscreenDocument === undefined) {
    creatingOffscreenDocument = browser.offscreen
      .createDocument({
        url: offscreenDocumentPath,
        reasons: [browser.offscreen.Reason.AUDIO_PLAYBACK],
        justification: "Read selected webpage text aloud for the user.",
      })
      .finally(() => {
        creatingOffscreenDocument = undefined;
      });
  }

  await creatingOffscreenDocument;
}

async function hasOffscreenDocument(): Promise<boolean> {
  const documentUrl = browser.runtime.getURL(offscreenDocumentPath);
  const contexts = await browser.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [documentUrl],
  });

  return contexts.length > 0;
}

async function injectPageReader(
  tabId: number,
): Promise<PageSnapshot | undefined> {
  const results = await browser.scripting.executeScript<[], PageSnapshot>({
    target: { tabId },
    files: ["/content-scripts/page-info.js"],
  });

  return results.find((result) => result.frameId === 0)?.result;
}

type ActiveTabResult =
  | { readonly ok: true; readonly tabId: number }
  | {
      readonly ok: false;
      readonly reason: "no-active-tab" | "unsupported-page";
      readonly message: string;
    };

async function getActiveTab(): Promise<ActiveTabResult> {
  let activeTabs;

  try {
    activeTabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
  } catch {
    return {
      ok: false,
      reason: "no-active-tab",
      message: "SoftSpoken could not find an active browser tab.",
    };
  }

  const [activeTab] = activeTabs;

  if (activeTab?.id === undefined || activeTab.url === undefined) {
    return {
      ok: false,
      reason: "no-active-tab",
      message: "SoftSpoken could not find an active browser tab.",
    };
  }

  if (!isPotentiallySupportedPage(activeTab.url)) {
    return {
      ok: false,
      reason: "unsupported-page",
      message:
        "SoftSpoken cannot inspect browser, extension, local, or other restricted pages.",
    };
  }

  return { ok: true, tabId: activeTab.id };
}

function pageFailure(
  reason: PageInformationFailureReason,
  message: string,
): PageInformationResponse {
  return { ok: false, error: { reason, message } };
}

function playbackFailure(
  reason: PlaybackFailureReason,
  message: string,
): PlaybackResponse {
  return { ok: false, error: { reason, message } };
}
