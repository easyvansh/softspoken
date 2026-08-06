import { openSoftSpokenSidePanel } from "@/messaging";
import { useState } from "react";
import "./App.css";

function App() {
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleOpenPlayer = () => {
    setErrorMessage(undefined);
    void openSoftSpokenSidePanel().then((result) => {
      if (!result.ok) {
        setErrorMessage(result.message);
      }
    });
  };

  return (
    <main className="launcher-shell" aria-labelledby="softspoken-title">
      <header className="launcher-header">
        <p className="eyebrow">Privacy-first reader</p>
        <h1 id="softspoken-title">SoftSpoken</h1>
      </header>

      <p className="launcher-copy">
        Opens the full player in Chrome's side panel so playback can continue
        while you switch tabs.
      </p>

      <button
        type="button"
        className="listen-button"
        aria-label="Open SoftSpoken player in the side panel"
        onClick={handleOpenPlayer}
      >
        Open player
      </button>

      {errorMessage !== undefined && (
        <p className="launcher-error" role="alert">
          {errorMessage}
        </p>
      )}
    </main>
  );
}

export default App;
