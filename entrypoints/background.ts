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
  isSoftSpokenMessage,
  isSettingsResponse,
  isVoiceListResponse,
} from "@/messaging";
import type {
  ArticleExtractionResponse,
  OffscreenSpeechRequest,
  OffscreenVoiceRequest,
  PageInformationResponse,
  PlaybackProgressResponse,
  PlaybackResponse,
  SettingsResponse,
  VoiceListResponse,
} from "@/messaging";
import type {
  ExtractedArticle,
  PageInformationFailureReason,
  PageSnapshot,
  PlaybackFailureReason,
  PlaybackState,
  UserSettings,
  SpeechSpeed,
} from "@/types";
import {
  PlaybackProgressStore,
  PlaybackSessionStore,
  SettingsStore,
} from "@/storage";
import { OffscreenDocumentManager } from "./background/offscreenDocumentManager";

const offscreenDocumentPath = "/offscreen.html";
const offscreenDocuments = new OffscreenDocumentManager({
  getDocumentUrl: () => browser.runtime.getURL(offscreenDocumentPath),
  hasDocument: async (documentUrl) => {
    const contexts = await browser.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [documentUrl],
    });
    return contexts.length > 0;
  },
  createDocument: () =>
    browser.offscreen.createDocument({
      url: offscreenDocumentPath,
      reasons: ["AUDIO_PLAYBACK"],
      justification:
        "Continue local article speech when the popup or source tab is not visible.",
    }),
});
const playbackSessions = new PlaybackSessionStore(browser.storage.session);
const playbackProgress = new PlaybackProgressStore(browser.storage.local);
const settingsStore = new SettingsStore(browser.storage.local);

export default defineBackground(() => {
  void configureSidePanel();

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
          ? listenToCurrentSelection(message.settings)
          : listenToArticle(message.article, message.settings);
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
        return updateSettingsAndPlayback({ speed: message.speed });
      case "softspoken.playback.pitch-request":
        return updateSettingsAndPlayback({ pitch: message.pitch });
      case "softspoken.playback.voice-request":
        return updateSettingsAndPlayback({ voiceId: message.selectedVoiceId });
      case "softspoken.playback.state-request":
        return getPlaybackState();
      case "softspoken.playback.progress-request":
        return getPlaybackProgress();
      case "softspoken.playback.resume-article-request":
        return resumeArticle(message.article);
      case "softspoken.settings.request":
        return getSettings();
      case "softspoken.settings.update-request":
        return saveSettings(message.settings);
      case "softspoken.voices.request":
        return getVoices();
      case "softspoken.voices.preview-request":
        return previewVoice(message.settings);
      case "softspoken.playback.checkpoint":
        return playbackSessions
          .updateState(message.state)
          .then(() => persistDurableProgress(message.state))
          .then(() => false)
          .catch(() => false);
      default:
        return false;
    }
  });
});

async function configureSidePanel(): Promise<void> {
  if (browser.sidePanel === undefined) {
    return;
  }

  await browser.sidePanel
    .setOptions({
      path: "sidepanel.html",
      enabled: true,
    })
    .catch(() => undefined);
}

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

  let snapshot: PageSnapshot | undefined;

  try {
    snapshot = await injectPageReader(activeTab.tabId);
  } catch {
    return {
      ok: false,
      error: {
        reason: "unsupported-page",
        message: "Chrome did not allow SoftSpoken to inspect this page.",
      },
    };
  }

  if (!isPageSnapshot(snapshot)) {
    return {
      ok: false,
      error: {
        reason: "unexpected-error",
        message: "SoftSpoken could not inspect this page before extraction.",
      },
    };
  }

  try {
    const response = await injectArticleReader(activeTab.tabId);

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
  settings: UserSettings,
): Promise<PlaybackResponse> {
  const activeTab = await getActiveTab();

  if (!activeTab.ok) {
    return playbackFailure(
      "selection-unavailable",
      "SoftSpoken cannot read a selection from this tab.",
    );
  }

  let snapshot: PageSnapshot | undefined;

  try {
    snapshot = await injectPageReader(activeTab.tabId);
  } catch {
    return playbackFailure(
      "selection-unavailable",
      "Chrome did not allow SoftSpoken to read this selection.",
    );
  }

  if (!isPageSnapshot(snapshot)) {
    return playbackFailure(
      "selection-unavailable",
      "SoftSpoken could not read valid selected text from this page.",
    );
  }

  const text = normalizeSpeechText(snapshot.selectedText);

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
    speed: settings.speed,
    pitch: settings.pitch,
    ...(settings.voiceId === undefined
      ? {}
      : { selectedVoiceId: settings.voiceId }),
  });
}

