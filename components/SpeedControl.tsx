import type { SpeechSpeed } from "@/types";
import { speechSpeedOptions } from "@/types";

interface SpeedControlProps {
  readonly value: SpeechSpeed;
  readonly disabled: boolean;
}

export function SpeedControl({ value, disabled }: SpeedControlProps) {
  return (
    <label className="field">
      <span>Speed</span>
      <select value={value} disabled={disabled} aria-label="Speech speed">
        {speechSpeedOptions.map((speed) => (
          <option key={speed} value={speed}>
            {speed}x
          </option>
        ))}
      </select>
    </label>
  );
}
