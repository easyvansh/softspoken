import {
  estimateRemainingSpeechSeconds,
  getSentenceIndexAtCharacter,
  initialPlaybackState,
  trimTextBeforeSentence,
} from "@/core";
import type {
  PlaybackCommand,
  PlaybackSessionCheckpoint,
  PlaybackSource,
  PlaybackState,
  SpeechPitch,
  SpeechChunk,
  SpeechSpeed,
} from "@/types";

type StateListener = (state: PlaybackState) => void;

export class SpeechController {
  private chunks: readonly SpeechChunk[] = [];
  private currentUtterance: SpeechSynthesisUtterance | undefined;
  private sessionId = 0;
  private state: PlaybackState = { ...initialPlaybackState };
  private accumulatedElapsedMilliseconds = 0;
  private runningSince: number | undefined;
  private paragraphStartedAtElapsedMilliseconds = 0;
  private timerId: number | undefined;

  constructor(private readonly onStateChanged: StateListener) {}

  getState(): PlaybackState {
    return this.createStateSnapshot();
  }

  start(
    chunks: readonly SpeechChunk[],
    speed: SpeechSpeed,
    pitch: SpeechPitch,
    source: PlaybackSource,
    articleId?: string,
    startParagraphIndex = 0,
    startSentenceIndex = 0,
    selectedVoiceId?: string,
  ): PlaybackState {
    if (!isSpeechSynthesisAvailable()) {
      return this.setError(
        speed,
        pitch,
        "Speech synthesis is unavailable in this browser.",
      );
    }

    if (chunks.length === 0) {
      return this.setError(speed, pitch, "There is no text to speak.");
    }

    this.cancelCurrentSession();
    this.chunks = chunks;
    const currentParagraphIndex = Math.min(
      chunks.length - 1,
      Math.max(0, startParagraphIndex),
    );
    this.accumulatedElapsedMilliseconds = 0;
    this.paragraphStartedAtElapsedMilliseconds = 0;
    this.state = {
      status: "loading",
      source,
      ...(articleId === undefined ? {} : { articleId }),
      currentParagraphIndex,
      currentSentenceIndex: Math.max(0, startSentenceIndex),
      paragraphCount: chunks.length,
      completedParagraphCount: currentParagraphIndex,
      speed,
      pitch,
      ...(selectedVoiceId === undefined ? {} : { selectedVoiceId }),
      elapsedSeconds: 0,
      estimatedRemainingSeconds: estimateRemainingSpeechSeconds(
        chunks,
        currentParagraphIndex,
        speed,
      ),
    };
    this.emitState();
    this.speakCurrentParagraph(this.sessionId);
    return this.getState();
  }

  restore(checkpoint: PlaybackSessionCheckpoint): PlaybackState {
    if (!isSpeechSynthesisAvailable()) {
      return this.setError(
        checkpoint.state.speed,
        checkpoint.state.pitch,
        "Speech synthesis is unavailable in this browser.",
      );
    }

    this.cancelCurrentSession();
    this.chunks = checkpoint.chunks;
    this.accumulatedElapsedMilliseconds =
      checkpoint.state.elapsedSeconds * 1000;

    const fullRemainingMilliseconds =
      estimateRemainingSpeechSeconds(
        checkpoint.chunks,
        checkpoint.state.currentParagraphIndex,
        checkpoint.state.speed,
      ) * 1000;
    const spokenCurrentParagraphMilliseconds = Math.max(
      0,
      fullRemainingMilliseconds -
        checkpoint.state.estimatedRemainingSeconds * 1000,
    );
    this.paragraphStartedAtElapsedMilliseconds = Math.max(
      0,
      this.accumulatedElapsedMilliseconds - spokenCurrentParagraphMilliseconds,
    );

    const shouldContinue =
      checkpoint.state.status === "playing" ||
      checkpoint.state.status === "loading";
    this.state = {
      ...checkpoint.state,
      currentSentenceIndex: checkpoint.state.currentSentenceIndex,
      status: shouldContinue ? "loading" : checkpoint.state.status,
    };
    this.emitState();

    if (shouldContinue) {
      this.speakCurrentParagraph(this.sessionId);
    }

    return this.getState();
  }

