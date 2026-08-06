import { isSoftSpokenMessage } from "@/messaging";
import type {
  PlaybackCheckpointMessage,
  PlaybackResponse,
  PlaybackStateChangedMessage,
  VoiceListResponse,
} from "@/messaging";
import type { PlaybackState, UserSettings, VoiceOption } from "@/types";
import { SpeechController } from "./speechController";

const speechController = new SpeechController(broadcastState);
const playbackStateChannel = new BroadcastChannel("softspoken.playback-state");
const voiceChannel = new BroadcastChannel("softspoken.voices");
let lastCheckpointSignature: string | undefined;
let preferredVoiceId: string | undefined;

browser.runtime.onMessage.addListener(
  (
    message: unknown,
  ):
    | PlaybackResponse
    | VoiceListResponse
    | Promise<VoiceListResponse>
    | false => {
    if (
      !isSoftSpokenMessage(message) ||
      !("target" in message) ||
      message.target !== "offscreen"
    ) {
      return false;
    }

    switch (message.type) {
      case "softspoken.speech.start":
        return success(
          speechController.start(
            message.chunks,
            message.speed,
            message.pitch,
            message.source,
            message.source === "article" ? message.articleId : undefined,
            message.startParagraphIndex,
            message.startSentenceIndex,
            message.selectedVoiceId,
          ),
        );
      case "softspoken.speech.command":
        return success(speechController.command(message.command));
      case "softspoken.speech.speed":
        return success(speechController.setSpeed(message.speed));
      case "softspoken.speech.pitch":
        return success(speechController.setPitch(message.pitch));
      case "softspoken.speech.voice":
        preferredVoiceId = message.selectedVoiceId;
        return success(speechController.setVoice(message.selectedVoiceId));
      case "softspoken.speech.state-request":
        return success(speechController.getState());
      case "softspoken.speech.restore":
        return success(speechController.restore(message.checkpoint));
      case "softspoken.speech.voices":
        preferredVoiceId = message.preferredVoiceId;
        return getVoiceListResponse(message.preferredVoiceId);
      case "softspoken.speech.preview":
        return previewVoice(message.settings);
      default:
        return false;
    }
  },
);

if (typeof window.speechSynthesis !== "undefined") {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    broadcastVoices();
  });
}

function success(state: PlaybackState): PlaybackResponse {
  return { ok: true, state };
}

function broadcastState(state: PlaybackState): void {
  const message: PlaybackStateChangedMessage = {
    type: "softspoken.playback.state-changed",
    target: "popup",
    state,
  };

  playbackStateChannel.postMessage(message);

  const checkpointSignature = [
    state.status,
    state.currentParagraphIndex,
    state.completedParagraphCount,
    state.speed,
    state.errorMessage,
  ].join(":");

  if (checkpointSignature === lastCheckpointSignature) {
    return;
  }

  lastCheckpointSignature = checkpointSignature;
  const checkpointMessage: PlaybackCheckpointMessage = {
    type: "softspoken.playback.checkpoint",
    target: "background",
    state,
  };

  void browser.runtime.sendMessage(checkpointMessage).catch(() => {
    // A later state transition will retry the session-only checkpoint.
  });
}

async function getVoiceListResponse(
  preferredVoiceIdValue: string | undefined,
): Promise<VoiceListResponse> {
  if (typeof window.speechSynthesis === "undefined") {
    return {
      ok: false,
      error: {
        reason: "speech-unavailable",
        message: "Speech voices are unavailable in this browser.",
      },
    };
  }

  const voices = await waitForVoices();

  return {
    ok: true,
    voices,
    ...(preferredVoiceIdValue === undefined || hasVoice(preferredVoiceIdValue)
      ? {}
      : { unavailableVoiceId: preferredVoiceIdValue }),
  };
}

function previewVoice(settings: UserSettings): PlaybackResponse {
  const state = speechController.getState();

  if (state.status === "playing" || state.status === "loading") {
    return {
      ok: false,
      error: {
        reason: "speech-error",
        message: "Pause or stop playback before previewing a voice.",
      },
    };
  }

  try {
    const utterance = new SpeechSynthesisUtterance(
      "SoftSpoken will use this voice for local playback.",
    );
    utterance.rate = settings.speed;
    utterance.pitch = settings.pitch;
    const voice = findVoice(settings.voiceId);

    if (voice !== undefined) {
      utterance.voice = voice;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return success(state);
  } catch {
    return {
      ok: false,
      error: {
        reason: "speech-error",
        message: "SoftSpoken could not preview this voice.",
      },
    };
  }
}

function listVoices(): readonly VoiceOption[] {
  return window.speechSynthesis.getVoices().map((voice) => ({
    id: getVoiceId(voice),
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
    default: voice.default,
  }));
}

function broadcastVoices(): void {
  if (typeof window.speechSynthesis === "undefined") {
    return;
  }

  voiceChannel.postMessage({
    type: "softspoken.voices.changed",
    target: "popup",
    voices: listVoices(),
    ...(preferredVoiceId === undefined || hasVoice(preferredVoiceId)
      ? {}
      : { unavailableVoiceId: preferredVoiceId }),
  });
}

function waitForVoices(): Promise<readonly VoiceOption[]> {
  const initialVoices = listVoices();

  if (initialVoices.length > 0) {
    return Promise.resolve(initialVoices);
  }

  return new Promise((resolve) => {
    let timeoutId: number | undefined;

    const finish = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleChange);

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      resolve(listVoices());
    };

    const handleChange = () => finish();

    window.speechSynthesis.addEventListener("voiceschanged", handleChange);
    timeoutId = window.setTimeout(finish, 1500);
  });
}

function hasVoice(voiceId: string): boolean {
  return findVoice(voiceId) !== undefined;
}

function findVoice(
  voiceId: string | undefined,
): SpeechSynthesisVoice | undefined {
  if (voiceId === undefined) {
    return undefined;
  }

  return window.speechSynthesis
    .getVoices()
    .find((voice) => getVoiceId(voice) === voiceId);
}

function getVoiceId(voice: SpeechSynthesisVoice): string {
  return voice.voiceURI || `${voice.name}:${voice.lang}:${voice.localService}`;
}
