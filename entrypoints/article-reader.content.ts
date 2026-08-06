import { extractArticle } from "@/core";
import type { ArticleExtractionResponse } from "@/messaging";

export default defineContentScript({
  registration: "runtime",
  main(): ArticleExtractionResponse {
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
  },
});
