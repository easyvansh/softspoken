import { Readability } from "@mozilla/readability";
import type { ArticleBlock, ArticleHeading, ExtractedArticle } from "@/types";
import { normalizeSpeechText } from "./speechText";

const minimumArticleWords = 80;
const minimumArticleParagraphs = 2;
const readingWordsPerMinute = 200;
const listeningWordsPerMinute = 150;

const noiseSelectors = [
  "nav",
  "aside",
  "[role='navigation']",
  "[role='dialog']",
  "[aria-modal='true']",
  ".advertisement",
  ".advert",
  ".ad-container",
  ".comments",
  ".comment-list",
  ".newsletter",
  ".newsletter-signup",
  ".related-articles",
  ".related-posts",
  "#comments",
  "#newsletter",
] as const;

const noisyIdentityPattern =
  /(?:^|[-_\s])(ad|ads|advert|comments?|menu|nav|newsletter|popup|related|share|social)(?:$|[-_\s])/iu;

export function extractArticle(
  sourceDocument: Document,
  pageUrl: string,
  extractedAt = new Date().toISOString(),
): ExtractedArticle | undefined {
  const readabilityDocument = cloneAndCleanDocument(sourceDocument);
  const parsedArticle = new Readability(readabilityDocument).parse();

  if (typeof parsedArticle?.content === "string") {
    const contentDocument = sourceDocument.implementation.createHTMLDocument();
    contentDocument.body.innerHTML = parsedArticle.content;
    const blocks = extractBlocks(contentDocument.body, false);
    const article = createArticle({
      blocks,
      extractionMethod: "readability",
      title: parsedArticle.title,
      author: parsedArticle.byline,
      siteName: parsedArticle.siteName,
      pageUrl,
      extractedAt,
      sourceDocument,
    });

    if (article !== undefined) {
      return article;
    }
  }

  return extractFallbackArticle(sourceDocument, pageUrl, extractedAt);
}

export function extractFallbackArticle(
  sourceDocument: Document,
  pageUrl: string,
  extractedAt = new Date().toISOString(),
): ExtractedArticle | undefined {
  const documentClone = cloneAndCleanDocument(sourceDocument);
  const candidate = findBestFallbackCandidate(documentClone);

  if (candidate === undefined) {
    return undefined;
  }

  const blocks = extractBlocks(candidate, true);

  return createArticle({
    blocks,
    extractionMethod: "fallback",
    title: getFallbackTitle(documentClone),
    author: getMetaContent(documentClone, [
      "meta[name='author']",
      "meta[property='article:author']",
    ]),
    siteName: getMetaContent(documentClone, [
      "meta[property='og:site_name']",
      "meta[name='application-name']",
    ]),
    pageUrl,
    extractedAt,
    sourceDocument: documentClone,
  });
}

export function countWords(text: string): number {
  const normalizedText = normalizeSpeechText(text);
  return normalizedText.length === 0 ? 0 : normalizedText.split(" ").length;
}

export function estimateListeningMinutes(
  wordCount: number,
  speed: number,
): number {
  if (wordCount <= 0 || speed <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(wordCount / (listeningWordsPerMinute * speed)));
}

interface CreateArticleOptions {
  readonly blocks: readonly ArticleBlock[];
  readonly extractionMethod: ExtractedArticle["extractionMethod"];
  readonly title: string | null | undefined;
  readonly author: string | null | undefined;
  readonly siteName: string | null | undefined;
  readonly pageUrl: string;
  readonly extractedAt: string;
  readonly sourceDocument: Document;
}

