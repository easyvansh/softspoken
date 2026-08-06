import type { PlaybackState } from "@/types";
import { defaultSettings } from "@/types";

export const initialPlaybackState: PlaybackState = {
  status: "idle",
  currentParagraphIndex: 0,
  paragraphCount: 0,
  completedParagraphCount: 0,
  speed: defaultSettings.speed,
  elapsedSeconds: 0,
  estimatedRemainingSeconds: 0,
};
