import { ArticleDetails } from "@/components/ArticleDetails";
import { CurrentPageDetails } from "@/components/CurrentPageDetails";
import { PlaybackStatus } from "@/components/PlaybackStatus";
import {
  ParagraphNavigation,
  PlayerControls,
} from "@/components/PlayerControls";
import { ResumePrompt } from "@/components/ResumePrompt";
import { SpeedControl } from "@/components/SpeedControl";
import { VoiceSelector } from "@/components/VoiceSelector";
import { initialPlaybackState } from "@/core";
import {
  getPlaybackState,
  listenToArticle,
  listenToSelection,
  loadCurrentArticle,
  loadCurrentPageInformation,
  loadPlaybackProgress,
  loadSettings,
  loadVoices,
  resumeArticlePlayback,
  saveSettings,
  sendPlaybackCommand,
  subscribeToPlaybackState,
  subscribeToVoiceList,
  updatePlaybackSpeed,
  updatePlaybackVoice,
} from "@/messaging";
import type { PlaybackResponse } from "@/messaging";
import { defaultSettings } from "@/types";
import type {
  ArticleLoadState,
  PageInformationLoadState,
  PlaybackCommand,
  PlaybackProgressLoadState,
  PlaybackState,
  SpeechSpeed,
  UserSettings,
  VoiceOption,
} from "@/types";
import { useEffect, useState } from "react";

