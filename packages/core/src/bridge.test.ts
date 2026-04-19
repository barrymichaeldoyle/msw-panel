import { describe, expect, it, vi } from "vitest";

import type { MswPanelController } from "./index.js";

import {
  createInMemoryMswPanelBridgeTransportPair,
  createMswPanelBridgeClient,
  createMswPanelBridgeServer,
  createPostMessageMswPanelBridgeTransport,
  createWebSocketMswPanelBridgeTransport,
} from "./bridge.js";

function createControllerMock(): MswPanelController {
  let snapshot = {
    activeHandlers: 1,
    disabledHandlers: 0,
    handlers: [
      {
        enabled: true,
        id: "request:get:/user",
        kind: "http" as const,
        label: "GET /user",
        method: "GET",
        path: "/user",
        used: false,
      },
    ],
  };
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    getSnapshot: vi.fn(() => snapshot),
    setAllEnabled: vi.fn((enabled: boolean) => {
      snapshot = {
        ...snapshot,
        activeHandlers: enabled ? 1 : 0,
        disabledHandlers: enabled ? 0 : 1,
        handlers: snapshot.handlers.map((handler) => ({
          ...handler,
          enabled,
        })),
      };
      emit();
    }),
    setEnabled: vi.fn((id: string, enabled: boolean) => {
      snapshot = {
        ...snapshot,
        activeHandlers: enabled ? 1 : 0,
        disabledHandlers: enabled ? 0 : 1,
        handlers: snapshot.handlers.map((handler) =>
          handler.id === id
            ? {
                ...handler,
                enabled,
              }
            : handler,
        ),
      };
      emit();
    }),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }),
    sync: vi.fn(() => {
      emit();
    }),
    toggle: vi.fn((id: string) => {
      snapshot = {
        ...snapshot,
        activeHandlers: 0,
        disabledHandlers: 1,
        handlers: snapshot.handlers.map((handler) =>
          handler.id === id
            ? {
                ...handler,
                enabled: !handler.enabled,
              }
            : handler,
        ),
      };
      emit();
    }),
  };
}

interface FakePostMessageWindow {
  addEventListener(
    type: "message",
    listener: (event: { data: unknown; origin: string; source: unknown }) => void,
  ): void;
  origin: string;
  postMessage(message: unknown, targetOrigin: string): void;
  removeEventListener(
    type: "message",
    listener: (event: { data: unknown; origin: string; source: unknown }) => void,
  ): void;
}

function createFakePostMessageWindowPair(): {
  hostWindow: FakePostMessageWindow;
  remoteWindow: FakePostMessageWindow;
} {
  const hostListeners = new Set<
    (event: { data: unknown; origin: string; source: unknown }) => void
  >();
  const remoteListeners = new Set<
    (event: { data: unknown; origin: string; source: unknown }) => void
  >();
  const hostOrigin = "https://host.test";
  const remoteOrigin = "https://remote.test";

  const hostWindow: FakePostMessageWindow = {
    addEventListener(type, listener) {
      if (type === "message") {
        hostListeners.add(listener);
      }
    },
    origin: hostOrigin,
    postMessage(message, targetOrigin) {
      if (targetOrigin !== "*" && targetOrigin !== hostOrigin) {
        return;
      }

      for (const listener of hostListeners) {
        listener({
          data: message,
          origin: remoteOrigin,
          source: remoteWindow,
        });
      }
    },
    removeEventListener(type, listener) {
      if (type === "message") {
        hostListeners.delete(listener);
      }
    },
  };

  const remoteWindow: FakePostMessageWindow = {
    addEventListener(type, listener) {
      if (type === "message") {
        remoteListeners.add(listener);
      }
    },
    origin: remoteOrigin,
    postMessage(message, targetOrigin) {
      if (targetOrigin !== "*" && targetOrigin !== remoteOrigin) {
        return;
      }

      for (const listener of remoteListeners) {
        listener({
          data: message,
          origin: hostOrigin,
          source: hostWindow,
        });
      }
    },
    removeEventListener(type, listener) {
      if (type === "message") {
        remoteListeners.delete(listener);
      }
    },
  };

  return {
    hostWindow,
    remoteWindow,
  };
}

