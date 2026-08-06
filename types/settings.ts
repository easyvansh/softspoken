export type SpeechSpeed = 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface UserSettings {
  readonly speed: SpeechSpeed;
  readonly voiceId?: string;
}

export const defaultSettings: UserSettings = {
  speed: 1,
};

export const speechSpeedOptions = [
  0.75, 1, 1.25, 1.5, 1.75, 2,
] as const satisfies readonly SpeechSpeed[];
