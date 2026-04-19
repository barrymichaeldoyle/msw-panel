---
title: Core reference
description: Public types and behavior for msw-panel.
---

## `createMswPanelController(options)`

Creates a controller that tracks handlers, exposes snapshots, persists disabled state, and reapplies the enabled set through the supplied runtime.

```ts
interface CreateMswPanelControllerOptions {
  handlers?: readonly MswAnyHandler[];
  runtime: MswRuntimeController;
  storage?: MswPanelStorage;
  storageKey?: string;
}
```

If `handlers` is omitted, the controller starts from `runtime.listHandlers()`.

## Controller interface

```ts
interface MswPanelController {
  getSnapshot(): MswPanelSnapshot;
  setAllEnabled(nextEnabled: boolean): void;
  setEnabled(id: string, nextEnabled: boolean): void;
  subscribe(listener: () => void): () => void;
  sync(): void;
  toggle(id: string): void;
}
```

## Snapshot shape

```ts
type MswPanelHandlerKind = "graphql" | "http" | "unknown" | "websocket";

interface MswPanelHandlerSnapshot {
  id: string;
  enabled: boolean;
  kind: MswPanelHandlerKind;
  label: string;
  method: string | null;
  path: string | null;
}

interface MswPanelSnapshot {
  activeHandlers: number;
  disabledHandlers: number;
  handlers: MswPanelHandlerSnapshot[];
}
```

## Behavior notes

- Disabled state is restored from storage when provided.
- `setAllEnabled()` and `setEnabled()` are no-ops when nothing changes.
- `sync()` rebuilds records from the runtime and preserves enabled state where identities match.