interface FakeWebSocket {
  addEventListener(type: "close" | "open", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  close(): void;
  readyState: number;
  removeEventListener(type: "close" | "open", listener: () => void): void;
  removeEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  send(data: string): void;
}

function createFakeWebSocketPair(): {
  clientSocket: FakeWebSocket;
  openPair: () => void;
  serverSocket: FakeWebSocket;
} {
  const connectingState = 0;
  const openState = 1;
  const closedState = 3;
  const clientOpenListeners = new Set<() => void>();
  const clientCloseListeners = new Set<() => void>();
  const clientMessageListeners = new Set<(event: { data: unknown }) => void>();
  const serverOpenListeners = new Set<() => void>();
  const serverCloseListeners = new Set<() => void>();
  const serverMessageListeners = new Set<(event: { data: unknown }) => void>();
  let clientReadyState = connectingState;
  let serverReadyState = connectingState;

  const clientSocket: FakeWebSocket = {
    addEventListener(type, listener) {
      if (type === "open") {
        clientOpenListeners.add(listener as () => void);
      } else if (type === "close") {
        clientCloseListeners.add(listener as () => void);
      } else {
        clientMessageListeners.add(listener as (event: { data: unknown }) => void);
      }
    },
    close() {
      clientReadyState = closedState;

      for (const listener of clientCloseListeners) {
        listener();
      }
    },
    get readyState() {
      return clientReadyState;
    },
    removeEventListener(type, listener) {
      if (type === "open") {
        clientOpenListeners.delete(listener as () => void);
      } else if (type === "close") {
        clientCloseListeners.delete(listener as () => void);
      } else {
        clientMessageListeners.delete(listener as (event: { data: unknown }) => void);
      }
    },
    send(data) {
      if (clientReadyState !== openState || serverReadyState !== openState) {
        return;
      }

      for (const listener of serverMessageListeners) {
        listener({ data });
      }
    },
  };

  const serverSocket: FakeWebSocket = {
    addEventListener(type, listener) {
      if (type === "open") {
        serverOpenListeners.add(listener as () => void);
      } else if (type === "close") {
        serverCloseListeners.add(listener as () => void);
      } else {
        serverMessageListeners.add(listener as (event: { data: unknown }) => void);
      }
    },
    close() {
      serverReadyState = closedState;

      for (const listener of serverCloseListeners) {
        listener();
      }
    },
    get readyState() {
      return serverReadyState;
    },
    removeEventListener(type, listener) {
      if (type === "open") {
        serverOpenListeners.delete(listener as () => void);
      } else if (type === "close") {
        serverCloseListeners.delete(listener as () => void);
      } else {
        serverMessageListeners.delete(listener as (event: { data: unknown }) => void);
      }
    },
    send(data) {
      if (serverReadyState !== openState || clientReadyState !== openState) {
        return;
      }

      for (const listener of clientMessageListeners) {
        listener({ data });
      }
    },
  };

  return {
    clientSocket,
    openPair() {
      clientReadyState = openState;
      serverReadyState = openState;

      for (const listener of clientOpenListeners) {
        listener();
      }

      for (const listener of serverOpenListeners) {
        listener();
      }
    },
    serverSocket,
  };
}

describe("msw panel bridge", () => {
  it("hydrates the client from the server snapshot", () => {
    const { clientTransport, serverTransport } = createInMemoryMswPanelBridgeTransportPair();
    const controller = createControllerMock();

    createMswPanelBridgeServer({
      controller,
      transport: serverTransport,
    });
    const client = createMswPanelBridgeClient({
      transport: clientTransport,
    });

    expect(client.getSnapshot()).toEqual(controller.getSnapshot());
  });

  it("forwards client commands to the server controller", () => {
    const { clientTransport, serverTransport } = createInMemoryMswPanelBridgeTransportPair();
    const controller = createControllerMock();

    createMswPanelBridgeServer({
      controller,
      transport: serverTransport,
    });
    const client = createMswPanelBridgeClient({
      transport: clientTransport,
    });

    client.toggle("request:get:/user");

    expect(controller.toggle).toHaveBeenCalledWith("request:get:/user");
    expect(client.getSnapshot().handlers[0]).toEqual(expect.objectContaining({ enabled: false }));
  });

  it("notifies client subscribers when a new snapshot arrives", () => {
    const { clientTransport, serverTransport } = createInMemoryMswPanelBridgeTransportPair();
    const controller = createControllerMock();

    createMswPanelBridgeServer({
      controller,
      transport: serverTransport,
    });
    const client = createMswPanelBridgeClient({
      transport: clientTransport,
    });
    const listener = vi.fn();

    client.subscribe(listener);
    client.setAllEnabled(false);

    expect(listener).toHaveBeenCalled();
    expect(client.getSnapshot().disabledHandlers).toBe(1);
  });

  it("supports postMessage transports across window boundaries", () => {
    const { hostWindow, remoteWindow } = createFakePostMessageWindowPair();
    const controller = createControllerMock();
    const serverTransport = createPostMessageMswPanelBridgeTransport({
      expectedSource: remoteWindow,
      listenWindow: hostWindow,
      targetOrigin: remoteWindow.origin,
      targetWindow: remoteWindow,
    });
    const clientTransport = createPostMessageMswPanelBridgeTransport({
      expectedSource: hostWindow,
      listenWindow: remoteWindow,
      targetOrigin: hostWindow.origin,
      targetWindow: hostWindow,
    });

    createMswPanelBridgeServer({
      controller,
      transport: serverTransport,
    });
    const client = createMswPanelBridgeClient({
      transport: clientTransport,
    });

    client.setAllEnabled(false);

    expect(controller.setAllEnabled).toHaveBeenCalledWith(false);
    expect(client.getSnapshot().disabledHandlers).toBe(1);
  });

  it("supports websocket transports and flushes queued bridge messages on open", () => {
    const { clientSocket, openPair, serverSocket } = createFakeWebSocketPair();
    const controller = createControllerMock();
    const serverTransport = createWebSocketMswPanelBridgeTransport({
      socket: serverSocket,
    });
    const clientTransport = createWebSocketMswPanelBridgeTransport({
      socket: clientSocket,
    });

    createMswPanelBridgeServer({
      controller,
      transport: serverTransport,
    });
    const client = createMswPanelBridgeClient({
      transport: clientTransport,
    });

    openPair();

    expect(client.getSnapshot()).toEqual(controller.getSnapshot());

    client.toggle("request:get:/user");

    expect(controller.toggle).toHaveBeenCalledWith("request:get:/user");
    expect(client.getSnapshot().disabledHandlers).toBe(1);
  });
});
