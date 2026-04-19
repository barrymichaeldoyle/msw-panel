# msw-panel

Framework-agnostic devtools for Mock Service Worker.

This repo starts with an MVP focused on one job: inspect the handlers already registered with MSW and toggle them on or off without replacing a project's existing mocking setup.

## Monorepo layout

- `packages/core`
  Framework-agnostic controller. It tracks handlers, exposes snapshots for UI adapters, persists disabled handlers, and reapplies the enabled handler set through MSW's runtime API.
- `packages/bridge`
  A transport layer that exposes a controller over messages so external UIs can subscribe to snapshots and send toggle commands.
- `packages/react`
  React adapter that renders a floating panel and talks to `@msw-panel/core`.
- `apps/example-react`
  Vite + React example app wired to a real browser worker so the panel can be tested in a realistic dev loop.
- `apps/example-node`
  Node CLI example wired to `setupServer` so the same controller can manage handlers outside the browser.
- `apps/example-remote-relay`
  Minimal WebSocket relay used by the remote inspector example.
- `apps/example-remote-inspector`
  Separate Vite + React app that mounts `MswPanel` against a remote controller over WebSocket.
- `apps/docs`
  Astro + Starlight docs site for the project, covering the controller model, package roles, bridge usage, and local workflows.

## MVP shape

The current implementation keeps setup deliberately small:

```ts
import { createMswPanelController } from "@msw-panel/core";
import { MswPanel } from "@msw-panel/react";

const controller = createMswPanelController({
  handlers,
  runtime: worker,
  storage: window.localStorage,
  storageKey: "msw-panel:demo",
});
```

The important design decision is that the panel does not own MSW setup. It consumes:

- the `worker` or `server`-like runtime
- the handler list the host app already has

That keeps the tool additive instead of invasive.

When the panel cannot live in the same process, use the bridge package instead:

```ts
import {
  createBroadcastChannelMswPanelBridgeTransport,
  createMswPanelBridgeClient,
  createMswPanelBridgeServer,
} from "@msw-panel/bridge";

const serverTransport = createBroadcastChannelMswPanelBridgeTransport("msw-panel");
const clientTransport = createBroadcastChannelMswPanelBridgeTransport("msw-panel");

createMswPanelBridgeServer({
  controller,
  transport: serverTransport,
});

const remoteController = createMswPanelBridgeClient({
  initialSnapshot: controller.getSnapshot(),
  transport: clientTransport,
});

// <MswPanel controller={remoteController} theme="dark" />
```

That lets the UI talk to a controller across a transport boundary while keeping the React package unaware of the transport details.

For popup or iframe integrations, use the `postMessage` transport:

```ts
import {
  createMswPanelBridgeClient,
  createMswPanelBridgeServer,
  createPostMessageMswPanelBridgeTransport,
} from "@msw-panel/bridge";

const serverTransport = createPostMessageMswPanelBridgeTransport({
  expectedSource: popupWindow,
  listenWindow: window,
  targetOrigin: popupWindow.location.origin,
  targetWindow: popupWindow,
});

const clientTransport = createPostMessageMswPanelBridgeTransport({
  expectedSource: window,
  listenWindow: popupWindow,
  targetOrigin: window.location.origin,
  targetWindow: window,
});

createMswPanelBridgeServer({
  controller,
  transport: serverTransport,
});

const remoteController = createMswPanelBridgeClient({
  initialSnapshot: controller.getSnapshot(),
  transport: clientTransport,
});
```

Use `expectedSource` and a concrete `targetOrigin` whenever you can. That keeps the bridge scoped to the intended window pair instead of accepting arbitrary messages.

For remote inspectors outside the current browser process, use the WebSocket transport:

```ts
import {
  createMswPanelBridgeClient,
  createMswPanelBridgeServer,
  createWebSocketMswPanelBridgeTransport,
} from "@msw-panel/bridge";

const serverTransport = createWebSocketMswPanelBridgeTransport({
  socket: websocketServerConnection,
});

const clientTransport = createWebSocketMswPanelBridgeTransport({
  socket: browserSocket,
});

createMswPanelBridgeServer({
  controller,
  transport: serverTransport,
});

const remoteController = createMswPanelBridgeClient({
  initialSnapshot: controller.getSnapshot(),
  transport: clientTransport,
});
```

The WebSocket transport serializes bridge messages as JSON strings and queues outbound messages while the socket is still connecting, so the initial bridge handshake does not depend on precise connection timing.

## Run it

```bash
pnpm install
pnpm dev:docs
```

For the React example:

```bash
pnpm install
pnpm dev:example-remote-relay
pnpm dev:example-react
pnpm dev:example-remote-inspector
```

Then:

1. Open the host app from `pnpm dev:example-react` and trigger the sample requests.
2. Open the inspector app from `pnpm dev:example-remote-inspector`.
3. Flip handlers in the remote inspector panel.

When a handler is disabled from either panel, the next request in the host app bypasses MSW and falls through to the network.

Handler snapshots also expose a `used` flag, so UIs can distinguish idle handlers from ones that have matched requests in the current session.

The host and inspector both default to the `example-react` session on `ws://localhost:4197`. Override the relay URL with `VITE_MSW_PANEL_RELAY_URL` if you want to point either app at another relay.

For the Node example:

```bash
pnpm install
pnpm dev:example-node
```

That starts an interactive CLI. Use `list`, `user`, `projects`, `toggle 1`, `all off`, and `exit`. Disabled handler state is persisted to `apps/example-node/.msw-panel-state.json`.

## Why this architecture

- `@msw-panel/core` can later support browser workers, Node servers, Storybook integrations, or custom adapters without UI coupling.
- `@msw-panel/bridge` adds a transport boundary without changing the React adapter API.
- `@msw-panel/react` is intentionally thin, which makes Vue/Svelte/Solid adapters straightforward.
- A pnpm workspace is enough for this stage. It avoids monorepo overhead while still giving clear package boundaries.

## Known MVP limitations

- The controller tracks the handlers supplied at creation time.
- Runtime-added handlers can be re-read with `controller.sync()`, but there is no richer lifecycle integration yet.
- Handler labels are derived from MSW handler metadata and are best for HTTP and GraphQL right now.
- The bridge currently ships with BroadcastChannel, `postMessage`, WebSocket, and in-memory transports only.

## Next steps

1. Stabilize package naming and publishing. If you want the public import to become `msw-panel/react`, we can add a facade package or export-map layer once the API settles.
2. Add integration tests that exercise the example app in a browser and verify real request fallthrough when handlers are disabled.
3. Add reconnect and backoff behavior to the remote host and inspector examples instead of assuming the relay is already up.
4. Add richer lifecycle hooks so runtime-added handlers can appear automatically without a manual `controller.sync()`.
