import type {
  ExtractedArticle,
  PlaybackCommand,
  PlaybackState,
  SpeechSpeed,
} from "@/types";
import { isPlaybackResponse, isSoftSpokenMessage } from "./messages";
import type {
  ListenToArticleRequest,
  ListenToSelectionRequest,
  PlaybackCommandRequest,
  PlaybackResponse,
  PlaybackSpeedRequest,
  PlaybackStateRequest,
  PopupPlaybackRequest,
} from "./types";

export function listenToSelection(
  speed: SpeechSpeed,
): Promise<PlaybackResponse> {
  const request: ListenToSelectionRequest = {
    type: "softspoken.playback.listen-request",
    source: "selection",
    speed,
  };

  return sendPlaybackRequest(request);
}

export function listenToArticle(
  article: ExtractedArticle,
  speed: SpeechSpeed,
): Promise<PlaybackResponse> {
  const request: ListenToArticleRequest = {
    type: "softspoken.playback.listen-request",
    source: "article",
    article,
    speed,
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
  speed: SpeechSpeed,
): Promise<PlaybackResponse> {
  const request: PlaybackSpeedRequest = {
    type: "softspoken.playback.speed-request",
    speed,
  };

  return sendPlaybackRequest(request);
}

export function getPlaybackState(): Promise<PlaybackResponse> {
  const request: PlaybackStateRequest = {
    type: "softspoken.playback.state-request",
  };

  return sendPlaybackRequest(request);
}

export function subscribeToPlaybackState(
  listener: (state: PlaybackState) => void,
): () => void {
  const messageListener = (message: unknown) => {
    if (
      !isSoftSpokenMessage(message) ||
      message.type !== "softspoken.playback.state-changed" ||
      message.target !== "popup"
    ) {
      return false;
    }

    listener(message.state);
    return false;
  };

  browser.runtime.onMessage.addListener(messageListener);

  return () => {
    browser.runtime.onMessage.removeListener(messageListener);
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

function messagingFailure(): PlaybackResponse {
  return {
    ok: false,
    error: {
      reason: "messaging-failure",
      message: "SoftSpoken could not update playback. Please try again.",
    },
  };
}
