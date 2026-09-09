import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OewApp } from "./app/OewApp";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/app-shell.css";
import "./styles/graph.css";
import "./styles/cards.css";
import "./styles/relations.css";
import "./styles/portals.css";
import "./styles/path.css";
import "./styles/inspector.css";
import "./styles/workspace.css";
import "./styles/query.css";
import "./styles/trust.css";
import "./styles/responsive.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OewApp />
  </StrictMode>,
);
