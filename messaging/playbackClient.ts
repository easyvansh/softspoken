import type {
  ExtractedArticle,
  PlaybackCommand,
  PlaybackProgressLoadState,
  PlaybackState,
  UserSettings,
  VoiceOption,
} from "@/types";
import {
  isPlaybackProgressResponse,
  isPlaybackResponse,
  isSettingsResponse,
  isSoftSpokenMessage,
  isVoiceListResponse,
} from "./messages";
import type {
  ListenToArticleRequest,
  ListenToSelectionRequest,
  PlaybackCommandRequest,
  PlaybackProgressRequest,
  PlaybackProgressResponse,
  PlaybackResponse,
  PlaybackPitchRequest,
  PlaybackSpeedRequest,
  PlaybackStateRequest,
  PlaybackVoiceRequest,
  PopupPlaybackRequest,
  ResumeArticleRequest,
  SettingsRequest,
  SettingsResponse,
  SettingsUpdateRequest,
  VoiceListRequest,
  VoiceListResponse,
  VoicePreviewRequest,
} from "./types";

export function listenToSelection(
  settings: UserSettings,
): Promise<PlaybackResponse> {
  const request: ListenToSelectionRequest = {
    type: "softspoken.playback.listen-request",
    source: "selection",
    settings,
  };

  return sendPlaybackRequest(request);
}

export function listenToArticle(
  article: ExtractedArticle,
  settings: UserSettings,
): Promise<PlaybackResponse> {
  const request: ListenToArticleRequest = {
    type: "softspoken.playback.listen-request",
    source: "article",
    article,
    settings,
  };

  return sendPlaybackRequest(request);
}

export function resumeArticlePlayback(
  article: ExtractedArticle,
): Promise<PlaybackResponse> {
  const request: ResumeArticleRequest = {
    type: "softspoken.playback.resume-article-request",
    article,
  };

  return sendPlaybackRequest(request);
}

export function sendPlaybackCommand(
  command: PlaybackCommand,
): Promise<PlaybackResponse> {
  const request: PlaybackCommandRequest = {
    type: "softspoken.playback.command-request",
    command,
  };

  return sendPlaybackRequest(request);
}

export function updatePlaybackSpeed(
  speed: UserSettings["speed"],
): Promise<PlaybackResponse> {
  const request: PlaybackSpeedRequest = {
    type: "softspoken.playback.speed-request",
    speed,
  };

  return sendPlaybackRequest(request);
}

export function updatePlaybackPitch(
  pitch: UserSettings["pitch"],
): Promise<PlaybackResponse> {
  const request: PlaybackPitchRequest = {
    type: "softspoken.playback.pitch-request",
    pitch,
  };

  return sendPlaybackRequest(request);
}

export function updatePlaybackVoice(
  selectedVoiceId: string | undefined,
): Promise<PlaybackResponse> {
  const request: PlaybackVoiceRequest = {
    type: "softspoken.playback.voice-request",
    selectedVoiceId,
  };

  return sendPlaybackRequest(request);
}

export function getPlaybackState(): Promise<PlaybackResponse> {
  const request: PlaybackStateRequest = {
    type: "softspoken.playback.state-request",
  };

  return sendPlaybackRequest(request);
}

export async function loadPlaybackProgress(): Promise<PlaybackProgressLoadState> {
  const request: PlaybackProgressRequest = {
    type: "softspoken.playback.progress-request",
  };

  const response = await sendPlaybackProgressRequest(request);

  if (!response.ok) {
    return { status: "unavailable", message: response.error.message };
  }

  return response.progress === undefined
    ? { status: "none" }
    : { status: "ready", progress: response.progress };
}

export async function loadSettings(): Promise<SettingsResponse> {
  return sendSettingsRequest({ type: "softspoken.settings.request" });
}

export async function saveSettings(
  settings: UserSettings,
): Promise<SettingsResponse> {
  return sendSettingsRequest({
    type: "softspoken.settings.update-request",
    settings,
  });
}