function createArticle({
  blocks,
  extractionMethod,
  title,
  author,
  siteName,
  pageUrl,
  extractedAt,
  sourceDocument,
}: CreateArticleOptions): ExtractedArticle | undefined {
  const paragraphs = blocks.filter((block) => block.kind === "paragraph");
  const text = blocks.map((block) => block.text).join(" ");
  const wordCount = countWords(text);

  if (
    paragraphs.length < minimumArticleParagraphs ||
    wordCount < minimumArticleWords
  ) {
    return undefined;
  }

  const normalizedTitle =
    normalizeSpeechText(title ?? "") || getFallbackTitle(sourceDocument);
  const normalizedAuthor =
    normalizeOptionalText(author) ??
    getMetaContent(sourceDocument, [
      "meta[name='author']",
      "meta[property='article:author']",
    ]);
  const normalizedSiteName =
    normalizeOptionalText(siteName) ??
    getMetaContent(sourceDocument, [
      "meta[property='og:site_name']",
      "meta[name='application-name']",
    ]) ??
    getHostname(pageUrl);

  return {
    id: createArticleId(pageUrl, normalizedTitle),
    source: "article",
    extractionMethod,
    title: normalizedTitle,
    pageUrl,
    ...(normalizedSiteName === undefined
      ? {}
      : { siteName: normalizedSiteName }),
    ...(normalizedAuthor === undefined ? {} : { author: normalizedAuthor }),
    extractedAt,
    blocks,
    paragraphCount: paragraphs.length,
    headingCount: blocks.length - paragraphs.length,
    wordCount,
    estimatedReadingMinutes: Math.max(
      1,
      Math.ceil(wordCount / readingWordsPerMinute),
    ),
  };
}

function cloneAndCleanDocument(sourceDocument: Document): Document {
  const documentClone = sourceDocument.cloneNode(true) as Document;

  for (const element of documentClone.querySelectorAll(
    noiseSelectors.join(","),
  )) {
    element.remove();
  }

  for (const element of documentClone.querySelectorAll("[class], [id]")) {
    const identity = `${element.id} ${element.className}`;

    if (noisyIdentityPattern.test(identity)) {
      element.remove();
    }
  }

  return documentClone;
}

function findBestFallbackCandidate(
  documentClone: Document,
): Element | undefined {
  const candidates = Array.from(
    documentClone.querySelectorAll(
      "article, main, [role='main'], .post-content, .entry-content, .article-content, .content",
    ),
  );

  if (candidates.length === 0 && documentClone.body !== null) {
    candidates.push(documentClone.body);
  }

  return candidates
    .map((element) => ({ element, score: scoreCandidate(element) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)[0]?.element;
}

function scoreCandidate(element: Element): number {
  const paragraphs = Array.from(element.querySelectorAll("p"));
  const paragraphTextLength = paragraphs.reduce(
    (total, paragraph) =>
      total + normalizeSpeechText(paragraph.textContent ?? "").length,
    0,
  );

  return paragraphTextLength + paragraphs.length * 40;
}

function extractBlocks(
  container: Element,
  requireSubstantialParagraphs: boolean,
): readonly ArticleBlock[] {
  const blocks: ArticleBlock[] = [];

  for (const element of container.querySelectorAll(
    "h1, h2, h3, h4, h5, h6, p",
  )) {
    const text = normalizeSpeechText(element.textContent ?? "");

    if (text.length === 0) {
      continue;
    }

    const index = blocks.length;

    if (element.tagName === "P") {
      if (requireSubstantialParagraphs && text.length < 20) {
        continue;
      }

      blocks.push({ id: `block-${index}`, index, kind: "paragraph", text });
      continue;
    }

    const level = Number(element.tagName.slice(1)) as ArticleHeading["level"];
    blocks.push({ id: `block-${index}`, index, kind: "heading", level, text });
  }

  return blocks;
}

function getFallbackTitle(documentClone: Document): string {
  const heading = normalizeSpeechText(
    documentClone.querySelector("h1")?.textContent ?? "",
  );
  return (
    heading || normalizeSpeechText(documentClone.title) || "Untitled article"
  );
}

function getMetaContent(
  documentClone: Document,
  selectors: readonly string[],
): string | undefined {
  for (const selector of selectors) {
    const content =
      documentClone.querySelector<HTMLMetaElement>(selector)?.content;
    const normalizedContent = normalizeOptionalText(content);

    if (normalizedContent !== undefined) {
      return normalizedContent;
    }
  }

  return undefined;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | undefined {
  const normalizedValue = normalizeSpeechText(value ?? "");
  return normalizedValue || undefined;
}

function getHostname(pageUrl: string): string | undefined {
  try {
    return new URL(pageUrl).hostname || undefined;
  } catch {
    return undefined;
  }
}

function createArticleId(pageUrl: string, title: string): string {
  const input = `${pageUrl}|${title}`;
  let hash = 0;

  for (const character of input) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return `article-${hash.toString(36)}`;
}
