import type { ArticleLoadState } from "@/types";

interface ArticleDetailsProps {
  readonly state: ArticleLoadState;
}

export function ArticleDetails({ state }: ArticleDetailsProps) {
  if (state.status === "unsupported-page") {
    return (
      <section className="page-status page-status--warning" aria-live="polite">
        <h2>Unsupported page</h2>
        <p>{state.message}</p>
      </section>
    );
  }

  if (state.status === "extraction-error") {
    return (
      <section className="page-status page-status--error" aria-live="polite">
        <h2>Extraction error</h2>
        <p>{state.error.message}</p>
      </section>
    );
  }

  if (state.status === "ready") {
    return (
      <section className="page-status" aria-live="polite">
        <p className="eyebrow">
          {state.article.source === "selection"
            ? "Selected text"
            : "Current article"}
        </p>
        <h2>{state.article.title}</h2>
        <p>{state.article.paragraphs.length} paragraphs ready</p>
      </section>
    );
  }

  return (
    <section className="page-status" aria-live="polite">
      <p className="eyebrow">Current page</p>
      <h2>No article loaded yet</h2>
      <p>
        Open a readable page, then listen when page extraction is available.
      </p>
    </section>
  );
}
