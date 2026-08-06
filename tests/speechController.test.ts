/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeechController } from "../entrypoints/offscreen/speechController";
import type { PlaybackState, SpeechChunk } from "../types";

const chunks: readonly SpeechChunk[] = [
  { id: "one", text: "First paragraph.", wordCount: 2 },
  { id: "two", text: "Second paragraph.", wordCount: 2 },
  { id: "three", text: "Third paragraph.", wordCount: 2 },
];

class FakeUtterance {
  rate = 1;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;

  constructor(readonly text: string) {}
}

const spokenUtterances: FakeUtterance[] = [];
const synthesis = {
  speak: vi.fn((utterance: FakeUtterance) => spokenUtterances.push(utterance)),
  pause: vi.fn(),
  resume: vi.fn(),
  cancel: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers();
  spokenUtterances.length = 0;
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    configurable: true,
    value: FakeUtterance,
  });
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: synthesis,
  });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SpeechController article playback", () => {
  it("continues automatically and reports completion", () => {
    const states: PlaybackState[] = [];
    const controller = new SpeechController((state) => states.push(state));

    controller.start(chunks, 1, "article", "article-one");
    startUtterance(0);
    endUtterance(0);

    expect(controller.getState().currentParagraphIndex).toBe(1);
    expect(controller.getState().completedParagraphCount).toBe(1);

    startUtterance(1);
    endUtterance(1);
    startUtterance(2);
    endUtterance(2);

    expect(controller.getState()).toMatchObject({
      status: "completed",
      currentParagraphIndex: 2,
      completedParagraphCount: 3,
      estimatedRemainingSeconds: 0,
    });
    expect(states.some((state) => state.status === "playing")).toBe(true);
  });

  it("pauses, resumes, and navigates by paragraph", () => {
    const controller = new SpeechController(() => undefined);

    controller.start(chunks, 1, "article", "article-one");
    startUtterance(0);
    expect(controller.command("pause").status).toBe("paused");
    expect(controller.command("resume").status).toBe("playing");

    controller.command("next-paragraph");
    expect(controller.getState().currentParagraphIndex).toBe(1);
    controller.command("previous-paragraph");
    expect(controller.getState().currentParagraphIndex).toBe(0);
    expect(controller.command("stop").status).toBe("stopped");
  });

  it("resumes an interrupted session from the current paragraph", () => {
    const controller = new SpeechController(() => undefined);

    controller.start(chunks, 1, "article", "article-one");
    startUtterance(0);
    errorUtterance(0);

    expect(controller.getState()).toMatchObject({
      status: "error",
      currentParagraphIndex: 0,
    });

    controller.command("resume");
    expect(spokenUtterances.at(-1)?.text).toBe("First paragraph.");
    expect(controller.getState().currentParagraphIndex).toBe(0);
  });
});

function startUtterance(index: number): void {
  spokenUtterances[index]?.onstart?.(
    new Event("start") as SpeechSynthesisEvent,
  );
}

function endUtterance(index: number): void {
  spokenUtterances[index]?.onend?.(new Event("end") as SpeechSynthesisEvent);
}

function errorUtterance(index: number): void {
  spokenUtterances[index]?.onerror?.({
    error: "interrupted",
  } as SpeechSynthesisErrorEvent);
}
