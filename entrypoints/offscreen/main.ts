import { isSoftSpokenMessage } from "@/messaging";
import type {
  PlaybackResponse,
  PlaybackStateChangedMessage,
} from "@/messaging";
import type { PlaybackState } from "@/types";
import { SpeechController } from "./speechController";

const speechController = new SpeechController(broadcastState);

browser.runtime.onMessage.addListener(
  (message: unknown): PlaybackResponse | false => {
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
            message.source,
            message.source === "article" ? message.articleId : undefined,
          ),
        );
      case "softspoken.speech.command":
        return success(speechController.command(message.command));
      case "softspoken.speech.speed":
        return success(speechController.setSpeed(message.speed));
      case "softspoken.speech.state-request":
        return success(speechController.getState());
      default:
        return false;
    }
  },
);

function success(state: PlaybackState): PlaybackResponse {
  return { ok: true, state };
}

function broadcastState(state: PlaybackState): void {
  const message: PlaybackStateChangedMessage = {
    type: "softspoken.playback.state-changed",
    target: "popup",
    state,
  };

  void browser.runtime.sendMessage(message).catch(() => {
    // The popup may be closed; the offscreen owner keeps the state regardless.
  });
}
