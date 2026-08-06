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
        <h2>Finding the article...</h2>
        <p>
          SoftSpoken is reading a local copy of this page and looking for the
          main text.
        </p>
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
        <h2>Article unavailable</h2>
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
        <h2>Extraction failed</h2>
        <p>
          {state.error.message} Select text on the page and press Listen to read
          a selection instead.
        </p>
      </section>
    );
  }

  const listeningMinutes = estimateListeningMinutes(
    state.article.wordCount,
    speed,
  );

  return (
    <section className="article-status" aria-live="polite">
      <p className="eyebrow">Article</p>
      <h2>{state.article.title}</h2>
      <p className="article-author">
        {state.article.author === undefined
          ? "Author unavailable"
          : `By ${state.article.author}`}
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
