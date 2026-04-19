import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  createMswPanelBridgeClient,
  createWebSocketMswPanelBridgeTransport,
} from "msw-panel/bridge";

import App from "./App";

const sessionId = new URLSearchParams(window.location.search).get("session") ?? "example-react";
const socketUrl = buildSocketUrl(sessionId);
const socket = new WebSocket(socketUrl);
const transport = createWebSocketMswPanelBridgeTransport({
  closeOnDispose: true,
  socket,
});
const panelController = createMswPanelBridgeClient({
  transport,
});

window.addEventListener(
  "beforeunload",
  () => {
    panelController.dispose();
    transport.dispose();
  },
  { once: true },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App panelController={panelController} sessionId={sessionId} socketUrl={socketUrl} />
  </StrictMode>,
);

function buildSocketUrl(sessionId: string): string {
  const relayBaseUrl =
    import.meta.env.VITE_MSW_PANEL_RELAY_URL ??
    `${window.location.protocol === "https:" ? "wss" : "ws"}://localhost:4197`;
  const relayUrl = new URL(relayBaseUrl);

  relayUrl.searchParams.set("session", sessionId);

  return relayUrl.toString();
}
