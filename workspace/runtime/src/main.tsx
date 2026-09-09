import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { startAreChatControlPlane } from "./features/chat/are-chat-bridge";
import { installLongTaskObserver } from "./performance";
import "./styles.css";

installLongTaskObserver();
void startAreChatControlPlane().catch(() => undefined);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
