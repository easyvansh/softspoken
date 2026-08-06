import type { PlaybackState } from "@/types";
import { defaultSettings } from "@/types";

export const initialPlaybackState: PlaybackState = {
  status: "idle",
  paragraphIndex: 0,
  paragraphCount: 0,
  speed: defaultSettings.speed,
};
