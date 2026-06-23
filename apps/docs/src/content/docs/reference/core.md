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
  presets?: readonly MswPanelPreset[];
}
```

If `handlers` is omitted, the controller starts from `runtime.listHandlers()`.

**Persistence defaults**: `storage` defaults to `window.localStorage` when available, and `storageKey` defaults to `"msw-panel"`. Disabled handler state is therefore persisted across page reloads automatically with no extra configuration. Pass `storage: null` to opt out of persistence entirely.

**Initial state default**: `defaultEnabled` defaults to `true`. Set `defaultEnabled: false` to start with every handler disabled until the user enables the ones they want. Persisted user state still wins when present.

## Controller interface

```ts
interface MswPanelController {
  applyPreset(presetId: string): void;
  getSnapshot(): MswPanelSnapshot;
  setAllEnabled(nextEnabled: boolean): void;
  setEnabled(id: string, nextEnabled: boolean): void;
  setScenario(id: string, scenarioId: string): void;
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
  used: boolean;
  /** Feature tags. Absent on snapshots from older bridge servers; treat as no tags. */
  tags?: string[];
  /** Present when the handler is a scenario group. */
  scenarios?: { id: string; label: string }[];
  /** Active scenario id, when the handler is a scenario group. */
  activeScenario?: string;
}

interface MswPanelSnapshot {
  activeHandlers: number;
  disabledHandlers: number;
  handlers: MswPanelHandlerSnapshot[];
  /**
   * Registered scenario presets. `active` is `true` when all of a preset's selections currently
   * match; `tag` is set for feature-scoped presets (shown in that feature's group header).
   */
  presets?: { id: string; label: string; tag?: string; active?: boolean }[];
  /** Id of the first preset whose selections all currently match, or `null` for a custom mix. */
  activePreset?: string | null;
}
```

## Scenarios and feature tags

Authoring helpers, all exported from `msw-panel`:

```ts
// One endpoint, multiple named response states. Returns an MSW HttpHandler with `.use()`.
function defineScenarios<S extends string>(config: {
  method: "all" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put";
  path: string;
  name?: string;
  tags?: string[];
  default: S;
  scenarios: Record<S, HttpResponseResolver>;
}): ScenarioGroup<S>;

// Wrap MSW handlers you already have (HTTP *or* GraphQL) as scenario variants.
function withScenarios<S extends string>(config: {
  name?: string;
  tags?: string[];
  default: S;
  scenarios: Record<S, RequestHandler | WebSocketHandler>;
}): WrappedScenarioGroup<S>;

// Bundle scenario selections into a named preset. Without a tag it is global (top selector);
// with `{ tag }` it is feature-scoped and shown in that feature's group header.
function definePreset(
  label: string,
  selections: ScenarioSelection[],
  options?: { tag?: string },
): MswPanelPreset;

// Tag handlers for search / filter / grouping. Both return their input.
function withTags<H>(handler: H, tags: string[]): H;
function tagged<H>(tags: string[], handlers: H[]): H[];
```

See the [Scenarios](/msw-panel/guides/scenarios/) and
[Feature tags](/msw-panel/guides/feature-tags/) guides for worked examples.

## Behavior notes

- Disabled state and per-handler scenario selections are automatically persisted to `localStorage` under the key `"msw-panel"` and restored on the next page load. Pass `storage: null` to disable persistence. (Persisted state written by older versions, a bare array of disabled ids, is still read and migrated automatically.)
- `defaultEnabled` only applies to handlers that do not already have persisted state.
- `setAllEnabled()`, `setEnabled()`, `setScenario()`, and `applyPreset()` are no-ops when nothing changes.
- `setScenario()` swaps the live response immediately. No page reload is required, but already-fetched data is not re-requested, so the panel still surfaces the manual "refresh" prompt.
- `sync()` rebuilds records from the runtime and preserves enabled state and scenario selections where identities match.
