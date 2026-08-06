export const storageKeys = {
  playbackProgress: "softspoken.playbackProgress",
  playbackSession: "softspoken.playbackSession",
  settings: "softspoken.settings",
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];
