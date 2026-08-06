import type { PageInformationError, PageInformationLoadState } from "@/types";

interface CurrentPageDetailsProps {
  readonly state: PageInformationLoadState;
}

export function CurrentPageDetails({ state }: CurrentPageDetailsProps) {
  if (state.status === "loading") {
    return (
      <section className="page-status" aria-live="polite">
        <p className="eyebrow">Current page</p>
        <h2>Checking page</h2>
        <p>Looking for readable content.</p>
      </section>
    );
  }

  if (state.status === "failure") {
    const presentation = getFailurePresentation(state.error);

    return (
      <section
        className={`page-status page-status--${presentation.tone}`}
        aria-live="polite"
      >
        <h2>{presentation.heading}</h2>
        <p>{state.error.message}</p>
      </section>
    );
  }

  return (
    <section className="page-status" aria-live="polite">
      <p className="eyebrow">Current page</p>
      <h2>{state.page.title}</h2>
      <p className="page-hostname">{state.page.hostname}</p>
      <p className="selection-status">
        {state.page.hasSelectedText
          ? formatSelectionCount(state.page.selectedTextCharacterCount)
          : "No text selected"}
      </p>
    </section>
  );
}

function formatSelectionCount(characterCount: number): string {
  const unit = characterCount === 1 ? "character" : "characters";
  return `Reading selection - ${characterCount} ${unit}`;
}

interface FailurePresentation {
  readonly heading: string;
  readonly tone: "warning" | "error";
}

function getFailurePresentation(
  error: PageInformationError,
): FailurePresentation {
  switch (error.reason) {
    case "no-active-tab":
      return { heading: "No active tab", tone: "warning" };
    case "unsupported-page":
      return { heading: "Unsupported page", tone: "warning" };
    case "inaccessible-page":
      return { heading: "Cannot inspect this page", tone: "warning" };
    case "invalid-page-response":
    case "messaging-failure":
      return { heading: "Page information unavailable", tone: "error" };
  }
}