function listenToArticle(
  article: ExtractedArticle,
  settings: UserSettings,
): Promise<PlaybackResponse> {
  return startArticle(article, settings, 0, 0);
}

async function resumeArticle(
  article: ExtractedArticle,
): Promise<PlaybackResponse> {
  const progress = await playbackProgress.load().catch(() => undefined);

  if (
    progress === undefined ||
    (progress.articleId !== article.id && progress.url !== article.pageUrl)
  ) {
    return playbackFailure(
      "no-playback-session",
      "SoftSpoken could not find saved progress for this page.",
    );
  }

  return startArticle(
    article,
    {
      speed: progress.speed,
      pitch: progress.pitch,
      ...(progress.selectedVoiceId === undefined
        ? {}
        : { voiceId: progress.selectedVoiceId }),
    },
    progress.paragraphIndex,
    progress.sentenceIndex,
  );
}

function startArticle(
  article: ExtractedArticle,
  settings: UserSettings,
  startParagraphIndex: number,
  startSentenceIndex: number,
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
    speed: settings.speed,
    pitch: settings.pitch,
    startParagraphIndex,
    startSentenceIndex,
    ...(settings.voiceId === undefined
      ? {}
      : { selectedVoiceId: settings.voiceId }),
  }).then(async (response) => {
    if (response.ok) {
      await saveArticleProgress(article, response.state).catch(() => undefined);
    }

    return response;
  });
}