export function PlayerSurface() {
  const [currentPageState, setCurrentPageState] =
    useState<PageInformationLoadState>({ status: "loading" });
  const [playbackState, setPlaybackState] =
    useState<PlaybackState>(initialPlaybackState);
  const [articleState, setArticleState] = useState<ArticleLoadState>({
    status: "idle",
  });
  const [progressState, setProgressState] = useState<PlaybackProgressLoadState>(
    { status: "none" },
  );
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [voices, setVoices] = useState<readonly VoiceOption[]>([]);
  const [unavailableVoiceId, setUnavailableVoiceId] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    let isMounted = true;

    void loadCurrentPageInformation().then((state) => {
      if (isMounted) {
        setCurrentPageState(state);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToVoiceList((nextVoices, missingVoiceId) => {
      if (isMounted) {
        setVoices(nextVoices);
        setUnavailableVoiceId(missingVoiceId);
      }
    });

    void loadSettings().then((response) => {
      if (isMounted && response.ok) {
        setSettings(response.settings);
      }
    });

    void loadVoices().then((response) => {
      if (isMounted && response.ok) {
        setVoices(response.voices);
        setUnavailableVoiceId(response.unavailableVoiceId);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadPlaybackProgress().then((state) => {
      if (isMounted) {
        setProgressState(state);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      currentPageState.status !== "ready" ||
      currentPageState.page.hasSelectedText
    ) {
      setArticleState({ status: "idle" });
      return;
    }

    let isMounted = true;
    setArticleState({ status: "loading" });

    void loadCurrentArticle().then((state) => {
      if (isMounted) {
        setArticleState(state);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentPageState]);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToPlaybackState((state) => {
      if (isMounted) {
        setPlaybackState(state);
        setActionError(undefined);
      }
    });

    void getPlaybackState().then((response) => {
      if (isMounted) {
        applyPlaybackResponse(response, setPlaybackState, setActionError);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const runPlaybackAction = (action: Promise<PlaybackResponse>) => {
    setActionError(undefined);
    void action.then((response) => {
      applyPlaybackResponse(response, setPlaybackState, setActionError);
    });
  };

  const handleCommand = (command: PlaybackCommand) => {
    runPlaybackAction(sendPlaybackCommand(command));
  };

  const handleSpeedChange = (speed: SpeechSpeed) => {
    const nextSettings = { ...settings, speed };
    setSettings(nextSettings);
    void saveSettings(nextSettings);
    runPlaybackAction(updatePlaybackSpeed(speed));
  };

  const handleVoiceChange = (voiceId: string | undefined) => {
    const nextSettings =
      voiceId === undefined
        ? { speed: settings.speed, pitch: settings.pitch }
        : { ...settings, voiceId };
    setSettings(nextSettings);
    setUnavailableVoiceId(undefined);
    void saveSettings(nextSettings);
    runPlaybackAction(updatePlaybackVoice(voiceId));
  };

  const handleRefreshVoices = () => {
    void loadVoices().then((response) => {
      if (response.ok) {
        setVoices(response.voices);
        setUnavailableVoiceId(response.unavailableVoiceId);
      } else {
        setActionError(response.error.message);
      }
    });
  };

  const canListen =
    currentPageState.status === "ready" &&
    (currentPageState.page.hasSelectedText || articleState.status === "ready");
  const listenContext =
    currentPageState.status === "ready" && currentPageState.page.hasSelectedText
      ? "selection"
      : articleState.status === "ready"
        ? "article"
        : articleState.status === "loading"
          ? "loading-article"
          : "unavailable";
  const showCurrentPage =
    currentPageState.status !== "ready" ||
    currentPageState.page.hasSelectedText ||
    articleState.status !== "ready";

  const handleListen = () => {
    if (
      currentPageState.status === "ready" &&
      currentPageState.page.hasSelectedText
    ) {
      runPlaybackAction(listenToSelection(settings));
      return;
    }

    if (articleState.status === "ready") {
      runPlaybackAction(listenToArticle(articleState.article, settings));
    }
  };

  const handleResumeArticle = () => {
    if (articleState.status === "ready") {
      runPlaybackAction(resumeArticlePlayback(articleState.article));
    }
  };

  const handleRestartArticle = () => {
    if (articleState.status === "ready") {
      runPlaybackAction(listenToArticle(articleState.article, settings));
    }
  };

  return (
    <main className="player-shell">
      <header className="player-header">
        <p className="eyebrow">Privacy-first reader</p>
        <h1>SoftSpoken</h1>
      </header>

      {showCurrentPage && <CurrentPageDetails state={currentPageState} />}

      <ArticleDetails state={articleState} speed={settings.speed} />

      {(playbackState.status === "idle" ||
        playbackState.status === "stopped") && (
        <ResumePrompt
          articleState={articleState}
          progressState={progressState}
          onResume={handleResumeArticle}
          onRestart={handleRestartArticle}
        />
      )}

      <PlayerControls
        state={playbackState}
        canListen={canListen}
        listenContext={listenContext}
        onListen={handleListen}
        onPause={() => handleCommand("pause")}
        onResume={() => handleCommand("resume")}
        onStop={() => handleCommand("stop")}
      />

      <PlaybackStatus state={playbackState} actionError={actionError} />

      <ParagraphNavigation
        state={playbackState}
        onPreviousParagraph={() => handleCommand("previous-paragraph")}
        onNextParagraph={() => handleCommand("next-paragraph")}
      />

      <details className="settings-disclosure">
        <summary>Playback settings</summary>
        <section className="settings-panel" aria-label="Playback settings">
          <SpeedControl
            value={settings.speed}
            disabled={playbackState.status === "loading"}
            onChange={handleSpeedChange}
          />
          <VoiceSelector
            value={settings.voiceId}
            voices={voices}
            disabled={playbackState.status === "loading"}
            unavailableVoiceId={unavailableVoiceId}
            onChange={handleVoiceChange}
            onRefresh={handleRefreshVoices}
          />
        </section>
      </details>
    </main>
  );
}

function applyPlaybackResponse(
  response: PlaybackResponse,
  setPlaybackState: (state: PlaybackState) => void,
  setActionError: (message: string | undefined) => void,
): void {
  if (response.ok) {
    setPlaybackState(response.state);
    setActionError(undefined);
  } else {
    setActionError(response.error.message);
  }
}
