import type { PlaybackState } from "@/types";

interface PlayerControlsProps {
  readonly state: PlaybackState;
  readonly canListen: boolean;
  readonly listenContext:
    "selection" | "article" | "loading-article" | "unavailable";
  readonly onListen: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onStop: () => void;
}

export function PlayerControls({
  state,
  canListen,
  listenContext,
  onListen,
  onPause,
  onResume,
  onStop,
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

  const listenLabel = getListenLabel(isBusy, listenContext);
  const listenHelp = getListenHelp(canListen, isBusy, listenContext);

  return (
    <section className="control-group" aria-label="Playback controls">
      <button
        type="button"
        className="listen-button"
        disabled={!canListen || isBusy}
        aria-describedby="listen-help"
        onClick={onListen}
      >
        {listenLabel}
      </button>
      <p id="listen-help" className="control-help">
        {listenHelp}
      </p>
      <div className="transport-controls">
        <button
          type="button"
          className="transport-button"
          disabled={!canPause}
          aria-label="Pause playback"
          onClick={onPause}
        >
          <span aria-hidden="true">&#8545;</span>
        </button>
        <button
          type="button"
          className="transport-button transport-button--primary"
          disabled={!canResume}
          aria-label="Resume playback"
          onClick={onResume}
        >
          <span aria-hidden="true">&#9654;</span>
        </button>
        <button
          type="button"
          className="transport-button"
          disabled={!canStop}
          aria-label="Stop playback"
          onClick={onStop}
        >
          <span aria-hidden="true">&#9632;</span>
        </button>
      </div>
    </section>
  );
}

function getListenLabel(
  isBusy: boolean,
  listenContext: PlayerControlsProps["listenContext"],
): string {
  if (isBusy) {
    return "Starting";
  }

  switch (listenContext) {
    case "selection":
      return "Listen to Selection";
    case "article":
      return "Listen to Article";
    case "loading-article":
    case "unavailable":
      return "Listen";
  }
}

function getListenHelp(
  canListen: boolean,
  isBusy: boolean,
  listenContext: PlayerControlsProps["listenContext"],
): string {
  if (isBusy) {
    return "Preparing playback.";
  }

  if (canListen && listenContext === "selection") {
    return "Reading Selection";
  }

  if (canListen && listenContext === "article") {
    return "Reading Article";
  }

  if (listenContext === "loading-article") {
    return "Finding article.";
  }

  return "No Text Selected";
}

interface ParagraphNavigationProps {
  readonly state: PlaybackState;
  readonly onPreviousParagraph: () => void;
  readonly onNextParagraph: () => void;
}

export function ParagraphNavigation({
  state,
  onPreviousParagraph,
  onNextParagraph,
}: ParagraphNavigationProps) {
  const hasArticleParagraphs =
    state.source === "article" && state.paragraphCount > 0;
  const canNavigate =
    hasArticleParagraphs &&
    state.status !== "idle" &&
    state.status !== "stopped";

  if (!canNavigate) {
    return null;
  }

  return (
    <section className="navigation-panel" aria-label="Paragraph navigation">
      <h2 className="section-title">Navigation</h2>
      <div className="paragraph-controls">
        <button
          type="button"
          className="paragraph-button"
          disabled={!canNavigate || state.currentParagraphIndex === 0}
          aria-label="Go to previous paragraph"
          onClick={onPreviousParagraph}
        >
          <span aria-hidden="true">&#10094;</span>
          <span>Previous</span>
        </button>
        <button
          type="button"
          className="paragraph-button"
          disabled={
            !canNavigate ||
            state.currentParagraphIndex >= state.paragraphCount - 1
          }
          aria-label="Go to next paragraph"
          onClick={onNextParagraph}
        >
          <span>Next</span>
          <span aria-hidden="true">&#10095;</span>
        </button>
      </div>
    </section>
  );
}
