import type { ArticleLoadState, PlaybackState } from "@/types";

interface UpcomingParagraphsProps {
  readonly articleState: ArticleLoadState;
  readonly playbackState: PlaybackState;
}

export function UpcomingParagraphs({
  articleState,
  playbackState,
}: UpcomingParagraphsProps) {
  if (
    articleState.status !== "ready" ||
    playbackState.source !== "article" ||
    playbackState.paragraphCount === 0
  ) {
    return null;
  }

  const paragraphs = articleState.article.blocks.filter(
    (block) => block.kind === "paragraph",
  );
  const upcoming = paragraphs.slice(
    playbackState.currentParagraphIndex + 1,
    playbackState.currentParagraphIndex + 4,
  );

  if (upcoming.length === 0) {
    return (
      <section className="upcoming-panel" aria-label="Upcoming paragraphs">
        <h2 className="section-title">Upcoming</h2>
        <p>No remaining paragraphs.</p>
      </section>
    );
  }

  return (
    <section className="upcoming-panel" aria-label="Upcoming paragraphs">
      <h2 className="section-title">Upcoming</h2>
      <p className="panel-note">
        Next {upcoming.length === 1 ? "paragraph" : "paragraphs"} in the queue.
      </p>
      <ol>
        {upcoming.map((paragraph) => (
          <li key={paragraph.id}>{paragraph.text}</li>
        ))}
      </ol>
    </section>
  );
}
