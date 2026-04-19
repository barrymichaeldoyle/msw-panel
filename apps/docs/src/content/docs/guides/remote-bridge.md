---
title: Use the bridge for a remote panel
description: Keep the controller next to the runtime and expose it to a separate UI over a transport.
---

Use the bridge package when the panel cannot live in the same process or execution context as the runtime.

## Pick a transport

The bridge API stays the same across transports. The transport choice depends on where the UI lives:

- BroadcastChannel for colocated browser contexts
- `postMessage` for popup or iframe boundaries
- WebSocket for remote inspectors and relay-based setups
- in-memory for tests and same-process development

## BroadcastChannel example

```ts
import { createBroadcastChannelMswPanelBridgeTransport } from "msw-panel/bridge";

const serverTransport = createBroadcastChannelMswPanelBridgeTransport("msw-panel");
const clientTransport = createBroadcastChannelMswPanelBridgeTransport("msw-panel");
```

## Start the bridge server

```ts
import { createMswPanelBridgeServer } from "msw-panel/bridge";

createMswPanelBridgeServer({
  controller,
  transport: serverTransport,
});
```

## Create the bridge client

```ts
import { createMswPanelBridgeClient } from "msw-panel/bridge";

const remoteController = createMswPanelBridgeClient({
  initialSnapshot: controller.getSnapshot(),
  transport: clientTransport,
});
```

Now the UI can use `remoteController` exactly like a local controller.

## Other transport shapes

Popup or iframe boundaries:

```ts
const transport = createPostMessageMswPanelBridgeTransport({
  expectedSource: popupWindow,
  listenWindow: window,
  targetOrigin: popupWindow.location.origin,
  targetWindow: popupWindow,
});
```

Remote inspector or relay:

```ts
const transport = createWebSocketMswPanelBridgeTransport({
  socket,
});
```

Tests:

```ts
const { clientTransport, serverTransport } = createInMemoryMswPanelBridgeTransportPair();
```

Read [Bridge transports](/concepts/bridge-transports/) for the tradeoffs behind each option.
