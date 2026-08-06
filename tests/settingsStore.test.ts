import { describe, expect, it } from "vitest";
import { SettingsStore, type LocalStorageArea } from "../storage";

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

describe("SettingsStore", () => {
  it("stores and loads local voice preferences", async () => {
    const storage = new MemoryLocalStorage();
    const settings = new SettingsStore(storage);

    await settings.save({ speed: 1.25, pitch: 1.5, voiceId: "voice-one" });

    expect(await settings.load()).toEqual({
      speed: 1.25,
      pitch: 1.5,
      voiceId: "voice-one",
    });
  });

  it("falls back to defaults for malformed settings", async () => {
    const storage = new MemoryLocalStorage();
    storage.values["softspoken.settings"] = { speed: 9, pitch: 1 };

    expect(await new SettingsStore(storage).load()).toEqual({
      speed: 1,
      pitch: 1,
    });
  });
});
