# msw-panel

Framework-agnostic devtools for [Mock Service Worker](https://mswjs.io). Inspect registered handlers and toggle them on or off during development — without replacing your existing MSW setup.

## Install

```sh
npm install msw-panel
```

MSW 2.x must be installed as a peer dependency.

## Quick start

```ts
import { createMswPanelController } from "msw-panel";
import { MswPanel } from "msw-panel/react";
import { worker } from "./mocks/browser";

const controller = createMswPanelController({
  runtime: worker,
  storage: window.localStorage,
  storageKey: "msw-panel",
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

`controller` accepts `null`, so no ternary is needed when the controller is conditionally created:

```tsx
const controller = import.meta.env.DEV ? createMswPanelController({ runtime: worker }) : null;

<MswPanel controller={controller} />;
```

## Embedded panel

Use `MswPanelEmbedded` to render the panel inline — useful in Storybook addons or custom dev toolbars:

```tsx
import { MswPanelEmbedded } from "msw-panel/react";

<MswPanelEmbedded controller={controller} style={{ height: "500px" }} />;
```

## Lazy loading

Import from `msw-panel/react/lazy` to split the panel out of your initial bundle:

```tsx
import { MswPanel } from "msw-panel/react/lazy";
```

## Options

| Prop / option | Default          | Description                                                          |
| ------------- | ---------------- | -------------------------------------------------------------------- |
| `controller`  | —                | Required. Pass `null` to render nothing.                             |
| `defaultOpen` | `false`          | Open the panel on first render.                                      |
| `panelSide`   | inferred         | Which side of the trigger button the panel expands toward.           |
| `position`    | `"bottom-right"` | Viewport corner for the floating trigger button.                     |
| `shadow`      | `false`          | Render inside a Shadow DOM root to isolate from external CSS resets. |
| `showCount`   | `true`           | Show the enabled-handler count badge on the trigger button.          |
| `theme`       | `"dark"`         | `"dark"` or `"light"`.                                               |
| `title`       | `"MSW Panel"`    | Heading shown inside the open panel.                                 |

## Controller API

```ts
const controller = createMswPanelController({ runtime, storage, storageKey });

controller.getSnapshot(); // current handler state
controller.toggle(id); // toggle one handler
controller.setEnabled(id, false); // enable/disable one handler
controller.setAllEnabled(false); // enable/disable all
controller.sync(); // re-read handlers from the runtime
controller.subscribe(listener); // subscribe to changes, returns unsubscribe
```

## Remote inspector

Use `msw-panel/bridge` to connect a panel in a separate window or process:

```ts
import {
  createMswPanelBridgeClient,
  createMswPanelBridgeServer,
  createBroadcastChannelMswPanelBridgeTransport,
} from "msw-panel/bridge";

// In the host app (where MSW runs)
const transport = createBroadcastChannelMswPanelBridgeTransport("msw-panel");
createMswPanelBridgeServer({ controller, transport });

// In the inspector app (separate window/frame)
const transport = createBroadcastChannelMswPanelBridgeTransport("msw-panel");
const remoteController = createMswPanelBridgeClient({ transport });
<MswPanel controller={remoteController} />
```

Other transports: `createPostMessageMswPanelBridgeTransport`, `createWebSocketMswPanelBridgeTransport`.

## Documentation

Full docs at [barrymichaeldoyle.github.io/msw-panel](https://barrymichaeldoyle.github.io/msw-panel).
