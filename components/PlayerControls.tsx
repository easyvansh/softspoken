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
      <h2 className="section-title">Play</h2>
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
          disabled={!canPause}
          aria-label="Pause playback"
          onClick={onPause}
        >
          Pause
        </button>
        <button
          type="button"
          disabled={!canResume}
          aria-label="Resume playback"
          onClick={onResume}
        >
          Resume
        </button>
        <button
          type="button"
          disabled={!canStop}
          aria-label="Stop playback"
          onClick={onStop}
        >
          Stop
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
    return "Starting playback...";
  }

  switch (listenContext) {
    case "selection":
      return "Listen to selection";
    case "article":
      return "Listen to article";
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
    return "Preparing local speech playback.";
  }

  if (canListen && listenContext === "selection") {
    return "Selected text is ready to read aloud.";
  }

  if (canListen && listenContext === "article") {
    return "The extracted article is ready to read aloud.";
  }

  if (listenContext === "loading-article") {
    return "Listen will be available after article extraction finishes.";
  }

  return "Open a readable page or select text to enable listening.";
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

  return (
    <section className="navigation-panel" aria-label="Paragraph navigation">
      <h2 className="section-title">Navigation</h2>
      <div className="paragraph-controls">
        <button
          type="button"
          disabled={!canNavigate || state.currentParagraphIndex === 0}
          aria-label="Go to previous paragraph"
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
          aria-label="Go to next paragraph"
          onClick={onNextParagraph}
        >
          Next paragraph
        </button>
      </div>
    </section>
  );
}
