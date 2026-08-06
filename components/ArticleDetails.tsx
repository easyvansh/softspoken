import { estimateListeningMinutes } from "@/core";
import type { ArticleLoadState, SpeechSpeed } from "@/types";

interface ArticleDetailsProps {
  readonly state: ArticleLoadState;
  readonly speed: SpeechSpeed;
}

export function ArticleDetails({ state, speed }: ArticleDetailsProps) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <section
        className="article-status article-status--loading"
        aria-live="polite"
      >
        <p className="eyebrow">Article</p>
        <h2>Finding article</h2>
        <p>Preparing the main text.</p>
      </section>
    );
  }

  if (state.status === "unsupported-page") {
    return (
      <section
        className="article-status article-status--warning"
        aria-live="polite"
      >
        <p className="eyebrow">Article</p>
        <h2>Unsupported Page</h2>
        <p>{state.message}</p>
      </section>
    );
  }

  if (state.status === "extraction-error") {
    return (
      <section
        className="article-status article-status--error"
        aria-live="polite"
      >
        <p className="eyebrow">Article</p>
        <h2>Extraction Failed</h2>
        <p>
          {state.error.message} Select text to listen to a specific section.
        </p>
      </section>
    );
  }

  const listeningMinutes = estimateListeningMinutes(
    state.article.wordCount,
    speed,
  );

  return (
    <section
      className="article-status article-status--ready"
      aria-live="polite"
    >
      <span className="article-icon" aria-hidden="true" />
      <div className="article-copy">
        <h2>{state.article.title}</h2>
        <p className="article-author">
          {state.article.siteName ??
            (state.article.author === undefined
              ? new URL(state.article.pageUrl).hostname
              : `By ${state.article.author}`)}
        </p>
        <p className="article-summary">
          {formatMinutes(listeningMinutes)} listen | {state.article.wordCount}{" "}
          words
        </p>
        <span className="status-badge">Article detected</span>
      </div>
    </section>
  );
}

function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}
