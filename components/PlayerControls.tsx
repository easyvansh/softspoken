import type { PlaybackState } from "@/types";

interface PlayerControlsProps {
  readonly state: PlaybackState;
  readonly canListen: boolean;
  readonly onListen: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onStop: () => void;
  readonly onPreviousParagraph: () => void;
  readonly onNextParagraph: () => void;
}

export function PlayerControls({
  state,
  canListen,
  onListen,
  onPause,
  onResume,
  onStop,
  onPreviousParagraph,
  onNextParagraph,
}: PlayerControlsProps) {
  const isBusy = state.status === "loading";
  const canPause = state.status === "playing";
  const canResume =
    state.status === "paused" ||
    (state.status === "error" && state.paragraphCount > 0);
  const canStop =
    state.status === "playing" ||
    state.status === "paused" ||
    state.status === "error" ||
    isBusy;
  const hasArticleParagraphs =
    state.source === "article" && state.paragraphCount > 0;
  const canNavigate =
    hasArticleParagraphs &&
    state.status !== "idle" &&
    state.status !== "stopped";

  return (
    <section className="control-group" aria-label="Playback controls">
      <button
        type="button"
        className="listen-button"
        disabled={!canListen || isBusy}
        onClick={onListen}
      >
        {isBusy ? "Starting..." : "Listen"}
      </button>
      <div className="paragraph-controls">
        <button
          type="button"
          disabled={!canNavigate || state.currentParagraphIndex === 0}
          onClick={onPreviousParagraph}
        >
          Previous paragraph
        </button>
        <button
          type="button"
          disabled={
            !canNavigate ||
            state.currentParagraphIndex >= state.paragraphCount - 1
          }
          onClick={onNextParagraph}
        >
          Next paragraph
        </button>
      </div>
      <div className="transport-controls">
        <button type="button" disabled={!canPause} onClick={onPause}>
          Pause
        </button>
        <button type="button" disabled={!canResume} onClick={onResume}>
          Resume
        </button>
        <button type="button" disabled={!canStop} onClick={onStop}>
          Stop
        </button>
      </div>
    </section>
  );
}
