import type { RequestHandler, WebSocketHandler } from "msw";

type MswAnyHandler = RequestHandler | WebSocketHandler;

export type MswPanelHandlerKind = "graphql" | "http" | "unknown" | "websocket";

export interface MswPanelHandlerSnapshot {
  id: string;
  enabled: boolean;
  kind: MswPanelHandlerKind;
  label: string;
  method: string | null;
  path: string | null;
  used: boolean;
}

export interface MswPanelSnapshot {
  activeHandlers: number;
  disabledHandlers: number;
  handlers: MswPanelHandlerSnapshot[];
}

export interface MswPanelStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface MswRuntimeController {
  listHandlers(): readonly MswAnyHandler[];
  resetHandlers(...nextHandlers: MswAnyHandler[]): void;
}

export interface CreateMswPanelControllerOptions {
  handlers?: readonly MswAnyHandler[];
  runtime: MswRuntimeController;
  storage?: MswPanelStorage;
  storageKey?: string;
}

export interface MswPanelController {
  getSnapshot(): MswPanelSnapshot;
  setAllEnabled(nextEnabled: boolean): void;
  setEnabled(id: string, nextEnabled: boolean): void;
  subscribe(listener: () => void): () => void;
  sync(): void;
  toggle(id: string): void;
}

interface HandlerRecord {
  handler: MswAnyHandler;
  id: string;
  enabled: boolean;
  used: boolean;
  snapshot: Omit<MswPanelHandlerSnapshot, "enabled" | "used">;
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

export function createMswPanelController(
  options: CreateMswPanelControllerOptions,
): MswPanelController {
  const listeners = new Set<() => void>();
  const trackedHandlers = options.handlers ?? options.runtime.listHandlers();
  let records = buildRecords(trackedHandlers);
  let cachedSnapshot: MswPanelSnapshot | null = null;
  let pollingTimer: ReturnType<typeof setInterval> | null = null;

  hydrateDisabledState(records, options.storage, options.storageKey);
  applyHandlerState(options.runtime, records);

  const emitChange = () => {
    cachedSnapshot = null;
    persistDisabledState(records, options.storage, options.storageKey);
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

  return {
    getSnapshot() {
      if (cachedSnapshot) return cachedSnapshot;

      const handlers = records.map((record) => ({
        ...record.snapshot,
        enabled: record.enabled,
        used: record.used,
      }));
      const activeHandlers = handlers.filter((h) => h.enabled).length;

      cachedSnapshot = {
        activeHandlers,
        disabledHandlers: handlers.length - activeHandlers,
        handlers,
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
      const nextRecords = buildRecords(options.runtime.listHandlers(), records);

      records = nextRecords;
      hydrateDisabledState(records, options.storage, options.storageKey);
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

function applyHandlerState(runtime: MswRuntimeController, records: HandlerRecord[]): void {
  runtime.resetHandlers(
    ...records.filter((record) => record.enabled).map((record) => record.handler),
  );
}

function buildRecords(
  handlers: readonly MswAnyHandler[],
  previousRecords: HandlerRecord[] = [],
): HandlerRecord[] {
  const previousRecordsById = new Map(
    previousRecords.map((record) => [record.id, record] as const),
  );
  const identityCount = new Map<string, number>();

  return handlers.map((handler, index) => {
    const id = createHandlerId(handler, identityCount);
    const previousRecord = previousRecordsById.get(id);

    return {
      enabled: previousRecord?.enabled ?? true,
      used: getUsed(handler),
      handler,
      id,
      snapshot: describeHandler(handler, id ?? `handler-${index}`),
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
): Omit<MswPanelHandlerSnapshot, "enabled" | "used"> {
  const handlerShape = handler as unknown;
  const info = (handlerShape as { info?: HandlerInfoShape }).info ?? {};
  const kind = (handlerShape as { kind?: string }).kind;

  if (kind === "websocket") {
    return { id, kind: "websocket", label: "WS connection", method: null, path: null };
  }

  if (info.operationType || info.operationName) {
    const operationType = info.operationType?.toUpperCase() ?? "GRAPHQL";
    const operationName = info.operationName ?? "anonymous";
    return {
      id,
      kind: "graphql",
      label: `${operationType} ${operationName}`,
      method: null,
      path: info.path ?? null,
    };
  }

  const method = info.method?.toUpperCase() ?? null;
  const path = info.path ?? null;
  const label = info.header ?? ([method, path].filter(Boolean).join(" ") || "Unknown handler");

  return { id, kind: method ? "http" : "unknown", label, method, path };
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

function hydrateDisabledState(
  records: HandlerRecord[],
  storage?: MswPanelStorage,
  storageKey?: string,
): void {
  if (!storage || !storageKey) return;

  const rawValue = storage.getItem(storageKey);
  if (!rawValue) return;

  try {
    const disabledIds = new Set(JSON.parse(rawValue) as string[]);
    for (const record of records) {
      record.enabled = !disabledIds.has(record.id);
    }
  } catch {
    storage.setItem(storageKey, JSON.stringify([]));
  }
}

function persistDisabledState(
  records: HandlerRecord[],
  storage?: MswPanelStorage,
  storageKey?: string,
): void {
  if (!storage || !storageKey) return;

  const disabledIds = records.filter((record) => !record.enabled).map((record) => record.id);
  storage.setItem(storageKey, JSON.stringify(disabledIds));
}