  command(command: PlaybackCommand): PlaybackState {
    switch (command) {
      case "pause":
        return this.pause();
      case "resume":
        return this.resume();
      case "stop":
        return this.stop();
      case "previous-paragraph":
        return this.navigateParagraph(-1);
      case "next-paragraph":
        return this.navigateParagraph(1);
    }
  }

  setSpeed(speed: SpeechSpeed): PlaybackState {
    if (this.state.speed === speed) {
      return this.getState();
    }

    if (this.state.status === "playing" || this.state.status === "loading") {
      this.cancelCurrentUtterance();
      this.paragraphStartedAtElapsedMilliseconds =
        this.accumulatedElapsedMilliseconds;
      this.state = { ...this.state, status: "loading", speed };
      this.emitState();
      this.speakCurrentParagraph(this.sessionId);
      return this.getState();
    }

    if (this.state.status === "paused") {
      this.cancelCurrentUtterance();
      this.paragraphStartedAtElapsedMilliseconds =
        this.accumulatedElapsedMilliseconds;
    }

    this.state = { ...this.state, speed };
    this.emitState();
    return this.getState();
  }

  setPitch(pitch: SpeechPitch): PlaybackState {
    if (this.state.pitch === pitch) {
      return this.getState();
    }

    if (this.state.status === "playing" || this.state.status === "loading") {
      this.cancelCurrentUtterance();
      this.paragraphStartedAtElapsedMilliseconds =
        this.accumulatedElapsedMilliseconds;
      this.state = { ...this.state, status: "loading", pitch };
      this.emitState();
      this.speakCurrentParagraph(this.sessionId);
      return this.getState();
    }

    this.state = { ...this.state, pitch };
    this.emitState();
    return this.getState();
  }

  setVoice(selectedVoiceId: string | undefined): PlaybackState {
    if (this.state.selectedVoiceId === selectedVoiceId) {
      return this.getState();
    }

    if (this.state.status === "playing" || this.state.status === "loading") {
      this.cancelCurrentUtterance();
      this.paragraphStartedAtElapsedMilliseconds =
        this.accumulatedElapsedMilliseconds;
      this.state =
        selectedVoiceId === undefined
          ? { ...removeSelectedVoice(this.state), status: "loading" }
          : { ...this.state, status: "loading", selectedVoiceId };
      this.emitState();
      this.speakCurrentParagraph(this.sessionId);
      return this.getState();
    }

    this.state =
      selectedVoiceId === undefined
        ? removeSelectedVoice(this.state)
        : { ...this.state, selectedVoiceId };
    this.emitState();
    return this.getState();
  }

  private pause(): PlaybackState {
    if (this.state.status !== "playing" && this.state.status !== "loading") {
      return this.getState();
    }

    window.speechSynthesis.pause();
    this.commitElapsedTime();
    this.stopTimer();
    this.state = { ...this.state, status: "paused" };
    this.emitState();
    return this.getState();
  }

  private resume(): PlaybackState {
    if (this.state.status !== "paused" && this.state.status !== "error") {
      return this.getState();
    }

    if (this.currentUtterance === undefined) {
      this.paragraphStartedAtElapsedMilliseconds =
        this.accumulatedElapsedMilliseconds;
      this.state = {
        ...this.state,
        status: "loading",
        errorMessage: undefined,
      };
      this.emitState();
      this.speakCurrentParagraph(this.sessionId);
    } else {
      window.speechSynthesis.resume();
      this.beginElapsedTime();
      this.startTimer();
      this.state = { ...this.state, status: "playing" };
      this.emitState();
    }

    return this.getState();
  }