export async function loadVoices(): Promise<VoiceListResponse> {
  return sendVoiceListRequest({ type: "softspoken.voices.request" });
}

export function previewVoice(
  settings: UserSettings,
): Promise<PlaybackResponse> {
  return sendPlaybackRequest({
    type: "softspoken.voices.preview-request",
    settings,
  });
}

export function subscribeToPlaybackState(
  listener: (state: PlaybackState) => void,
): () => void {
  const channel = new BroadcastChannel("softspoken.playback-state");
  const messageListener = (event: MessageEvent<unknown>) => {
    const message = event.data;

    if (
      !isSoftSpokenMessage(message) ||
      message.type !== "softspoken.playback.state-changed" ||
      message.target !== "popup"
    ) {
      return;
    }

    listener(message.state);
  };

  channel.addEventListener("message", messageListener);

  return () => {
    channel.removeEventListener("message", messageListener);
    channel.close();
  };
}

export function subscribeToVoiceList(
  listener: (
    voices: readonly VoiceOption[],
    unavailableVoiceId: string | undefined,
  ) => void,
): () => void {
  const channel = new BroadcastChannel("softspoken.voices");
  const messageListener = (event: MessageEvent<unknown>) => {
    const message = event.data;

    if (
      !isSoftSpokenMessage(message) ||
      message.type !== "softspoken.voices.changed" ||
      message.target !== "popup"
    ) {
      return;
    }

    listener(message.voices, message.unavailableVoiceId);
  };

  channel.addEventListener("message", messageListener);

  return () => {
    channel.removeEventListener("message", messageListener);
    channel.close();
  };
}

async function sendPlaybackRequest(
  request: PopupPlaybackRequest,
): Promise<PlaybackResponse> {
  try {
    const response: unknown = await browser.runtime.sendMessage<
      PopupPlaybackRequest,
      unknown
    >(request);

    if (isPlaybackResponse(response)) {
      return response;
    }
  } catch {
    // Return the stable error below instead of exposing browser internals.
  }

  return messagingFailure();
}

async function sendPlaybackProgressRequest(
  request: PlaybackProgressRequest,
): Promise<PlaybackProgressResponse> {
  try {
    const response: unknown = await browser.runtime.sendMessage<
      PlaybackProgressRequest,
      unknown
    >(request);

    if (isPlaybackProgressResponse(response)) {
      return response;
    }
  } catch {
    // Return the stable error below instead of exposing browser internals.
  }

  return {
    ok: false,
    error: {
      reason: "messaging-failure",
      message: "SoftSpoken could not read saved progress. Please try again.",
    },
  };
}

async function sendSettingsRequest(
  request: SettingsRequest | SettingsUpdateRequest,
): Promise<SettingsResponse> {
  try {
    const response: unknown = await browser.runtime.sendMessage<
      SettingsRequest | SettingsUpdateRequest,
      unknown
    >(request);

    if (isSettingsResponse(response)) {
      return response;
    }
  } catch {
    // Return the stable error below instead of exposing browser internals.
  }

  return {
    ok: false,
    error: {
      reason: "messaging-failure",
      message: "SoftSpoken could not update voice settings.",
    },
  };
}

async function sendVoiceListRequest(
  request: VoiceListRequest,
): Promise<VoiceListResponse> {
  try {
    const response: unknown = await browser.runtime.sendMessage<
      VoiceListRequest,
      unknown
    >(request);

    if (isVoiceListResponse(response)) {
      return response;
    }
  } catch {
    // Return the stable error below instead of exposing browser internals.
  }

  return {
    ok: false,
    error: {
      reason: "speech-unavailable",
      message: "SoftSpoken could not load system voices.",
    },
  };
}

function messagingFailure(): PlaybackResponse {
  return {
    ok: false,
    error: {
      reason: "messaging-failure",
      message: "SoftSpoken could not update playback. Please try again.",
    },
  };
}
