import { describe, expect, it, vi } from "vitest";
import { OffscreenDocumentManager } from "../entrypoints/background/offscreenDocumentManager";

describe("OffscreenDocumentManager", () => {
  it("reuses the existing audio document after a service-worker restart", async () => {
    const createDocument = vi.fn(async () => undefined);
    const manager = new OffscreenDocumentManager({
      getDocumentUrl: () => "chrome-extension://softspoken/offscreen.html",
      hasDocument: async () => true,
      createDocument,
    });

    await manager.ensureDocument();

    expect(createDocument).not.toHaveBeenCalled();
  });

  it("coalesces concurrent creation requests", async () => {
    let resolveCreation: (() => void) | undefined;
    const creation = new Promise<void>((resolve) => {
      resolveCreation = resolve;
    });
    const createDocument = vi.fn(() => creation);
    const manager = new OffscreenDocumentManager({
      getDocumentUrl: () => "chrome-extension://softspoken/offscreen.html",
      hasDocument: async () => false,
      createDocument,
    });

    const first = manager.ensureDocument();
    const second = manager.ensureDocument();
    await vi.waitFor(() => expect(createDocument).toHaveBeenCalledTimes(1));
    resolveCreation?.();
    await Promise.all([first, second]);

    expect(createDocument).toHaveBeenCalledTimes(1);
  });

  it("allows creation to be retried after a failure", async () => {
    const createDocument = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("creation failed"))
      .mockResolvedValueOnce(undefined);
    const manager = new OffscreenDocumentManager({
      getDocumentUrl: () => "chrome-extension://softspoken/offscreen.html",
      hasDocument: async () => false,
      createDocument,
    });

    await expect(manager.ensureDocument()).rejects.toThrow("creation failed");
    await expect(manager.ensureDocument()).resolves.toBeUndefined();
    expect(createDocument).toHaveBeenCalledTimes(2);
  });
});
