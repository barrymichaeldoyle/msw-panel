import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  createBroadcastChannelMswPanelBridgeTransport,
  createMswPanelBridgeClient,
  createMswPanelBridgeServer,
  createWebSocketMswPanelBridgeTransport,
} from "msw-panel/bridge";
import { createMswPanelController } from "msw-panel";
import { MswPanel } from "msw-panel/react";

import { App } from "./App";

const shouldEnablePanelDemo =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_MSW_PANEL_IN_PRODUCTION === "true";

async function prepareMocks() {
  if (!shouldEnablePanelDemo) {
    return null;
  }

  const { subscribeToHandlerUpdates, worker } = await import("./mocks/browser");
  const { presets } = await import("./mocks/handlers");

  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });

  const controller = createMswPanelController({
    presets,
    runtime: worker,
    storage: window.localStorage,
    storageKey: "msw-panel:example-react",
  });

  const unsubscribeFromHandlerUpdates = subscribeToHandlerUpdates(() => {
    controller.sync();
  });

  return {
    controller,
    dispose() {
      unsubscribeFromHandlerUpdates();
    },
  };
}

const mockSession = await prepareMocks();
const panelSession = mockSession ? createPanelBridgeClient(mockSession.controller) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {panelSession ? (
      <MswPanel
        controller={panelSession.controller}
        showInProduction={import.meta.env.VITE_SHOW_MSW_PANEL_IN_PRODUCTION === "true"}
      />
    ) : null}
  </StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    panelSession?.dispose();
    mockSession?.dispose();
  });
}

function createPanelBridgeClient(
  controller: NonNullable<Awaited<ReturnType<typeof prepareMocks>>>["controller"],
) {
  const channelName = "msw-panel:example-react:bridge";
  const sessionId = "example-react";
  const serverTransport = createBroadcastChannelMswPanelBridgeTransport(channelName);
  const clientTransport = createBroadcastChannelMswPanelBridgeTransport(channelName);
  const bridgeServer = createMswPanelBridgeServer({ controller, transport: serverTransport });
  const bridgeClient = createMswPanelBridgeClient({
    initialSnapshot: controller.getSnapshot(),
    transport: clientTransport,
  });

  // Remote relay is opt-in — only connect when VITE_MSW_PANEL_RELAY_URL is set.
  const relayUrl = import.meta.env.VITE_MSW_PANEL_RELAY_URL
    ? buildRemoteSocketUrl(sessionId)
    : null;
  const remoteSocket = relayUrl ? new WebSocket(relayUrl) : null;
  const remoteTransport = remoteSocket
    ? createWebSocketMswPanelBridgeTransport({ closeOnDispose: true, socket: remoteSocket })
    : null;
  const remoteBridgeServer = remoteTransport
    ? createMswPanelBridgeServer({ controller, transport: remoteTransport })
    : null;

  let isDisposed = false;

  const dispose = () => {
    if (isDisposed) {
      return;
    }

    isDisposed = true;

    bridgeClient.dispose();
    bridgeServer.dispose();
    remoteBridgeServer?.dispose();
    clientTransport.dispose();
    serverTransport.dispose();
    remoteTransport?.dispose();
  };

  window.addEventListener("beforeunload", dispose, { once: true });

  return {
    controller: bridgeClient,
    dispose,
  };
}

function buildRemoteSocketUrl(sessionId: string): string {
  const relayBaseUrl =
    import.meta.env.VITE_MSW_PANEL_RELAY_URL ??
    `${window.location.protocol === "https:" ? "wss" : "ws"}://localhost:4197`;
  const relayUrl = new URL(relayBaseUrl);

  relayUrl.searchParams.set("session", sessionId);

  return relayUrl.toString();
}
