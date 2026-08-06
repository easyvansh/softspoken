export type SpeechSpeed = 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;
export type SpeechPitch = 0.75 | 1 | 1.25 | 1.5;

export interface VoiceOption {
  readonly id: string;
  readonly name: string;
  readonly lang: string;
  readonly localService: boolean;
  readonly default: boolean;
}

export interface UserSettings {
  readonly speed: SpeechSpeed;
  readonly pitch: SpeechPitch;
  readonly voiceId?: string;
}

export const defaultSettings: UserSettings = {
  speed: 1,
  pitch: 1,
};

export const speechSpeedOptions = [
  0.75, 1, 1.25, 1.5, 1.75, 2,
] as const satisfies readonly SpeechSpeed[];

export const speechPitchOptions = [
  0.75, 1, 1.25, 1.5,
] as const satisfies readonly SpeechPitch[];

export function isSpeechSpeed(value: unknown): value is SpeechSpeed {
  return (
    typeof value === "number" &&
    speechSpeedOptions.some((speed) => speed === value)
  );
}

export function isSpeechPitch(value: unknown): value is SpeechPitch {
  return (
    typeof value === "number" &&
    speechPitchOptions.some((pitch) => pitch === value)
  );
}
