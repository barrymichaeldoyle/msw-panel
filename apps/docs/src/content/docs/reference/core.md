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
  storage?: MswPanelStorage | null;
  storageKey?: string;
  defaultEnabled?: boolean;
}
```

If `handlers` is omitted, the controller starts from `runtime.listHandlers()`.

**Persistence defaults** — `storage` defaults to `window.localStorage` when available, and `storageKey` defaults to `"msw-panel"`. Disabled handler state is therefore persisted across page reloads automatically with no extra configuration. Pass `storage: null` to opt out of persistence entirely.

**Initial state default** — `defaultEnabled` defaults to `true`. Set `defaultEnabled: false` to start with every handler disabled until the user enables the ones they want. Persisted user state still wins when present.

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

- Disabled state is automatically persisted to `localStorage` under the key `"msw-panel"` and restored on the next page load. Pass `storage: null` to disable persistence.
- `defaultEnabled` only applies to handlers that do not already have persisted state.
- `setAllEnabled()` and `setEnabled()` are no-ops when nothing changes.
- `sync()` rebuilds records from the runtime and preserves enabled state where identities match.
