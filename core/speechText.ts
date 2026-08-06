const defaultMaximumChunkLength = 220;
const preferredBreakPattern = /[.!?;:](?:["')\]]*)\s/gu;

export function normalizeSpeechText(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

export function splitSpeechChunks(
  text: string,
  maximumChunkLength = defaultMaximumChunkLength,
): readonly string[] {
  const normalizedText = normalizeSpeechText(text);

  if (normalizedText.length === 0) {
    return [];
  }

  if (!Number.isInteger(maximumChunkLength) || maximumChunkLength < 1) {
    throw new RangeError("Maximum chunk length must be a positive integer.");
  }

  const chunks: string[] = [];
  let remainingText = normalizedText;

  while (remainingText.length > maximumChunkLength) {
    const candidate = remainingText.slice(0, maximumChunkLength + 1);
    const breakIndex = findBreakIndex(candidate, maximumChunkLength);
    const chunk = remainingText.slice(0, breakIndex).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    remainingText = remainingText.slice(breakIndex).trimStart();
  }

  if (remainingText.length > 0) {
    chunks.push(remainingText);
  }

  return chunks;
}

export function getSentenceIndexAtCharacter(
  text: string,
  characterIndex: number,
): number {
  const sentences = splitSentences(text);
  const clampedIndex = Math.max(0, characterIndex);
  let sentenceStart = 0;

  for (let index = 0; index < sentences.length; index += 1) {
    const sentence = sentences[index];

    if (sentence === undefined) {
      continue;
    }

    const sentenceEnd = sentenceStart + sentence.length;

    if (clampedIndex < sentenceEnd) {
      return index;
    }

    sentenceStart = sentenceEnd;
  }

  return Math.max(0, sentences.length - 1);
}

export function trimTextBeforeSentence(
  text: string,
  sentenceIndex: number,
): string {
  const sentences = splitSentences(text);

  if (sentences.length === 0 || sentenceIndex <= 0) {
    return text;
  }

  return sentences
    .slice(Math.min(sentenceIndex, sentences.length - 1))
    .join("");
}

function splitSentences(text: string): readonly string[] {
  const normalizedText = normalizeSpeechText(text);

  if (normalizedText.length === 0) {
    return [];
  }

  const sentences: string[] = [];
  let startIndex = 0;

  for (const match of normalizedText.matchAll(preferredBreakPattern)) {
    const endIndex = (match.index ?? 0) + match[0].length;
    sentences.push(normalizedText.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  if (startIndex < normalizedText.length) {
    sentences.push(normalizedText.slice(startIndex));
  }

  return sentences;
}

function findBreakIndex(candidate: string, maximumChunkLength: number): number {
  const preferredMinimum = Math.floor(maximumChunkLength / 2);
  let preferredBreakIndex = -1;

  for (const match of candidate.matchAll(preferredBreakPattern)) {
    const matchEnd = (match.index ?? 0) + match[0].length;

    if (matchEnd <= maximumChunkLength && matchEnd >= preferredMinimum) {
      preferredBreakIndex = matchEnd;
    }
  }

  if (preferredBreakIndex > 0) {
    return preferredBreakIndex;
  }

  const whitespaceIndex = candidate.lastIndexOf(" ", maximumChunkLength);
  return whitespaceIndex > 0 ? whitespaceIndex : maximumChunkLength;
}
