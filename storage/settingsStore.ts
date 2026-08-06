import { isUserSettings } from "@/messaging/messages";
import { defaultSettings, type UserSettings } from "@/types";
import { storageKeys } from "./keys";
import type { LocalStorageArea } from "./playbackProgress";

export class SettingsStore {
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(private readonly storageArea: LocalStorageArea) {}

  async load(): Promise<UserSettings> {
    await this.pendingWrite;
    const stored = await this.storageArea.get(storageKeys.settings);
    const settings = stored[storageKeys.settings];
    return isUserSettings(settings) ? settings : defaultSettings;
  }

  save(settings: UserSettings): Promise<void> {
    return this.enqueueWrite(async () => {
      await this.storageArea.set({
        [storageKeys.settings]: settings,
      });
    });
  }

  private enqueueWrite(operation: () => Promise<void>): Promise<void> {
    const write = this.pendingWrite.then(operation, operation);
    this.pendingWrite = write.catch(() => undefined);
    return write;
  }
}
