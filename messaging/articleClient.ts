import type { ArticleLoadState } from "@/types";
import { isArticleExtractionResponse } from "./messages";
import type { ArticleLoadRequest } from "./types";

const request: ArticleLoadRequest = {
  type: "softspoken.article.extract-request",
};

export async function loadCurrentArticle(): Promise<ArticleLoadState> {
  try {
    const response: unknown = await browser.runtime.sendMessage<
      ArticleLoadRequest,
      unknown
    >(request);

    if (!isArticleExtractionResponse(response)) {
      return extractionError(
        "unexpected-error",
        "SoftSpoken received an invalid article response.",
      );
    }

    if (response.ok) {
      return { status: "ready", article: response.article };
    }

    return response.error.reason === "unsupported-page"
      ? { status: "unsupported-page", message: response.error.message }
      : { status: "extraction-error", error: response.error };
  } catch {
    return extractionError(
      "unexpected-error",
      "SoftSpoken could not extract this article. Please try again.",
    );
  }
}

function extractionError(
  reason: "unexpected-error",
  message: string,
): ArticleLoadState {
  return { status: "extraction-error", error: { reason, message } };
}
