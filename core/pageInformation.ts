import type { PageInformation, PageSnapshot } from "@/types";
import { isPotentiallySupportedPage } from "./pageSupport";

export function createPageInformation(
  snapshot: PageSnapshot,
): PageInformation | undefined {
  if (!isPotentiallySupportedPage(snapshot.pageUrl)) {
    return undefined;
  }

  const url = new URL(snapshot.pageUrl);
  const selectedText = snapshot.selectedText.trim();
  const base = {
    title: snapshot.title.trim() || "Untitled page",
    hostname: url.hostname,
    pageUrl: url.href,
  };

  if (selectedText.length === 0) {
    return {
      ...base,
      hasSelectedText: false,
    };
  }

  return {
    ...base,
    hasSelectedText: true,
    selectedTextCharacterCount: Array.from(selectedText).length,
  };
}

export function isPageSnapshot(value: unknown): value is PageSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.pageUrl === "string" &&
    typeof value.selectedText === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
