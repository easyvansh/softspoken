import { isPlaybackState, isSpeechChunk } from "@/messaging";
import type {
  PlaybackSessionCheckpoint,
  PlaybackState,
  SpeechChunk,
} from "@/types";

const playbackSessionKey = "softspoken.playback-session";

export interface SessionStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export class PlaybackSessionStore {
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(private readonly storageArea: SessionStorageArea) {}

  async load(): Promise<PlaybackSessionCheckpoint | undefined> {
    await this.pendingWrite;
    const stored = await this.storageArea.get(playbackSessionKey);
    const checkpoint = stored[playbackSessionKey];
    return isPlaybackSessionCheckpoint(checkpoint) ? checkpoint : undefined;
  }

  save(
    chunks: readonly SpeechChunk[],
    state: PlaybackState,
  ): Promise<void> {
    return this.enqueueWrite(async () => {
      await this.storageArea.set({
        [playbackSessionKey]: {
          version: 1,
          chunks,
          state,
        } satisfies PlaybackSessionCheckpoint,
      });
    });
  }

  updateState(state: PlaybackState): Promise<void> {
    return this.enqueueWrite(async () => {
      const stored = await this.storageArea.get(playbackSessionKey);
      const checkpoint = stored[playbackSessionKey];

      if (!isPlaybackSessionCheckpoint(checkpoint)) {
        return;
      }

      await this.storageArea.set({
        [playbackSessionKey]: { ...checkpoint, state },
      });
    });
  }

  private enqueueWrite(operation: () => Promise<void>): Promise<void> {
    const write = this.pendingWrite.then(operation, operation);
    this.pendingWrite = write.catch(() => undefined);
    return write;
  }
}

export function isPlaybackSessionCheckpoint(
  value: unknown,
): value is PlaybackSessionCheckpoint {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("chunks" in value) ||
    !Array.isArray(value.chunks) ||
    value.chunks.length === 0 ||
    !value.chunks.every(isSpeechChunk) ||
    !("state" in value) ||
    !isPlaybackState(value.state)
  ) {
    return false;
  }

  return (
    value.state.paragraphCount === value.chunks.length &&
    value.state.currentParagraphIndex < value.chunks.length &&
    value.state.completedParagraphCount <= value.chunks.length
  );
}
