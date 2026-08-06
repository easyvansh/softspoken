import { extractArticle } from "@/core";
import { isSoftSpokenMessage } from "@/messaging";
import type {
  ArticleExtractionResponse,
  SelectionTextResponse,
} from "@/messaging";
import type { PageSnapshot } from "@/types";

export default defineContentScript({
  registration: "runtime",
  main(context): PageSnapshot {
    const selectionListener = (
      message: unknown,
    ): ArticleExtractionResponse | SelectionTextResponse | false => {
      if (!isSoftSpokenMessage(message) || !("target" in message)) {
        return false;
      }

      if (
        message.type === "softspoken.selection.request" &&
        message.target === "content"
      ) {
        return {
          ok: true,
          text: window.getSelection()?.toString() ?? "",
        };
      }

      if (
        message.type === "softspoken.article.content-request" &&
        message.target === "content"
      ) {
        try {
          const article = extractArticle(document, location.href);

          return article === undefined
            ? {
                ok: false,
                error: {
                  reason: "no-readable-content",
                  message: "SoftSpoken could not find a readable article.",
                },
              }
            : { ok: true, article };
        } catch {
          return {
            ok: false,
            error: {
              reason: "unexpected-error",
              message: "SoftSpoken could not extract this article.",
            },
          };
        }
      }

      return false;
    };

    browser.runtime.onMessage.addListener(selectionListener);
    context.onInvalidated(() => {
      browser.runtime.onMessage.removeListener(selectionListener);
    });

    return {
      title: document.title,
      pageUrl: location.href,
      selectedText: window.getSelection()?.toString() ?? "",
    };
  },
});
