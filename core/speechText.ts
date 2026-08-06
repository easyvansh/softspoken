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
