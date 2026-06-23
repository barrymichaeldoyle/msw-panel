import type { RequestHandler, WebSocketHandler } from "msw";

import {
  type MswPanelPreset,
  type ScenarioDescriptor,
  type ScenarioGroupMeta,
  type ScenarioSelection,
  readMswPanelMeta,
} from "./scenarios.js";

export * from "./scenarios.js";

type MswAnyHandler = RequestHandler | WebSocketHandler;

export type MswPanelHandlerKind = "graphql" | "http" | "unknown" | "websocket";

/** A point-in-time description of a single MSW handler and its current state. */
export interface MswPanelHandlerSnapshot {
  /** Stable identifier used to persist and re-apply disabled state across reloads. */
  id: string;
  /** Currently active scenario id, when this handler is a scenario group. */
  activeScenario?: string;
  /** Whether this handler is currently active in the MSW runtime. */
  enabled: boolean;
  /** Broad category of handler: HTTP request, GraphQL operation, WebSocket, or unknown. */
  kind: MswPanelHandlerKind;
  /** Human-readable display label shown in the panel. */
  label: string;
  /** HTTP method (e.g. `"GET"`), or `null` for non-HTTP handlers. */
  method: string | null;
  /** URL path or pattern, or `null` for non-HTTP handlers. */
  path: string | null;
  /** Named scenarios for this handler, when created with `defineScenarios`. */
  scenarios?: ScenarioDescriptor[];
  /**
   * Feature tags attached via `withTags`, `tagged`, or `defineScenarios`. May be absent on
   * snapshots produced by older bridge servers; treat a missing value as no tags.
   */
  tags?: string[];
  /** `true` if this handler has matched at least one request in the current session. */
  used: boolean;
}

/** A scenario preset as surfaced to the panel UI. */
export interface MswPanelPresetSnapshot {
  /** Stable preset id. */
  id: string;
  /** Display label shown in the preset selector. */
  label: string;
  /**
   * Feature tag this preset is scoped to, when defined with `definePreset(..., { tag })`. Tagged
   * presets render in their feature's group header; untagged ones in the global selector.
   */
  tag?: string;
  /**
   * `true` when every selection in this preset currently matches the live scenario state. May be
   * absent on snapshots produced by older bridge servers; treat a missing value as `false`.
   */
  active?: boolean;
}

/** Aggregated view of all handlers and their states, returned by `getSnapshot()`. */
export interface MswPanelSnapshot {
  /**
   * Id of the preset whose selections all currently match, or `null` when none match. May be
   * absent on snapshots produced by older bridge servers.
   */
  activePreset?: string | null;
  /** Number of handlers currently enabled in the MSW runtime. */
  activeHandlers: number;
  /** Number of handlers currently disabled. */
  disabledHandlers: number;
  /** Ordered list of handler snapshots. */
  handlers: MswPanelHandlerSnapshot[];
  /**
   * Available global scenario presets. May be absent on snapshots produced by older bridge
   * servers; treat a missing value as no presets.
   */
  presets?: MswPanelPresetSnapshot[];
}

/** Storage interface for persisting disabled handler IDs across reloads. Compatible with `localStorage`. */
export interface MswPanelStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface MswRuntimeController {
  listHandlers(): readonly MswAnyHandler[];
  resetHandlers(...nextHandlers: MswAnyHandler[]): void;
}

/**
 * Options for `createMswPanelController`.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/guides/getting-started/
 */
export interface CreateMswPanelControllerOptions {
  /**
   * Explicit handler list to track. Defaults to `runtime.listHandlers()` at
   * construction time if omitted.
   */
  handlers?: readonly MswAnyHandler[];
  /** The MSW browser worker or Node server instance. */
  runtime: MswRuntimeController;
  /**
   * Storage for persisting disabled state. Defaults to `window.localStorage` when available.
   * Pass a custom implementation or `null` to disable persistence entirely.
   */
  storage?: MswPanelStorage | null;
  /** Key used to read and write disabled state in `storage`. Defaults to `"msw-panel"`. */
  storageKey?: string;
  /**
   * Default enabled state for handlers that do not already have persisted user state.
   * Defaults to `true`.
   */
  defaultEnabled?: boolean;
  /**
   * Global scenario presets (from `definePreset`) shown as a single selector in the panel.
   * Applying one sets the active scenario of every handler it references at once.
   */
  presets?: readonly MswPanelPreset[];
}

