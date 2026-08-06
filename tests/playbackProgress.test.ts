import { describe, expect, it } from "vitest";
import {
  PlaybackProgressStore,
  type LocalStorageArea,
} from "../storage/playbackProgress";
import type { PlaybackProgressRecord } from "../types";

const progress: PlaybackProgressRecord = {
  version: 1,
  articleId: "article-one",
  url: "https://example.com/article",
  title: "Article",
  paragraphIndex: 4,
  sentenceIndex: 2,
  timestamp: "2026-08-06T12:00:00.000Z",
  speed: 1.25,
  pitch: 1,
  selectedVoiceId: "voice-one",
};

class MemoryLocalStorage implements LocalStorageArea {
  readonly values: Record<string, unknown> = {};

  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }

  async remove(key: string): Promise<void> {
    delete this.values[key];
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.values, items);
  }
}

describe("PlaybackProgressStore", () => {
  it("stores, loads and clears local playback progress", async () => {
    const storage = new MemoryLocalStorage();
    const progressStore = new PlaybackProgressStore(storage);

    await progressStore.save(progress);
    expect(await progressStore.load()).toEqual(progress);

    await progressStore.clear();
    expect(await progressStore.load()).toBeUndefined();
  });

  it("ignores malformed stored progress", async () => {
    const storage = new MemoryLocalStorage();
    storage.values["softspoken.playbackProgress"] = {
      ...progress,
      paragraphIndex: -1,
    };

    expect(await new PlaybackProgressStore(storage).load()).toBeUndefined();
  });
});
