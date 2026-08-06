import { isPlaybackProgressRecord } from "@/messaging/messages";
import type { PlaybackProgressRecord } from "@/types";
import { storageKeys } from "./keys";

export interface LocalStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  remove(key: string): Promise<void>;
  set(items: Record<string, unknown>): Promise<void>;
}

export class PlaybackProgressStore {
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(private readonly storageArea: LocalStorageArea) {}

  async load(): Promise<PlaybackProgressRecord | undefined> {
    await this.pendingWrite;
    const stored = await this.storageArea.get(storageKeys.playbackProgress);
    const progress = stored[storageKeys.playbackProgress];
    return isPlaybackProgressRecord(progress) ? progress : undefined;
  }

  save(progress: PlaybackProgressRecord): Promise<void> {
    return this.enqueueWrite(async () => {
      await this.storageArea.set({
        [storageKeys.playbackProgress]: progress,
      });
    });
  }

  clear(): Promise<void> {
    return this.enqueueWrite(async () => {
      await this.storageArea.remove(storageKeys.playbackProgress);
    });
  }

  private enqueueWrite(operation: () => Promise<void>): Promise<void> {
    const write = this.pendingWrite.then(operation, operation);
    this.pendingWrite = write.catch(() => undefined);
    return write;
  }
}
