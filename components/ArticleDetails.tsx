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
      <section className="article-status" aria-live="polite">
        <p className="eyebrow">Current article</p>
        <h2>Extracting article...</h2>
        <p>Finding the main content on this page.</p>
      </section>
    );
  }

  if (state.status === "unsupported-page") {
    return (
      <section
        className="article-status article-status--warning"
        aria-live="polite"
      >
        <h2>Unsupported page</h2>
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
        <h2>Article extraction failed</h2>
        <p>{state.error.message}</p>
      </section>
    );
  }

  const listeningMinutes = estimateListeningMinutes(
    state.article.wordCount,
    speed,
  );

  return (
    <section className="article-status" aria-live="polite">
      <p className="eyebrow">Current article</p>
      <h2>{state.article.title}</h2>
      <p className="article-author">
        By {state.article.author ?? "Unknown author"}
      </p>
      <dl className="article-metrics">
        <div>
          <dt>Paragraphs</dt>
          <dd>{state.article.paragraphCount}</dd>
        </div>
        <div>
          <dt>Words</dt>
          <dd>{state.article.wordCount}</dd>
        </div>
        <div>
          <dt>Reading</dt>
          <dd>{formatMinutes(state.article.estimatedReadingMinutes)}</dd>
        </div>
        <div>
          <dt>Listening</dt>
          <dd>{formatMinutes(listeningMinutes)}</dd>
        </div>
      </dl>
    </section>
  );
}

function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}
