export type ArticleSource = "selection" | "article";

export type ExtractionFailureReason =
  | "unsupported-page"
  | "no-readable-content"
  | "empty-selection"
  | "unexpected-error";

export interface ArticleParagraph {
  readonly id: string;
  readonly index: number;
  readonly text: string;
}

export interface ExtractedArticle {
  readonly id: string;
  readonly source: ArticleSource;
  readonly title: string;
  readonly pageUrl: string;
  readonly siteName?: string;
  readonly byline?: string;
  readonly extractedAt: string;
  readonly paragraphs: readonly ArticleParagraph[];
}

export interface ArticleExtractionError {
  readonly reason: ExtractionFailureReason;
  readonly message: string;
}

export type ArticleLoadState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly article: ExtractedArticle }
  | { readonly status: "unsupported-page"; readonly message: string }
  | {
      readonly status: "extraction-error";
      readonly error: ArticleExtractionError;
    };