/**
 * Controller that tracks MSW handlers and exposes a subscribable snapshot.
 * Pass to `<MswPanel>` or a bridge server to wire up the UI.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/reference/core/
 */
export interface MswPanelController {
  /** Applies a registered preset by id, setting every referenced handler's active scenario. */
  applyPreset(presetId: string): void;
  /** Returns the current immutable snapshot of all handler states. */
  getSnapshot(): MswPanelSnapshot;
  /** Enables or disables all handlers at once. */
  setAllEnabled(nextEnabled: boolean): void;
  /** Enables or disables a single handler by its stable ID. */
  setEnabled(id: string, nextEnabled: boolean): void;
  /** Sets the active scenario for a scenario-group handler by its stable ID. */
  setScenario(id: string, scenarioId: string): void;
  /** Subscribes a listener to snapshot changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Re-reads the runtime's current handler list and rebuilds the snapshot. Call after adding handlers at runtime. */
  sync(): void;
  /** Toggles the enabled state of a single handler by its stable ID. */
  toggle(id: string): void;
}

interface HandlerRecord {
  handler: MswAnyHandler;
  id: string;
  enabled: boolean;
  used: boolean;
  /** Mutable scenario-group state shared with the registered handler, when applicable. */
  scenario?: ScenarioGroupMeta;
  snapshot: Omit<MswPanelHandlerSnapshot, "activeScenario" | "enabled" | "used">;
}

interface HandlerInfoShape {
  callFrame?: string;
  header?: string;
  method?: string;
  operationName?: string;
  operationType?: string;
  path?: string;
}

function getUsed(handler: MswAnyHandler): boolean {
  return (handler as { isUsed?: boolean }).isUsed ?? false;
}

/**
 * Creates a controller that tracks and manages MSW handler state at runtime.
 * Pass the returned controller to `<MswPanel>` or a bridge server.
 *
 * @see https://barrymichaeldoyle.github.io/msw-panel/guides/getting-started/
 */
