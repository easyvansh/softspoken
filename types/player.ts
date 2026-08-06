import type { SpeechPitch, SpeechSpeed } from "./settings";

export type PlaybackStatus =
  "idle" | "loading" | "playing" | "paused" | "stopped" | "completed" | "error";

export type PlaybackSource = "selection" | "article";

export interface SpeechChunk {
  readonly id: string;
  readonly text: string;
  readonly wordCount: number;
}

export interface PlaybackState {
  readonly status: PlaybackStatus;
  readonly source?: PlaybackSource;
  readonly articleId?: string;
  readonly currentParagraphIndex: number;
  readonly currentSentenceIndex: number;
  readonly paragraphCount: number;
  readonly completedParagraphCount: number;
  readonly speed: SpeechSpeed;
  readonly pitch: SpeechPitch;
  readonly selectedVoiceId?: string;
  readonly elapsedSeconds: number;
  readonly estimatedRemainingSeconds: number;
  readonly errorMessage?: string;
}

export interface PlaybackProgressRecord {
  readonly version: 1;
  readonly articleId: string;
  readonly url: string;
  readonly title: string;
  readonly paragraphIndex: number;
  readonly sentenceIndex: number;
  readonly timestamp: string;
  readonly speed: SpeechSpeed;
  readonly pitch: SpeechPitch;
  readonly selectedVoiceId?: string;
}

export type PlaybackProgressLoadState =
  | { readonly status: "none" }
  | { readonly status: "ready"; readonly progress: PlaybackProgressRecord }
  | {
      readonly status: "deleted-page";
      readonly progress: PlaybackProgressRecord;
    }
  | { readonly status: "unavailable"; readonly message: string };

export interface PlaybackSessionCheckpoint {
  readonly version: 1;
  readonly chunks: readonly SpeechChunk[];
  readonly state: PlaybackState;
}

export type PlaybackCommand =
  "pause" | "resume" | "stop" | "previous-paragraph" | "next-paragraph";

export type PlaybackFailureReason =
  | "empty-selection"
  | "selection-unavailable"
  | "no-playback-session"
  | "speech-unavailable"
  | "speech-error"
  | "messaging-failure";

export interface PlaybackError {
  readonly reason: PlaybackFailureReason;
  readonly message: string;
}
