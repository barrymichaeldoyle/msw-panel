---
title: Bridge reference
description: Message model and public helpers for msw-panel/bridge.
---

## Server and client

```ts
createMswPanelBridgeServer({
  controller,
  transport,
});

const remoteController = createMswPanelBridgeClient({
  initialSnapshot: controller.getSnapshot(),
  transport,
});
```

The server listens for commands and publishes snapshots. The client exposes a controller-compatible interface backed by transport messages.

## Transport contract

```ts
interface MswPanelBridgeTransport {
  post(message: MswPanelBridgeMessage): void;
  subscribe(listener: (message: MswPanelBridgeMessage) => void): () => void;
}
```

## Message types

```ts
type MswPanelBridgeMessage =
  | { source: "msw-panel"; type: "hello" }
  | { source: "msw-panel"; type: "command"; command: MswPanelBridgeCommand }
  | { source: "msw-panel"; type: "snapshot"; snapshot: MswPanelSnapshot };
```

Supported commands:

- `set-all-enabled`
- `set-enabled`
- `sync`
- `toggle`

## Built-in helpers

- `createBroadcastChannelMswPanelBridgeTransport(channelName)`
- `createPostMessageMswPanelBridgeTransport(options)`
- `createInMemoryMswPanelBridgeTransportPair()`
- `createWebSocketMswPanelBridgeTransport(options)`

## Transport-specific options

### `createPostMessageMswPanelBridgeTransport(options)`

```ts
interface CreatePostMessageMswPanelBridgeTransportOptions {
  expectedSource?: unknown;
  listenWindow: MswPanelBridgePostMessageListenerHost;
  targetOrigin: string;
  targetWindow: MswPanelBridgePostMessageTarget;
  validateOrigin?: (origin: string) => boolean;
}
```

### `createWebSocketMswPanelBridgeTransport(options)`

```ts
interface CreateWebSocketMswPanelBridgeTransportOptions {
  closeOnDispose?: boolean;
  deserialize?: (value: string) => unknown;
  serialize?: (message: MswPanelBridgeMessage) => string;
  socket: MswPanelBridgeWebSocketLike;
}
```
