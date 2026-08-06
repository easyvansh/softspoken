import type { ExtractedArticle, SpeechChunk, SpeechSpeed } from "@/types";
import { countWords } from "./articleExtraction";
import { splitSpeechChunks } from "./speechText";

const speechWordsPerMinute = 150;

export function createArticleSpeechChunks(
  article: ExtractedArticle,
): readonly SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  let pendingHeadings: string[] = [];

  for (const block of article.blocks) {
    if (block.kind === "heading") {
      pendingHeadings.push(block.text);
      continue;
    }

    const text = [...pendingHeadings, block.text].join(" ");
    pendingHeadings = [];
    chunks.push({ id: block.id, text, wordCount: countWords(text) });
  }

  return chunks;
}

export function createSelectionSpeechChunks(
  text: string,
): readonly SpeechChunk[] {
  return splitSpeechChunks(text).map((chunk, index) => ({
    id: `selection-${index}`,
    text: chunk,
    wordCount: countWords(chunk),
  }));
}

export function estimateRemainingSpeechSeconds(
  chunks: readonly SpeechChunk[],
  currentParagraphIndex: number,
  speed: SpeechSpeed,
): number {
  const remainingWords = chunks
    .slice(Math.max(0, currentParagraphIndex))
    .reduce((total, chunk) => total + chunk.wordCount, 0);

  if (remainingWords === 0) {
    return 0;
  }

  return Math.ceil((remainingWords / (speechWordsPerMinute * speed)) * 60);
}