async function getPlaybackState(): Promise<PlaybackResponse> {
  if (
    !(await offscreenDocuments.hasDocument()) &&
    (await loadPlaybackCheckpoint()) === undefined
  ) {
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

async function getPlaybackProgress(): Promise<PlaybackProgressResponse> {
  try {
    return { ok: true, progress: await playbackProgress.load() };
  } catch {
    return playbackFailure(
      "messaging-failure",
      "SoftSpoken could not read saved progress.",
    );
  }
}

async function getSettings(): Promise<SettingsResponse> {
  try {
    return { ok: true, settings: await settingsStore.load() };
  } catch {
    return settingsFailure(
      "messaging-failure",
      "SoftSpoken could not load voice settings.",
    );
  }
}

async function saveSettings(settings: UserSettings): Promise<SettingsResponse> {
  try {
    await settingsStore.save(settings);
    return { ok: true, settings };
  } catch {
    return settingsFailure(
      "messaging-failure",
      "SoftSpoken could not save voice settings.",
    );
  }
}

async function updateSettingsAndPlayback(
  partialSettings: Partial<UserSettings>,
): Promise<PlaybackResponse> {
  const currentSettings = await settingsStore.load().catch(() => undefined);
  const settings = {
    ...(currentSettings ?? { speed: 1, pitch: 1 }),
    ...partialSettings,
  } satisfies UserSettings;

  await settingsStore.save(settings).catch(() => undefined);

  if (!(await offscreenDocuments.hasDocument())) {
    return { ok: true, state: initialPlaybackState };
  }

  if (partialSettings.speed !== undefined) {
    return sendToOffscreen({
      type: "softspoken.speech.speed",
      target: "offscreen",
      speed: settings.speed,
    });
  }

  if (partialSettings.pitch !== undefined) {
    return sendToOffscreen({
      type: "softspoken.speech.pitch",
      target: "offscreen",
      pitch: settings.pitch,
    });
  }

  return sendToOffscreen({
    type: "softspoken.speech.voice",
    target: "offscreen",
    selectedVoiceId: settings.voiceId,
  });
}

async function getVoices(): Promise<VoiceListResponse> {
  const settings = await settingsStore.load().catch(() => undefined);
  const response = await sendToOffscreenVoice({
    type: "softspoken.speech.voices",
    target: "offscreen",
    preferredVoiceId: settings?.voiceId,
  });

  return isVoiceListResponse(response)
    ? response
    : voiceListFailure(
        "speech-unavailable",
        "SoftSpoken could not read available system voices.",
      );
}

function previewVoice(settings: UserSettings): Promise<PlaybackResponse> {
  return sendToOffscreenVoice({
    type: "softspoken.speech.preview",
    target: "offscreen",
    settings,
  }) as Promise<PlaybackResponse>;
}

async function sendToOffscreen(
  message: OffscreenSpeechRequest,
  createIfMissing = true,
): Promise<PlaybackResponse> {
  try {
    if (!(await offscreenDocuments.hasDocument())) {
      if (createIfMissing) {
        await offscreenDocuments.ensureDocument();
      } else {
        const restored = await restorePlaybackSession();

        if (restored === undefined) {
          return playbackFailure(
            "no-playback-session",
            "There is no active playback session.",
          );
        }

        if (!restored.ok) {
          return restored;
        }
      }
    }

    const response: unknown = await browser.runtime.sendMessage<
      OffscreenSpeechRequest,
      unknown
    >(message);

    if (isPlaybackResponse(response)) {
      await persistPlaybackResponse(message, response).catch(() => undefined);
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

async function sendToOffscreenVoice(
  message: OffscreenVoiceRequest,
): Promise<VoiceListResponse | PlaybackResponse> {
  try {
    await offscreenDocuments.ensureDocument();
    const response: unknown = await browser.runtime.sendMessage<
      OffscreenVoiceRequest,
      unknown
    >(message);

    if (message.type === "softspoken.speech.voices") {
      return isVoiceListResponse(response)
        ? response
        : playbackFailure(
            "speech-unavailable",
            "SoftSpoken could not read available system voices.",
          );
    }

    return isPlaybackResponse(response)
      ? response
      : playbackFailure(
          "speech-error",
          "SoftSpoken could not preview this voice.",
        );
  } catch {
    return playbackFailure(
      "speech-unavailable",
      "SoftSpoken could not reach the local speech engine.",
    );
  }
}

async function restorePlaybackSession(): Promise<PlaybackResponse | undefined> {
  const checkpoint = await loadPlaybackCheckpoint();

  if (checkpoint === undefined) {
    return undefined;
  }

  await offscreenDocuments.ensureDocument();
  const response: unknown = await browser.runtime.sendMessage({
    type: "softspoken.speech.restore",
    target: "offscreen",
    checkpoint,
  } satisfies OffscreenSpeechRequest);

  return isPlaybackResponse(response) ? response : undefined;
}

async function loadPlaybackCheckpoint() {
  try {
    return await playbackSessions.load();
  } catch {
    return undefined;
  }
}

async function persistPlaybackResponse(
  message: OffscreenSpeechRequest,
  response: PlaybackResponse,
): Promise<void> {
  if (!response.ok) {
    return;
  }

  if (message.type === "softspoken.speech.start") {
    await playbackSessions.save(message.chunks, response.state);
    return;
  }

  await playbackSessions.updateState(response.state);
  await persistDurableProgress(response.state);
}

async function persistDurableProgress(state: PlaybackState): Promise<void> {
  if (state.source !== "article" || state.articleId === undefined) {
    return;
  }

  if (state.status === "completed") {
    await playbackProgress.clear();
    return;
  }

  const current = await playbackProgress.load();

  if (current === undefined || current.articleId !== state.articleId) {
    return;
  }

  await playbackProgress.save({
    ...current,
    paragraphIndex: state.currentParagraphIndex,
    sentenceIndex: state.currentSentenceIndex,
    timestamp: new Date().toISOString(),
    speed: state.speed,
    pitch: state.pitch,
    ...(state.selectedVoiceId === undefined
      ? {}
      : { selectedVoiceId: state.selectedVoiceId }),
  });
}

async function saveArticleProgress(
  article: ExtractedArticle,
  state: PlaybackState,
): Promise<void> {
  await playbackProgress.save({
    version: 1,
    articleId: article.id,
    url: article.pageUrl,
    title: article.title,
    paragraphIndex: state.currentParagraphIndex,
    sentenceIndex: state.currentSentenceIndex,
    timestamp: new Date().toISOString(),
    speed: state.speed,
    pitch: state.pitch,
    ...(state.selectedVoiceId === undefined
      ? {}
      : { selectedVoiceId: state.selectedVoiceId }),
  });
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

async function injectArticleReader(
  tabId: number,
): Promise<ArticleExtractionResponse | undefined> {
  const results = await browser.scripting.executeScript<
    [],
    ArticleExtractionResponse
  >({
    target: { tabId },
    files: ["/content-scripts/article-reader.js"],
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

function settingsFailure(
  reason: PlaybackFailureReason,
  message: string,
): SettingsResponse {
  return { ok: false, error: { reason, message } };
}

function voiceListFailure(
  reason: PlaybackFailureReason,
  message: string,
): VoiceListResponse {
  return { ok: false, error: { reason, message } };
}
