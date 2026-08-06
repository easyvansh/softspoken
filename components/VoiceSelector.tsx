interface VoiceSelectorProps {
  readonly disabled: boolean;
}

export function VoiceSelector({ disabled }: VoiceSelectorProps) {
  return (
    <label className="field">
      <span>Voice</span>
      <select
        value="system-placeholder"
        disabled={disabled}
        aria-label="Speech voice"
      >
        <option value="system-placeholder">System voice</option>
      </select>
    </label>
  );
}
