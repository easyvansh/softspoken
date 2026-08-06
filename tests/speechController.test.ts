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
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
  onboundary: ((event: SpeechSynthesisEvent) => void) | null = null;

  constructor(readonly text: string) {}
}

const spokenUtterances: FakeUtterance[] = [];
const fakeVoices = [
  {
    voiceURI: "voice-one",
    name: "Voice One",
    lang: "en-US",
    localService: true,
    default: false,
  },
] as SpeechSynthesisVoice[];
const synthesis = {
  speak: vi.fn((utterance: FakeUtterance) => spokenUtterances.push(utterance)),
  pause: vi.fn(),
  resume: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => fakeVoices),
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

    controller.start(chunks, 1, 1, "article", "article-one");
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

    controller.start(chunks, 1, 1, "article", "article-one");
    startUtterance(0);
    expect(controller.command("pause").status).toBe("paused");
    expect(controller.command("resume").status).toBe("playing");

    controller.command("next-paragraph");
    expect(controller.getState().currentParagraphIndex).toBe(1);
    controller.command("previous-paragraph");
    expect(controller.getState().currentParagraphIndex).toBe(0);
    expect(controller.command("stop").status).toBe("stopped");
  });

  it("applies pitch and selected voice to utterances", () => {
    const controller = new SpeechController(() => undefined);

    controller.start(
      chunks,
      1.25,
      1.5,
      "article",
      "article-one",
      0,
      0,
      "voice-one",
    );

    expect(spokenUtterances.at(-1)?.rate).toBe(1.25);
    expect(spokenUtterances.at(-1)?.pitch).toBe(1.5);
    expect(spokenUtterances.at(-1)?.voice).toBe(fakeVoices[0]);
  });

  it("falls back to the system voice when the selected voice is unavailable", () => {
    const controller = new SpeechController(() => undefined);

    controller.start(chunks, 1, 1, "article", "article-one", 0, 0, "missing");

    expect(spokenUtterances.at(-1)?.voice).toBeNull();
    expect(controller.getState().selectedVoiceId).toBe("missing");
  });

  it("tracks and resumes from the current sentence", () => {
    const controller = new SpeechController(() => undefined);

    controller.start(
      [{ id: "one", text: "First sentence. Second sentence.", wordCount: 4 }],
      1,
      1,
      "article",
      "article-one",
    );
    startUtterance(0);
    boundaryUtterance(0, 16);

    expect(controller.getState().currentSentenceIndex).toBe(1);
    controller.restore({
      version: 1,
      chunks: [
        { id: "one", text: "First sentence. Second sentence.", wordCount: 4 },
      ],
      state: {
        status: "playing",
        source: "article",
        articleId: "article-one",
        currentParagraphIndex: 0,
        currentSentenceIndex: 1,
        paragraphCount: 1,
        completedParagraphCount: 0,
        speed: 1,
        pitch: 1,
        elapsedSeconds: 4,
        estimatedRemainingSeconds: 8,
      },
    });

    expect(spokenUtterances.at(-1)?.text).toBe("Second sentence.");
  });

  it("resumes an interrupted session from the current paragraph", () => {
    const controller = new SpeechController(() => undefined);

    controller.start(chunks, 1, 1, "article", "article-one");
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

  it("restores a suspended playing session from its current paragraph", () => {
    const controller = new SpeechController(() => undefined);

    const restored = controller.restore({
      version: 1,
      chunks,
      state: {
        status: "playing",
        source: "article",
        articleId: "article-one",
        currentParagraphIndex: 1,
        currentSentenceIndex: 0,
        paragraphCount: 3,
        completedParagraphCount: 1,
        speed: 1.25,
        pitch: 1,
        elapsedSeconds: 30,
        estimatedRemainingSeconds: 20,
      },
    });

    expect(restored).toMatchObject({
      status: "loading",
      currentParagraphIndex: 1,
      elapsedSeconds: 30,
    });
    expect(spokenUtterances.at(-1)?.text).toBe("Second paragraph.");
    expect(spokenUtterances.at(-1)?.rate).toBe(1.25);
  });

  it("restores a paused session without starting speech", () => {
    const controller = new SpeechController(() => undefined);

    const restored = controller.restore({
      version: 1,
      chunks,
      state: {
        status: "paused",
        source: "article",
        articleId: "article-one",
        currentParagraphIndex: 2,
        currentSentenceIndex: 0,
        paragraphCount: 3,
        completedParagraphCount: 2,
        speed: 1,
        pitch: 1,
        elapsedSeconds: 45,
        estimatedRemainingSeconds: 10,
      },
    });

    expect(restored.status).toBe("paused");
    expect(spokenUtterances).toHaveLength(0);
    controller.command("resume");
    expect(spokenUtterances.at(-1)?.text).toBe("Third paragraph.");
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

function boundaryUtterance(index: number, charIndex: number): void {
  spokenUtterances[index]?.onboundary?.({
    name: "sentence",
    charIndex,
  } as SpeechSynthesisEvent);
}
