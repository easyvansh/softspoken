import type { SpeechPitch } from "@/types";
import { isSpeechPitch, speechPitchOptions } from "@/types";

interface PitchControlProps {
  readonly value: SpeechPitch;
  readonly disabled: boolean;
  readonly onChange: (pitch: SpeechPitch) => void;
}

export function PitchControl({ value, disabled, onChange }: PitchControlProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const pitch = Number(event.target.value);

    if (isSpeechPitch(pitch)) {
      onChange(pitch);
    }
  };

  return (
    <label className="field">
      <span>Pitch</span>
      <select
        value={value}
        disabled={disabled}
        aria-label="Speech pitch"
        onChange={handleChange}
      >
        {speechPitchOptions.map((pitch) => (
          <option key={pitch} value={pitch}>
            {pitch}x pitch
          </option>
        ))}
      </select>
    </label>
  );
}
