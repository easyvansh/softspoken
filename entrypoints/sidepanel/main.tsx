import { PlayerSurface } from "@/components/PlayerSurface";
import React from "react";
import ReactDOM from "react-dom/client";
import "../popup/App.css";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PlayerSurface />
  </React.StrictMode>,
);