export function createMswPanelController(
  options: CreateMswPanelControllerOptions,
): MswPanelController {
  const listeners = new Set<() => void>();
  const defaultEnabled = options.defaultEnabled ?? true;
  const presets = options.presets ?? [];
  const trackedHandlers = options.handlers ?? options.runtime.listHandlers();
  let records = buildRecords(trackedHandlers, defaultEnabled);
  let cachedSnapshot: MswPanelSnapshot | null = null;
  let pollingTimer: ReturnType<typeof setInterval> | null = null;

  const storage =
    options.storage !== undefined
      ? options.storage
      : typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : null;
  const storageKey = options.storageKey ?? "msw-panel";

  hydratePersistedState(records, storage ?? undefined, storageKey);
  applyHandlerState(options.runtime, records);

  const emitChange = () => {
    cachedSnapshot = null;
    persistState(records, storage ?? undefined, storageKey);
    for (const listener of listeners) listener();
  };

  const tickUsed = () => {
    let changed = false;
    const next = records.map((record) => {
      const used = getUsed(record.handler);
      if (used === record.used) return record;
      changed = true;
      return { ...record, used };
    });
    if (changed) {
      records = next;
      cachedSnapshot = null;
      for (const listener of listeners) listener();
    }
  };

  const setRecordEnabled = (id: string, nextEnabled: boolean) => {
    let didChange = false;

    records = records.map((record) => {
      if (record.id !== id || record.enabled === nextEnabled) return record;
      didChange = true;
      return { ...record, enabled: nextEnabled };
    });

    if (!didChange) return;

    applyHandlerState(options.runtime, records);
    emitChange();
  };

  const setScenario = (id: string, scenarioId: string) => {
    const record = records.find((entry) => entry.id === id);
    if (!record?.scenario || record.scenario.getActive() === scenarioId) return;

    record.scenario.setActive(scenarioId);
    if (record.scenario.getActive() !== scenarioId) return;
    emitChange();
  };

  return {
    applyPreset(presetId) {
      const preset = presets.find((entry) => entry.id === presetId);
      if (!preset) return;

      let didChange = false;
      for (const selection of preset.selections) {
        const record = findSelectionRecord(records, selection);
        if (!record?.scenario || record.scenario.getActive() === selection.scenarioId) continue;
        record.scenario.setActive(selection.scenarioId);
        if (record.scenario.getActive() === selection.scenarioId) didChange = true;
      }

      if (didChange) emitChange();
    },
    getSnapshot() {
      if (cachedSnapshot) return cachedSnapshot;

      const handlers = records.map((record) => ({
        ...record.snapshot,
        enabled: record.enabled,
        used: record.used,
        ...(record.scenario ? { activeScenario: record.scenario.getActive() } : null),
      }));
      const activeHandlers = handlers.filter((h) => h.enabled).length;

      cachedSnapshot = {
        activePreset: findActivePreset(presets, records),
        activeHandlers,
        disabledHandlers: handlers.length - activeHandlers,
        handlers,
        presets: presets.map((preset) => ({
          id: preset.id,
          label: preset.label,
          ...(preset.tag ? { tag: preset.tag } : null),
          active: isPresetActive(preset, records),
        })),
      };

      return cachedSnapshot;
    },
    setAllEnabled(nextEnabled) {
      let didChange = false;

      records = records.map((record) => {
        if (record.enabled === nextEnabled) return record;
        didChange = true;
        return { ...record, enabled: nextEnabled };
      });

      if (!didChange) return;

      applyHandlerState(options.runtime, records);
      emitChange();
    },
    setEnabled(id, nextEnabled) {
      setRecordEnabled(id, nextEnabled);
    },
    setScenario(id, scenarioId) {
      setScenario(id, scenarioId);
    },
    subscribe(listener) {
      listeners.add(listener);
      if (pollingTimer === null) {
        pollingTimer = setInterval(tickUsed, 400);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && pollingTimer !== null) {
          clearInterval(pollingTimer);
          pollingTimer = null;
        }
      };
    },
    sync() {
      const previousRecords = records;
      const nextRecords = buildRecords(options.runtime.listHandlers(), defaultEnabled, records);

      records = nextRecords;
      hydratePersistedState(records, storage ?? undefined, storageKey);
      applyHandlerState(options.runtime, records);

      if (!areRecordsEqual(previousRecords, records)) {
        emitChange();
      }
    },
    toggle(id) {
      const record = records.find((entry) => entry.id === id);
      if (!record) return;
      setRecordEnabled(id, !record.enabled);
    },
  };
}

function areRecordsEqual(currentRecords: HandlerRecord[], nextRecords: HandlerRecord[]): boolean {
  if (currentRecords.length !== nextRecords.length) return false;

  return currentRecords.every((record, index) => {
    const next = nextRecords[index];
    return (
      record.id === next.id &&
      record.enabled === next.enabled &&
      record.used === next.used &&
      record.handler === next.handler &&
      record.snapshot.id === next.snapshot.id &&
      record.snapshot.kind === next.snapshot.kind &&
      record.snapshot.label === next.snapshot.label &&
      record.snapshot.method === next.snapshot.method &&
      record.snapshot.path === next.snapshot.path
    );
  });
}

// Symbol() (not Symbol.for) so TypeScript infers a unique symbol, enabling computed type keys.
const DISABLED_ORIGINAL = Symbol("msw-panel:disabledOriginal");

type WithDisabledOriginal = { [DISABLED_ORIGINAL]: MswAnyHandler };

