# msw-panel

Framework-agnostic devtools for Mock Service Worker.

Inspect the handlers already registered with MSW, toggle them on or off, switch endpoints between named **scenarios** (empty / error / loading), and organize everything with **feature tags**, all from a floating panel.

Built to drop into an **existing MSW setup**: point it at the `worker` or `server` you already have. Toggling and tags need no changes to your handlers; scenarios reuse the resolvers you already wrote.

## Install

```sh
npm install -D msw-panel
```

→ [Full documentation](https://barrymichaeldoyle.github.io/msw-panel) · [Live demo](https://barrymichaeldoyle.github.io/msw-panel/demo/react/)

## Monorepo layout

```
packages/core        → published as msw-panel
                         imports: msw-panel
                                  msw-panel/react
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

const controller = createMswPanelController({ runtime: worker });

export function App() {
  return (
    <>
      <YourApp />
      <MswPanel controller={controller} />
    </>
  );
}
```

If you prefer to start with every handler off and enable them one by one:

```ts
const controller = createMswPanelController({
  runtime: worker,
  defaultEnabled: false,
});
```

## Scenarios & feature tags

These are opt-in helpers, all imported from `msw-panel`. They work with the controller setup above; no extra wiring.

**Feature tags**: wrap a handler you already have. No config changes:

```ts
import { withTags } from "msw-panel";

withTags(http.get("/api/user", resolver), ["auth"]);
```

**Scenarios**: give an endpoint named response states. Your existing resolver becomes the default scenario:

```ts
import { defineScenarios } from "msw-panel";

export const user = defineScenarios({
  method: "get",
  path: "/api/user",
  default: "Signed in",
  scenarios: {
    "Signed in": () => HttpResponse.json({ name: "Barry" }), // ← your existing resolver
    "Signed out": () => new HttpResponse(null, { status: 401 }),
    Error: () => new HttpResponse(null, { status: 500 }),
  },
});
```

`defineScenarios` returns a normal MSW handler. Register it in your handlers array like any other. The panel renders a per-endpoint scenario selector, tag chips, and (when you add [presets](https://barrymichaeldoyle.github.io/msw-panel/guides/scenarios/)) a one-click selector to flip many endpoints at once.

→ [Scenarios guide](https://barrymichaeldoyle.github.io/msw-panel/guides/scenarios/) · [Feature tags guide](https://barrymichaeldoyle.github.io/msw-panel/guides/feature-tags/)

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

- The panel does not own MSW setup. It wraps an existing `worker` or `server` instance. That keeps it additive rather than invasive: adopt it incrementally, one handler or feature at a time.
- A framework-agnostic controller (`packages/core`) means React, Vue, Svelte, or any other UI adapter can be built on the same interface.
- The bridge transport layer lets a panel UI talk to a controller across a window, iframe, or WebSocket boundary without coupling the React adapter to the transport.

## Framework support

- Supported now: React via `msw-panel/react`
- Planned first-party adapters: Vue and Svelte
- Under consideration: Solid and Angular

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
