import { ArticleDetails } from "@/components/ArticleDetails";
import { CurrentPageDetails } from "@/components/CurrentPageDetails";
import { PlaybackStatus } from "@/components/PlaybackStatus";
import { PlayerControls } from "@/components/PlayerControls";
import { SpeedControl } from "@/components/SpeedControl";
import { initialPlaybackState } from "@/core";
import {
  getPlaybackState,
  listenToArticle,
  listenToSelection,
  loadCurrentArticle,
  loadCurrentPageInformation,
  sendPlaybackCommand,
  subscribeToPlaybackState,
  updatePlaybackSpeed,
} from "@/messaging";
import type { PlaybackResponse } from "@/messaging";
import type {
  ArticleLoadState,
  PageInformationLoadState,
  PlaybackCommand,
  PlaybackState,
  SpeechSpeed,
} from "@/types";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [currentPageState, setCurrentPageState] =
    useState<PageInformationLoadState>({ status: "loading" });
  const [playbackState, setPlaybackState] =
    useState<PlaybackState>(initialPlaybackState);
  const [articleState, setArticleState] = useState<ArticleLoadState>({
    status: "idle",
  });
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
    runPlaybackAction(updatePlaybackSpeed(speed));
  };

  const canListen =
    currentPageState.status === "ready" &&
    (currentPageState.page.hasSelectedText || articleState.status === "ready");

  const handleListen = () => {
    if (
      currentPageState.status === "ready" &&
      currentPageState.page.hasSelectedText
    ) {
      runPlaybackAction(listenToSelection(playbackState.speed));
      return;
    }

    if (articleState.status === "ready") {
      runPlaybackAction(
        listenToArticle(articleState.article, playbackState.speed),
      );
    }
  };

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <p className="eyebrow">Privacy-first reader</p>
        <h1>SoftSpoken</h1>
      </header>

      <CurrentPageDetails state={currentPageState} />

      <ArticleDetails state={articleState} speed={playbackState.speed} />

      <PlayerControls
        state={playbackState}
        canListen={canListen}
        onListen={handleListen}
        onPause={() => handleCommand("pause")}
        onResume={() => handleCommand("resume")}
        onStop={() => handleCommand("stop")}
        onPreviousParagraph={() => handleCommand("previous-paragraph")}
        onNextParagraph={() => handleCommand("next-paragraph")}
      />

      <PlaybackStatus state={playbackState} actionError={actionError} />

      <section className="settings-panel" aria-label="Playback settings">
        <SpeedControl
          value={playbackState.speed}
          disabled={playbackState.status === "loading"}
          onChange={handleSpeedChange}
        />
      </section>
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

export default App;
