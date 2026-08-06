import type { PlaybackState } from "@/types";

interface PlaybackStatusProps {
  readonly state: PlaybackState;
  readonly actionError?: string;
}

export function PlaybackStatus({ state, actionError }: PlaybackStatusProps) {
  const errorMessage = actionError ?? state.errorMessage;

  if (state.status === "idle" && errorMessage === undefined) {
    return null;
  }

  const progress =
    state.paragraphCount === 0
      ? 0
      : Math.round(
          (state.completedParagraphCount / state.paragraphCount) * 100,
        );
  const remainingParagraphs = Math.max(
    0,
    state.status === "completed"
      ? 0
      : state.paragraphCount - state.currentParagraphIndex - 1,
  );

  return (
    <section
      className={`playback-status${
        errorMessage === undefined ? "" : " playback-status--error"
      }`}
      aria-label="Playback status"
      aria-live="polite"
    >
      <strong>{getStatusLabel(state, errorMessage)}</strong>
      {errorMessage !== undefined && (
        <span role="alert">{getRecoveryMessage(errorMessage, state)}</span>
      )}

      {state.paragraphCount > 0 && (
        <>
          <span>
            {state.source === "article" ? "Paragraph" : "Part"}{" "}
            {state.currentParagraphIndex + 1} of {state.paragraphCount}
          </span>
          <progress
            max={state.paragraphCount}
            value={state.completedParagraphCount}
            aria-label={`Playback progress, ${progress}% complete`}
          />
          <dl className="playback-metrics">
            <div>
              <dt>Progress</dt>
              <dd>{progress}%</dd>
            </div>
            <div>
              <dt>Remaining</dt>
              <dd>
                {remainingParagraphs}{" "}
                {state.source === "article" ? "paragraphs" : "parts"}
              </dd>
            </div>
            <div>
              <dt>Elapsed</dt>
              <dd>{formatDuration(state.elapsedSeconds)}</dd>
            </div>
            <div>
              <dt>Time left</dt>
              <dd>{formatDuration(state.estimatedRemainingSeconds)}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}

function getRecoveryMessage(
  errorMessage: string,
  state: PlaybackState,
): string {
  if (state.paragraphCount > 0) {
    return `${errorMessage} Resume will retry from the current ${
      state.source === "article" ? "paragraph" : "part"
    }.`;
  }

  return `${errorMessage} Select text or open a readable article, then try Listen again.`;
}

function getStatusLabel(
  state: PlaybackState,
  errorMessage: string | undefined,
): string {
  if (errorMessage !== undefined) {
    return "Playback error";
  }

  switch (state.status) {
    case "loading":
      return "Starting";
    case "playing":
      return state.source === "selection"
        ? "Reading Selection"
        : "Reading Article";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "error":
      return "Playback error";
    case "idle":
    case "stopped":
      return "Stopped";
  }
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
