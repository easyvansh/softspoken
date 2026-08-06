import type {
  ArticleLoadState,
  PlaybackProgressLoadState,
  PlaybackProgressRecord,
} from "@/types";

interface ResumePromptProps {
  readonly articleState: ArticleLoadState;
  readonly progressState: PlaybackProgressLoadState;
  readonly onResume: () => void;
  readonly onRestart: () => void;
}

export function ResumePrompt({
  articleState,
  progressState,
  onResume,
  onRestart,
}: ResumePromptProps) {
  if (progressState.status === "none") {
    return null;
  }

  if (progressState.status === "unavailable") {
    return (
      <section className="resume-panel resume-panel--warning">
        <h2>Continue Listening</h2>
        <p>{progressState.message}</p>
      </section>
    );
  }

  const progress = progressState.progress;
  const canResume =
    articleState.status === "ready" &&
    (articleState.article.id === progress.articleId ||
      articleState.article.pageUrl === progress.url);

  return (
    <section className="resume-panel" aria-label="Saved listening position">
      <h2>Continue Listening</h2>
      <p>{progress.title}</p>
      <dl className="resume-metrics">
        <div>
          <dt>Paragraph</dt>
          <dd>{progress.paragraphIndex + 1}</dd>
        </div>
        <div>
          <dt>Sentence</dt>
          <dd>{progress.sentenceIndex + 1}</dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{progress.speed}x</dd>
        </div>
        <div>
          <dt>Stopped</dt>
          <dd>{formatTimestamp(progress)}</dd>
        </div>
      </dl>
      {!canResume && (
        <p className="resume-warning">
          Saved progress exists locally, but this page cannot currently be
          matched.
        </p>
      )}
      <div className="resume-actions">
        <button type="button" disabled={!canResume} onClick={onResume}>
          Resume
        </button>
        <button
          type="button"
          disabled={articleState.status !== "ready"}
          onClick={onRestart}
        >
          Restart
        </button>
      </div>
    </section>
  );
}

function formatTimestamp(progress: PlaybackProgressRecord): string {
  const date = new Date(progress.timestamp);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}
