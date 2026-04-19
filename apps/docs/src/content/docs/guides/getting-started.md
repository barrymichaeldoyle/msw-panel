---
title: Getting started
description: Add msw-panel to an existing React app that already uses MSW.
---

## Install

```bash
npm install msw-panel
```

## Add to your app

```tsx
import { createMswPanelController } from "msw-panel";
import { MswPanel } from "msw-panel/react";
import { worker } from "./mocks/browser";

const controller = createMswPanelController({ runtime: worker });

export function App() {
  return (
    <>
      <Routes />
      <MswPanel controller={controller} />
    </>
  );
}
```

That's it. A floating button appears in the corner — click it to open the panel and toggle handlers on or off.

See the [React reference](/reference/react/) for all props and defaults.
