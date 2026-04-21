import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createMswPanelController } from "msw-panel";
import { MswPanel } from "msw-panel/react";

import { App } from "./App";

const shouldEnablePanelDemo =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_MSW_PANEL_IN_PRODUCTION === "true";

async function prepareMocks() {
  if (!shouldEnablePanelDemo) {
    return null;
  }
  const { worker } = await import("./mocks/browser");

  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });

  return createMswPanelController({
    runtime: worker,
  });
}

const controller = await prepareMocks();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <MswPanel
      controller={controller}
      showInProduction={import.meta.env.VITE_SHOW_MSW_PANEL_IN_PRODUCTION === "true"}
    />
  </StrictMode>,
);
