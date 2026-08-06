export type ArticleSource = "article";
export type ArticleExtractionMethod = "readability" | "fallback";

export type ExtractionFailureReason =
  "unsupported-page" | "no-readable-content" | "unexpected-error";

interface ArticleBlockBase {
  readonly id: string;
  readonly index: number;
  readonly text: string;
}

export interface ArticleParagraph extends ArticleBlockBase {
  readonly kind: "paragraph";
}

export interface ArticleHeading extends ArticleBlockBase {
  readonly kind: "heading";
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
}

export type ArticleBlock = ArticleParagraph | ArticleHeading;

export interface ExtractedArticle {
  readonly id: string;
  readonly source: ArticleSource;
  readonly extractionMethod: ArticleExtractionMethod;
  readonly title: string;
  readonly pageUrl: string;
  readonly siteName?: string;
  readonly author?: string;
  readonly extractedAt: string;
  readonly blocks: readonly ArticleBlock[];
  readonly paragraphCount: number;
  readonly headingCount: number;
  readonly wordCount: number;
  readonly estimatedReadingMinutes: number;
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