function wrapDisabledHandler(handler: MswAnyHandler): MswAnyHandler {
  const wrapper = Object.create(handler) as MswAnyHandler;
  // MSW skips a handler when run() returns null, effectively disabling it
  (wrapper as unknown as { run(): null }).run = () => null;
  (wrapper as unknown as WithDisabledOriginal)[DISABLED_ORIGINAL] = handler;
  return wrapper;
}

function unwrapHandler(handler: MswAnyHandler): MswAnyHandler {
  return (handler as unknown as Partial<WithDisabledOriginal>)[DISABLED_ORIGINAL] ?? handler;
}

function applyHandlerState(runtime: MswRuntimeController, records: HandlerRecord[]): void {
  // Always pass every handler to resetHandlers — disabled ones are wrapped so their run()
  // returns null (MSW's "didn't match" signal). Passing an empty array would instead trigger
  // MSW's "restore initial handlers" path, re-enabling everything.
  runtime.resetHandlers(
    ...records.map((record) =>
      record.enabled ? record.handler : wrapDisabledHandler(record.handler),
    ),
  );
}

function buildRecords(
  handlers: readonly MswAnyHandler[],
  defaultEnabled: boolean,
  previousRecords: HandlerRecord[] = [],
): HandlerRecord[] {
  const previousRecordsById = new Map(
    previousRecords.map((record) => [record.id, record] as const),
  );
  const identityCount = new Map<string, number>();

  return handlers.map((rawHandler, index) => {
    const handler = unwrapHandler(rawHandler);
    const id = createHandlerId(handler, identityCount);
    const previousRecord = previousRecordsById.get(id);
    const meta = readMswPanelMeta(handler);

    return {
      enabled: previousRecord?.enabled ?? defaultEnabled,
      used: getUsed(handler),
      handler,
      id,
      scenario: meta?.scenario,
      snapshot: describeHandler(handler, id ?? `handler-${index}`, meta?.tags, meta?.scenario),
    };
  });
}

function createHandlerId(handler: MswAnyHandler, identityCount: Map<string, number>): string {
  const identity = getHandlerIdentity(handler);
  const duplicateIndex = identityCount.get(identity) ?? 0;
  identityCount.set(identity, duplicateIndex + 1);
  return duplicateIndex === 0 ? identity : `${identity}#${duplicateIndex + 1}`;
}

function describeHandler(
  handler: MswAnyHandler,
  id: string,
  tags: string[] | undefined,
  scenario: ScenarioGroupMeta | undefined,
): Omit<MswPanelHandlerSnapshot, "activeScenario" | "enabled" | "used"> {
  const handlerShape = handler as unknown;
  const info = (handlerShape as { info?: HandlerInfoShape }).info ?? {};
  const kind = (handlerShape as { kind?: string }).kind;
  const extra = {
    tags: tags ?? [],
    ...(scenario ? { scenarios: scenario.scenarios } : null),
  };

  if (kind === "websocket") {
    return { id, kind: "websocket", label: "WS connection", method: null, path: null, ...extra };
  }

  if (info.operationType || info.operationName) {
    const operationType = info.operationType?.toUpperCase() ?? "GRAPHQL";
    const operationName = info.operationName ?? "anonymous";
    return {
      id,
      kind: "graphql",
      label: scenario?.name ?? `${operationType} ${operationName}`,
      method: null,
      path: info.path ?? null,
      ...extra,
    };
  }

  const method = info.method?.toUpperCase() ?? null;
  const path = info.path ?? null;
  const label =
    scenario?.name ??
    info.header ??
    ([method, path].filter(Boolean).join(" ") || "Unknown handler");

  return { id, kind: method ? "http" : "unknown", label, method, path, ...extra };
}

