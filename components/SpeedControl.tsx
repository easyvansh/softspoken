import type { SpeechSpeed } from "@/types";
import { isSpeechSpeed, speechSpeedOptions } from "@/types";

interface SpeedControlProps {
  readonly value: SpeechSpeed;
  readonly disabled: boolean;
  readonly onChange: (speed: SpeechSpeed) => void;
}

export function SpeedControl({ value, disabled, onChange }: SpeedControlProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = Number(event.target.value);

    if (isSpeechSpeed(speed)) {
      onChange(speed);
    }
  };

  return (
    <label className="field">
      <span>Speed</span>
      <select
        value={value}
        disabled={disabled}
        aria-label="Speech speed"
        onChange={handleChange}
      >
        {speechSpeedOptions.map((speed) => (
          <option key={speed} value={speed}>
            {speed}x
          </option>
        ))}
      </select>
    </label>
  );
}
