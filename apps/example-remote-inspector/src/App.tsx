import type { MswPanelController } from "msw-panel";
import { MswPanel } from "msw-panel/react";

import "./styles.css";

interface AppProps {
  panelController: MswPanelController;
  sessionId: string;
  socketUrl: string;
}

export default function App({ panelController, sessionId, socketUrl }: AppProps) {
  return (
    <>
      <main className="app-shell">
        <section className="hero">
          <p className="eyebrow">Remote inspector</p>
          <h1>Inspect MSW from a separate app over WebSocket.</h1>
          <p className="lede">
            This panel is not mounted inside the host app. It connects through the bridge package to
            a relay server, receives handler snapshots, and sends toggle commands back to the host.
          </p>
        </section>

        <section className="meta-grid">
          <article className="card">
            <h2>Session</h2>
            <p>{sessionId}</p>
          </article>
          <article className="card">
            <h2>Relay</h2>
            <p>{socketUrl}</p>
          </article>
        </section>
      </main>

      <MswPanel controller={panelController} title="Remote MSW Panel" />
    </>
  );
}
