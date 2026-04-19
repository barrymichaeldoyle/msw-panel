# @msw-panel/core

Framework-agnostic controller for managing [MSW](https://mswjs.io) handler state during development. Tracks which handlers are enabled or disabled, persists the selection to storage, and applies it back to the MSW runtime.

## Install

```sh
npm install @msw-panel/core
```

MSW 2.x must be installed as a peer dependency.

## Usage

```ts
import { createMswPanelController } from "@msw-panel/core";
import { worker } from "./mocks/browser";
import { handlers } from "./mocks/handlers";

const controller = createMswPanelController({
  handlers,
  runtime: worker,
  storage: window.localStorage,
  storageKey: "msw-panel",
});

// Subscribe to state changes
const unsubscribe = controller.subscribe(() => {
  console.log(controller.getSnapshot());
});

// Snapshot handlers now include `used`, which mirrors MSW's runtime `isUsed` flag.

// Toggle a handler by id
controller.toggle(handler.id);

// Enable / disable all
controller.setAllEnabled(true);
controller.setAllEnabled(false);

// Re-read handlers from the runtime (useful after HMR)
controller.sync();
```

The React adapter accepts `theme="dark" | "light"` and defaults to `dark`.
It also accepts `showCount`, which defaults to `true` and controls the enabled-handler badge on the collapsed trigger button.

## Documentation

Full docs at [msw-panel.dev](https://msw-panel.dev) (coming soon).
