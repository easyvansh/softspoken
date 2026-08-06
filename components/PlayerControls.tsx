interface PlayerControlsProps {
  readonly disabled: boolean;
}

export function PlayerControls({ disabled }: PlayerControlsProps) {
  return (
    <section className="control-group" aria-label="Playback controls">
      <button type="button" className="listen-button" disabled={disabled}>
        Listen
      </button>
      <div className="transport-controls">
        <button
          type="button"
          disabled={disabled}
          aria-label="Previous paragraph"
        >
          Previous
        </button>
        <button type="button" disabled={disabled} aria-label="Play or pause">
          Play/Pause
        </button>
        <button type="button" disabled={disabled} aria-label="Next paragraph">
          Next
        </button>
      </div>
    </section>
  );
}
