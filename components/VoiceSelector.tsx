import type { VoiceOption } from "@/types";

interface VoiceSelectorProps {
  readonly value: string | undefined;
  readonly voices: readonly VoiceOption[];
  readonly disabled: boolean;
  readonly unavailableVoiceId?: string;
  readonly onChange: (voiceId: string | undefined) => void;
  readonly onRefresh: () => void;
}

export function VoiceSelector({
  value,
  voices,
  disabled,
  unavailableVoiceId,
  onChange,
  onRefresh,
}: VoiceSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(
      event.target.value === "system-default" ? undefined : event.target.value,
    );
  };

  return (
    <label className="field">
      <span>Voice</span>
      <select
        value={value ?? "system-default"}
        disabled={disabled}
        aria-label="Speech voice"
        onChange={handleChange}
      >
        <option value="system-default">System voice</option>
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name} ({voice.lang})
          </option>
        ))}
      </select>
      <button
        type="button"
        className="secondary-button"
        disabled={disabled}
        onClick={onRefresh}
      >
        Refresh voices
      </button>
      {voices.length === 0 && (
        <span className="field-note" role="status">
          System voices are still loading. Try Refresh voices, or reload the extension if Chrome has not exposed them yet.
        </span>
      )}
      {unavailableVoiceId !== undefined && (
        <span className="field-note" role="status">
          Preferred voice is unavailable. SoftSpoken is using the system voice.
        </span>
      )}
    </label>
  );
}