function getHandlerIdentity(handler: MswAnyHandler): string {
  const handlerShape = handler as unknown;
  const info = (handlerShape as { info?: HandlerInfoShape }).info ?? {};
  const kind = (handlerShape as { kind?: string }).kind;
  const callFrame = (handlerShape as { callFrame?: string }).callFrame ?? info.callFrame;

  if (kind === "websocket") {
    const websocketId = (handlerShape as { id?: string }).id;
    return `websocket:${websocketId ?? "connection"}`;
  }

  if (info.operationType || info.operationName) {
    return [
      "graphql",
      info.operationType?.toLowerCase() ?? "operation",
      info.operationName ?? "anonymous",
      info.path ?? "any",
    ].join(":");
  }

  if (info.method || info.path || info.header) {
    return [
      "request",
      info.method?.toLowerCase() ?? "any",
      info.path ?? info.header ?? "unknown",
    ].join(":");
  }

  if (callFrame) return `${kind ?? "handler"}:${callFrame}`;

  return `${kind ?? "handler"}:unknown`;
}

/**
 * Resolves the record a preset selection targets. Matches by handler identity first, then falls back
 * to the stable handler id. The fallback matters because a preset captures handler objects at module
 * load, but the controller tracks whatever `runtime.listHandlers()` returns — and those can drift to
 * different instances (e.g. when an HMR update re-evaluates the handlers module and swaps the worker's
 * handlers without re-running the code that built the presets). Matching by id keeps presets working.
 */
function findSelectionRecord(
  records: HandlerRecord[],
  selection: ScenarioSelection,
): HandlerRecord | undefined {
  const direct = records.find((entry) => entry.handler === selection.handler);
  if (direct) return direct;
  const identity = getHandlerIdentity(selection.handler);
  return records.find((entry) => getHandlerIdentity(entry.handler) === identity);
}

/** True when every selection in the preset currently matches the live scenario state. */
function isPresetActive(preset: MswPanelPreset, records: HandlerRecord[]): boolean {
  if (preset.selections.length === 0) return false;
  return preset.selections.every((selection) => {
    const record = findSelectionRecord(records, selection);
    return record?.scenario?.getActive() === selection.scenarioId;
  });
}

function findActivePreset(
  presets: readonly MswPanelPreset[],
  records: HandlerRecord[],
): string | null {
  for (const preset of presets) {
    if (isPresetActive(preset, records)) return preset.id;
  }
  return null;
}

interface PersistedState {
  disabled: string[];
  scenarios: Record<string, string>;
}

/**
 * Parses persisted state, accepting both the current object shape and the legacy
 * `string[]` of disabled ids written by older versions.
 */
function parsePersistedState(rawValue: string): PersistedState {
  const parsed = JSON.parse(rawValue) as unknown;

  if (Array.isArray(parsed)) {
    return { disabled: parsed as string[], scenarios: {} };
  }
  if (parsed && typeof parsed === "object") {
    const candidate = parsed as Partial<PersistedState>;
    return {
      disabled: Array.isArray(candidate.disabled) ? candidate.disabled : [],
      scenarios:
        candidate.scenarios && typeof candidate.scenarios === "object" ? candidate.scenarios : {},
    };
  }
  return { disabled: [], scenarios: {} };
}

function hydratePersistedState(
  records: HandlerRecord[],
  storage?: MswPanelStorage,
  storageKey?: string,
): void {
  if (!storage || !storageKey) return;

  const rawValue = storage.getItem(storageKey);
  if (!rawValue) return;

  try {
    const { disabled, scenarios } = parsePersistedState(rawValue);
    const disabledIds = new Set(disabled);
    for (const record of records) {
      record.enabled = !disabledIds.has(record.id);
      const persistedScenario = scenarios[record.id];
      if (record.scenario && persistedScenario !== undefined) {
        record.scenario.setActive(persistedScenario);
      }
    }
  } catch {
    storage.setItem(storageKey, JSON.stringify({ disabled: [], scenarios: {} }));
  }
}

function persistState(
  records: HandlerRecord[],
  storage?: MswPanelStorage,
  storageKey?: string,
): void {
  if (!storage || !storageKey) return;

  const disabled = records.filter((record) => !record.enabled).map((record) => record.id);
  const scenarios: Record<string, string> = {};
  for (const record of records) {
    if (record.scenario) {
      scenarios[record.id] = record.scenario.getActive();
    }
  }
  storage.setItem(storageKey, JSON.stringify({ disabled, scenarios }));
}
