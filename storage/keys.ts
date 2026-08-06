export const storageKeys = {
  playbackProgress: "softspoken.playbackProgress",
  settings: "softspoken.settings",
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];
