---
title: Overview
description: What msw-panel is and how it fits into your MSW setup.
---

`msw-panel` adds a floating devtools panel to any app that already uses Mock Service Worker. It lets you inspect registered handlers and toggle them on or off without changing your MSW setup.

## The common case

You have MSW set up. You want a UI to toggle handlers during development. That is the whole thing:

```bash
npm install msw-panel
```

```tsx
import { createMswPanelController } from "msw-panel";
import { MswPanel } from "msw-panel/react";

const controller = createMswPanelController({ runtime: worker });

function App() {
  return (
    <>
      <Routes />
      <MswPanel controller={controller} />
    </>
  );
}
```

See [Getting started](/guides/getting-started/) for the full setup.

## Framework adapters

The React adapter (`msw-panel/react`) is the first UI package. Adapters for Vue, Svelte, and other frameworks are planned.

## Packages

- `msw-panel` — the controller. Tracks handlers, persists disabled state, applies changes through the MSW runtime.
- `msw-panel/react` — the React panel UI.
- `msw-panel/bridge` — optional transport layer for setups where the panel lives in a separate window, tab, or process. Most projects do not need this.
