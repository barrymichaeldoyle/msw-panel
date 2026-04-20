# msw-panel

Framework-agnostic devtools for Mock Service Worker.

Inspect the handlers already registered with MSW and toggle them on or off — without replacing your existing mocking setup.

## Install

```sh
npm install msw-panel
```

→ [Full documentation](https://barrymichaeldoyle.github.io/msw-panel)

## Monorepo layout

```
packages/core        → published as msw-panel
                         imports: msw-panel
                                  msw-panel/react
                                  msw-panel/react/lazy
                                  msw-panel/bridge

apps/docs            → Astro + Starlight documentation site
apps/example-react   → Vite + React example with browser worker
apps/example-react-minimal → minimal setup example
apps/example-node    → Node CLI example using setupServer
apps/example-remote-relay      → WebSocket relay for remote inspector
apps/example-remote-inspector  → standalone inspector connecting over WebSocket
```

## Quick start

```ts
import { createMswPanelController } from "msw-panel";
import { MswPanel } from "msw-panel/react";
import { worker } from "./mocks/browser";

const controller = createMswPanelController({
  runtime: worker,
  storage: window.localStorage,
  storageKey: "msw-panel:demo",
});

export function App() {
  return (
    <>
      <YourApp />
      <MswPanel controller={controller} />
    </>
  );
}
```

## Local development

Prerequisites: Node.js, pnpm.

```bash
git clone https://github.com/barrymichaeldoyle/msw-panel.git
cd msw-panel
pnpm install
```

Run the docs site:

```bash
pnpm dev:docs
```

Run the React example (includes remote inspector):

```bash
pnpm dev:example-remote-relay
pnpm dev:example-react
pnpm dev:example-remote-inspector
```

Run all checks:

```bash
pnpm ci:check
```

## Why this architecture

- The panel does not own MSW setup — it wraps an existing `worker` or `server` instance. That keeps it additive rather than invasive.
- A framework-agnostic controller (`packages/core`) means React, Vue, Svelte, or any other UI adapter can be built on the same interface.
- The bridge transport layer lets a panel UI talk to a controller across a window, iframe, or WebSocket boundary without coupling the React adapter to the transport.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
