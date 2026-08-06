import type { SpeechSpeed } from "./settings";

export type PlaybackStatus =
  "idle" | "loading" | "playing" | "paused" | "stopped" | "error";

export interface PlaybackPosition {
  readonly articleId: string;
  readonly paragraphId: string;
  readonly paragraphIndex: number;
  readonly characterOffset: number;
}

export interface PlaybackState {
  readonly status: PlaybackStatus;
  readonly articleId?: string;
  readonly paragraphIndex: number;
  readonly paragraphCount: number;
  readonly speed: SpeechSpeed;
  readonly voiceId?: string;
  readonly errorMessage?: string;
}

export interface PlaybackProgress {
  readonly articleId: string;
  readonly pageUrl: string;
  readonly updatedAt: string;
  readonly position: PlaybackPosition;
}

export type PlaybackCommand =
  | "listen"
  | "play"
  | "pause"
  | "stop"
  | "previous-paragraph"
  | "next-paragraph";