  private stop(): PlaybackState {
    this.cancelCurrentUtterance();
    this.state = { ...this.state, status: "stopped", errorMessage: undefined };
    this.emitState();
    return this.getState();
  }

  private navigateParagraph(direction: -1 | 1): PlaybackState {
    if (this.chunks.length === 0) {
      return this.getState();
    }

    const wasPaused = this.state.status === "paused";
    const targetIndex = Math.min(
      this.chunks.length - 1,
      Math.max(0, this.state.currentParagraphIndex + direction),
    );

    this.cancelCurrentUtterance();
    this.paragraphStartedAtElapsedMilliseconds =
      this.accumulatedElapsedMilliseconds;
    this.state = {
      ...this.state,
      status: wasPaused ? "paused" : "loading",
      currentParagraphIndex: targetIndex,
      currentSentenceIndex: 0,
      completedParagraphCount: targetIndex,
      errorMessage: undefined,
    };
    this.emitState();

    if (!wasPaused) {
      this.speakCurrentParagraph(this.sessionId);
    }

    return this.getState();
  }

  private speakCurrentParagraph(sessionId: number): void {
    const chunk = this.chunks[this.state.currentParagraphIndex];

    if (chunk === undefined) {
      this.finishPlayback();
      return;
    }

    try {
      const spokenText =
        this.state.currentSentenceIndex > 0
          ? trimTextBeforeSentence(chunk.text, this.state.currentSentenceIndex)
          : chunk.text;
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = this.state.speed;
      utterance.pitch = this.state.pitch;
      const voice = findVoice(this.state.selectedVoiceId);

      if (voice !== undefined) {
        utterance.voice = voice;
      }
      utterance.onstart = () => {
        if (sessionId !== this.sessionId || this.state.status === "paused") {
          return;
        }

        this.beginElapsedTime();
        this.startTimer();
        this.state = { ...this.state, status: "playing" };
        this.emitState();
      };
      utterance.onend = () => {
        if (sessionId !== this.sessionId) {
          return;
        }

        this.commitElapsedTime();
        this.stopTimer();
        this.currentUtterance = undefined;
        const nextParagraphIndex = this.state.currentParagraphIndex + 1;

        if (nextParagraphIndex >= this.chunks.length) {
          this.finishPlayback();
          return;
        }

        this.paragraphStartedAtElapsedMilliseconds =
          this.accumulatedElapsedMilliseconds;
        this.state = {
          ...this.state,
          status: "loading",
          currentParagraphIndex: nextParagraphIndex,
          currentSentenceIndex: 0,
          completedParagraphCount: nextParagraphIndex,
        };
        this.emitState();
        this.speakCurrentParagraph(sessionId);
      };
      utterance.onerror = (event) => {
        if (sessionId !== this.sessionId) {
          return;
        }

        this.commitElapsedTime();
        this.stopTimer();
        this.currentUtterance = undefined;
        this.state = {
          ...this.state,
          status: "error",
          errorMessage: getSpeechErrorMessage(event.error),
        };
        this.emitState();
      };
      utterance.onboundary = (event) => {
        if (sessionId !== this.sessionId || event.name !== "sentence") {
          return;
        }

        const sentenceOffset = this.state.currentSentenceIndex;
        this.state = {
          ...this.state,
          currentSentenceIndex:
            sentenceOffset +
            getSentenceIndexAtCharacter(spokenText, event.charIndex),
        };
        this.emitState();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      this.state = {
        ...this.state,
        status: "error",
        errorMessage: "The browser could not start speech synthesis.",
      };
      this.emitState();
    }
  }

  private finishPlayback(): void {
    this.commitElapsedTime();
    this.stopTimer();
    this.currentUtterance = undefined;
    this.state = {
      ...this.state,
      status: "completed",
      currentParagraphIndex: Math.max(0, this.chunks.length - 1),
      currentSentenceIndex: 0,
      completedParagraphCount: this.chunks.length,
      estimatedRemainingSeconds: 0,
    };
    this.emitState();
  }

  private cancelCurrentSession(): void {
    this.sessionId += 1;
    this.commitElapsedTime();
    this.stopTimer();
    this.currentUtterance = undefined;

    if (isSpeechSynthesisAvailable()) {
      window.speechSynthesis.cancel();
    }
  }

  private cancelCurrentUtterance(): void {
    this.sessionId += 1;
    this.commitElapsedTime();
    this.stopTimer();
    this.currentUtterance = undefined;
    window.speechSynthesis.cancel();
  }

  private setError(
    speed: SpeechSpeed,
    pitch: SpeechPitch,
    message: string,
  ): PlaybackState {
    this.state = {
      status: "error",
      currentParagraphIndex: 0,
      currentSentenceIndex: 0,
      paragraphCount: 0,
      completedParagraphCount: 0,
      speed,
      pitch,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 0,
      errorMessage: message,
    };
    this.emitState();
    return this.getState();
  }

  private beginElapsedTime(): void {
    if (this.runningSince === undefined) {
      this.runningSince = performance.now();
    }
  }

  private commitElapsedTime(): void {
    if (this.runningSince !== undefined) {
      this.accumulatedElapsedMilliseconds +=
        performance.now() - this.runningSince;
      this.runningSince = undefined;
    }
  }

  private getElapsedMilliseconds(): number {
    return (
      this.accumulatedElapsedMilliseconds +
      (this.runningSince === undefined
        ? 0
        : performance.now() - this.runningSince)
    );
  }

  private startTimer(): void {
    if (this.timerId !== undefined) {
      return;
    }

    this.timerId = window.setInterval(() => this.emitState(), 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== undefined) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  private createStateSnapshot(): PlaybackState {
    const elapsedMilliseconds = this.getElapsedMilliseconds();
    const paragraphElapsedSeconds = Math.max(
      0,
      Math.floor(
        (elapsedMilliseconds - this.paragraphStartedAtElapsedMilliseconds) /
          1000,
      ),
    );
    const estimatedRemainingSeconds =
      this.state.status === "completed"
        ? 0
        : Math.max(
            0,
            estimateRemainingSpeechSeconds(
              this.chunks,
              this.state.currentParagraphIndex,
              this.state.speed,
            ) - paragraphElapsedSeconds,
          );

    return {
      ...this.state,
      elapsedSeconds: Math.floor(elapsedMilliseconds / 1000),
      estimatedRemainingSeconds,
    };
  }

  private emitState(): void {
    this.state = this.createStateSnapshot();
    this.onStateChanged({ ...this.state });
  }
}

function isSpeechSynthesisAvailable(): boolean {
  return (
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function getSpeechErrorMessage(error: SpeechSynthesisErrorCode): string {
  switch (error) {
    case "not-allowed":
      return "Chrome did not allow speech playback to start.";
    case "voice-unavailable":
      return "The selected system voice is unavailable.";
    case "text-too-long":
      return "A paragraph was too long for the browser to read.";
    case "invalid-argument":
      return "Chrome rejected the speech playback settings.";
    default:
      return "Speech synthesis stopped unexpectedly. Resume to retry this paragraph.";
  }
}

function getVoiceId(voice: SpeechSynthesisVoice): string {
  return voice.voiceURI || `${voice.name}:${voice.lang}:${voice.localService}`;
}

function findVoice(
  voiceId: string | undefined,
): SpeechSynthesisVoice | undefined {
  if (voiceId === undefined || !isSpeechSynthesisAvailable()) {
    return undefined;
  }

  return window.speechSynthesis
    .getVoices()
    .find((voice) => getVoiceId(voice) === voiceId);
}

function removeSelectedVoice(state: PlaybackState): PlaybackState {
  const { selectedVoiceId: _selectedVoiceId, ...rest } = state;
  return rest;
}
