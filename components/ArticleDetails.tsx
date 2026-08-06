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
    <section className="article-status" aria-live="polite">
      <p className="eyebrow">Article</p>
      <h2>{state.article.title}</h2>
      <p className="article-author">
        {state.article.author === undefined
          ? "Author unavailable"
          : `By ${state.article.author}`}
      </p>
      <p className="article-summary">
        {state.article.paragraphCount} paragraphs | {state.article.wordCount}{" "}
        words | {formatMinutes(listeningMinutes)} listen
      </p>
    </section>
  );
}

function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}
