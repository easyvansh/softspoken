import { ArticleDetails } from "@/components/ArticleDetails";
import { PlayerControls } from "@/components/PlayerControls";
import { SpeedControl } from "@/components/SpeedControl";
import { VoiceSelector } from "@/components/VoiceSelector";
import { initialPlaybackState } from "@/core";
import type { ArticleLoadState } from "@/types";
import "./App.css";

const currentPageState: ArticleLoadState = { status: "idle" };
const controlsDisabled = true;

function App() {
  return (
    <main className="popup-shell">
      <header className="popup-header">
        <p className="eyebrow">Privacy-first reader</p>
        <h1>SoftSpoken</h1>
      </header>

      <ArticleDetails state={currentPageState} />

      <PlayerControls disabled={controlsDisabled} />

      <section className="settings-panel" aria-label="Playback settings">
        <SpeedControl
          value={initialPlaybackState.speed}
          disabled={controlsDisabled}
        />
        <VoiceSelector disabled={controlsDisabled} />
      </section>
    </main>
  );
}

export default App;
