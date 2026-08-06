import { describe, expect, it } from "vitest";
import {
  PlaybackSessionStore,
  isPlaybackSessionCheckpoint,
  type SessionStorageArea,
} from "../storage/playbackSession";
import type { PlaybackState, SpeechChunk } from "../types";

const chunks: readonly SpeechChunk[] = [
  { id: "paragraph-1", text: "First paragraph.", wordCount: 2 },
  { id: "paragraph-2", text: "Second paragraph.", wordCount: 2 },
];

const state: PlaybackState = {
  status: "playing",
  source: "article",
  articleId: "article-one",
  currentParagraphIndex: 0,
  currentSentenceIndex: 0,
  paragraphCount: 2,
  completedParagraphCount: 0,
  speed: 1,
  pitch: 1,
  elapsedSeconds: 4,
  estimatedRemainingSeconds: 20,
};

class MemorySessionStorage implements SessionStorageArea {
  readonly values: Record<string, unknown> = {};

  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.values, items);
  }
}

describe("PlaybackSessionStore", () => {
  it("stores the active queue and updates its progress checkpoint", async () => {
    const storage = new MemorySessionStorage();
    const sessions = new PlaybackSessionStore(storage);

    await sessions.save(chunks, state);
    await sessions.updateState({
      ...state,
      currentParagraphIndex: 1,
      currentSentenceIndex: 2,
      completedParagraphCount: 1,
    });

    expect(await sessions.load()).toMatchObject({
      version: 1,
      chunks,
      state: {
        currentParagraphIndex: 1,
        currentSentenceIndex: 2,
        completedParagraphCount: 1,
      },
    });
  });

  it("rejects malformed and internally inconsistent checkpoints", () => {
    expect(isPlaybackSessionCheckpoint(null)).toBe(false);
    expect(isPlaybackSessionCheckpoint({ version: 1, chunks, state })).toBe(
      true,
    );
    expect(
      isPlaybackSessionCheckpoint({
        version: 1,
        chunks,
        state: { ...state, paragraphCount: 3 },
      }),
    ).toBe(false);
  });
});
