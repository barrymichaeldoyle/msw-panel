import type { MswPanelController, MswPanelSnapshot } from "./index.js";

export interface MswPanelBridgeTransport {
  post(message: MswPanelBridgeMessage): void;
  subscribe(listener: (message: MswPanelBridgeMessage) => void): () => void;
}

export interface MswPanelBridgeEndpoint {
  dispose(): void;
}

export interface MswPanelBridgePostMessageTarget {
  postMessage(message: MswPanelBridgeMessage, targetOrigin: string): void;
}

export interface MswPanelBridgePostMessageEvent {
  data: unknown;
  origin: string;
  source: unknown;
}

export interface MswPanelBridgePostMessageListenerHost {
  addEventListener(
    type: "message",
    listener: (event: MswPanelBridgePostMessageEvent) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MswPanelBridgePostMessageEvent) => void,
  ): void;
}

export interface CreatePostMessageMswPanelBridgeTransportOptions {
  expectedSource?: unknown;
  listenWindow: MswPanelBridgePostMessageListenerHost;
  targetOrigin: string;
  targetWindow: MswPanelBridgePostMessageTarget;
  validateOrigin?: (origin: string) => boolean;
}

export interface MswPanelBridgeWebSocketMessageEvent {
  data: unknown;
}

export interface MswPanelBridgeWebSocketLike {
  addEventListener(type: "close", listener: () => void): void;
  addEventListener(
    type: "message",
    listener: (event: MswPanelBridgeWebSocketMessageEvent) => void,
  ): void;
  addEventListener(type: "open", listener: () => void): void;
  close?(): void;
  readyState: number;
  removeEventListener(type: "close", listener: () => void): void;
  removeEventListener(
    type: "message",
    listener: (event: MswPanelBridgeWebSocketMessageEvent) => void,
  ): void;
  removeEventListener(type: "open", listener: () => void): void;
  send(data: string): void;
}

export interface CreateWebSocketMswPanelBridgeTransportOptions {
  closeOnDispose?: boolean;
  deserialize?: (value: string) => unknown;
  serialize?: (message: MswPanelBridgeMessage) => string;
  socket: MswPanelBridgeWebSocketLike;
}

export interface CreateMswPanelBridgeServerOptions {
  controller: MswPanelController;
  transport: MswPanelBridgeTransport;
}

export interface CreateMswPanelBridgeClientOptions {
  initialSnapshot?: MswPanelSnapshot;
  transport: MswPanelBridgeTransport;
}

type MswPanelBridgeCommand =
  | {
      action: "apply-preset";
      presetId: string;
    }
  | {
      action: "set-all-enabled";
      enabled: boolean;
    }
  | {
      action: "set-enabled";
      enabled: boolean;
      id: string;
    }
  | {
      action: "set-scenario";
      id: string;
      scenarioId: string;
    }
  | {
      action: "sync";
    }
  | {
      action: "toggle";
      id: string;
    };

export type MswPanelBridgeMessage =
  | {
      source: "msw-panel";
      type: "hello";
    }
  | {
      command: MswPanelBridgeCommand;
      source: "msw-panel";
      type: "command";
    }
  | {
      snapshot: MswPanelSnapshot;
      source: "msw-panel";
      type: "snapshot";
    };

const websocketConnectingState = 0;
const websocketOpenState = 1;
const websocketClosingState = 2;

function isMswPanelBridgeMessage(value: unknown): value is MswPanelBridgeMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    source?: unknown;
    type?: unknown;
  };

  return candidate.source === "msw-panel" && typeof candidate.type === "string";
}

const emptySnapshot: MswPanelSnapshot = {
  activePreset: null,
  activeHandlers: 0,
  disabledHandlers: 0,
  handlers: [],
  presets: [],
};

export function createMswPanelBridgeServer(
  options: CreateMswPanelBridgeServerOptions,
): MswPanelBridgeEndpoint {
  const publishSnapshot = () => {
    options.transport.post({
      snapshot: options.controller.getSnapshot(),
      source: "msw-panel",
      type: "snapshot",
    });
  };

  const unsubscribeTransport = options.transport.subscribe((message) => {
    if (message.source !== "msw-panel") {
      return;
    }

    if (message.type === "hello") {
      publishSnapshot();
      return;
    }

    if (message.type !== "command") {
      return;
    }

    switch (message.command.action) {
      case "apply-preset":
        options.controller.applyPreset(message.command.presetId);
        break;
      case "set-all-enabled":
        options.controller.setAllEnabled(message.command.enabled);
        break;
      case "set-enabled":
        options.controller.setEnabled(message.command.id, message.command.enabled);
        break;
      case "set-scenario":
        options.controller.setScenario(message.command.id, message.command.scenarioId);
        break;
      case "sync":
        options.controller.sync();
        break;
      case "toggle":
        options.controller.toggle(message.command.id);
        break;
    }
  });
  const unsubscribeController = options.controller.subscribe(publishSnapshot);

  publishSnapshot();

  return {
    dispose() {
      unsubscribeTransport();
      unsubscribeController();
    },
  };
}

export function createMswPanelBridgeClient(
  options: CreateMswPanelBridgeClientOptions,
): MswPanelController & MswPanelBridgeEndpoint {
  const listeners = new Set<() => void>();
  let snapshot = options.initialSnapshot ?? emptySnapshot;

  const emitChange = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const unsubscribeTransport = options.transport.subscribe((message) => {
    if (message.source !== "msw-panel" || message.type !== "snapshot") {
      return;
    }

    snapshot = message.snapshot;
    emitChange();
  });

  options.transport.post({
    source: "msw-panel",
    type: "hello",
  });

  const postCommand = (command: MswPanelBridgeCommand) => {
    options.transport.post({
      command,
      source: "msw-panel",
      type: "command",
    });
  };

  return {
    applyPreset(presetId) {
      postCommand({
        action: "apply-preset",
        presetId,
      });
    },
    dispose() {
      unsubscribeTransport();
    },
    getSnapshot() {
      return snapshot;
    },
    setAllEnabled(nextEnabled) {
      postCommand({
        action: "set-all-enabled",
        enabled: nextEnabled,
      });
    },
    setEnabled(id, nextEnabled) {
      postCommand({
        action: "set-enabled",
        enabled: nextEnabled,
        id,
      });
    },
    setScenario(id, scenarioId) {
      postCommand({
        action: "set-scenario",
        id,
        scenarioId,
      });
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    sync() {
      postCommand({
        action: "sync",
      });
    },
    toggle(id) {
      postCommand({
        action: "toggle",
        id,
      });
    },
  };
}

export function createBroadcastChannelMswPanelBridgeTransport(
  channelName: string,
): MswPanelBridgeTransport & MswPanelBridgeEndpoint {
  const channel = new BroadcastChannel(channelName);

  return {
    dispose() {
      channel.close();
    },
    post(message) {
      channel.postMessage(message);
    },
    subscribe(listener) {
      const handleMessage = (event: MessageEvent<MswPanelBridgeMessage>) => {
        listener(event.data);
      };

      channel.addEventListener("message", handleMessage);

      return () => {
        channel.removeEventListener("message", handleMessage);
      };
    },
  };
}

export function createPostMessageMswPanelBridgeTransport(
  options: CreatePostMessageMswPanelBridgeTransportOptions,
): MswPanelBridgeTransport & MswPanelBridgeEndpoint {
  const isAllowedOrigin =
    options.validateOrigin ??
    ((origin: string) => options.targetOrigin === "*" || origin === options.targetOrigin);

  return {
    dispose() {},
    post(message) {
      options.targetWindow.postMessage(message, options.targetOrigin);
    },
    subscribe(listener) {
      const handleMessage = (event: MswPanelBridgePostMessageEvent) => {
        if (!isAllowedOrigin(event.origin)) {
          return;
        }

        if (options.expectedSource && event.source !== options.expectedSource) {
          return;
        }

        if (!isMswPanelBridgeMessage(event.data)) {
          return;
        }

        listener(event.data);
      };

      options.listenWindow.addEventListener("message", handleMessage);

      return () => {
        options.listenWindow.removeEventListener("message", handleMessage);
      };
    },
  };
}

export function createInMemoryMswPanelBridgeTransportPair(): {
  clientTransport: MswPanelBridgeTransport;
  serverTransport: MswPanelBridgeTransport;
} {
  const serverListeners = new Set<(message: MswPanelBridgeMessage) => void>();
  const clientListeners = new Set<(message: MswPanelBridgeMessage) => void>();

  return {
    clientTransport: {
      post(message) {
        for (const listener of serverListeners) {
          listener(message);
        }
      },
      subscribe(listener) {
        clientListeners.add(listener);

        return () => {
          clientListeners.delete(listener);
        };
      },
    },
    serverTransport: {
      post(message) {
        for (const listener of clientListeners) {
          listener(message);
        }
      },
      subscribe(listener) {
        serverListeners.add(listener);

        return () => {
          serverListeners.delete(listener);
        };
      },
    },
  };
}

export function createWebSocketMswPanelBridgeTransport(
  options: CreateWebSocketMswPanelBridgeTransportOptions,
): MswPanelBridgeTransport & MswPanelBridgeEndpoint {
  const subscribers = new Set<(message: MswPanelBridgeMessage) => void>();
  const queuedMessages: string[] = [];
  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? JSON.parse;

  const flushQueuedMessages = () => {
    if (options.socket.readyState !== websocketOpenState) {
      return;
    }

    while (queuedMessages.length > 0) {
      const message = queuedMessages.shift();

      if (message) {
        options.socket.send(message);
      }
    }
  };

  const handleOpen = () => {
    flushQueuedMessages();
  };
  const handleClose = () => {
    queuedMessages.length = 0;
  };
  const handleMessage = (event: MswPanelBridgeWebSocketMessageEvent) => {
    if (typeof event.data !== "string") {
      return;
    }

    try {
      const message = deserialize(event.data);

      if (!isMswPanelBridgeMessage(message)) {
        return;
      }

      for (const subscriber of subscribers) {
        subscriber(message);
      }
    } catch {
      return;
    }
  };

  options.socket.addEventListener("open", handleOpen);
  options.socket.addEventListener("close", handleClose);
  options.socket.addEventListener("message", handleMessage);

  return {
    dispose() {
      options.socket.removeEventListener("open", handleOpen);
      options.socket.removeEventListener("close", handleClose);
      options.socket.removeEventListener("message", handleMessage);
      queuedMessages.length = 0;

      if (options.closeOnDispose) {
        options.socket.close?.();
      }
    },
    post(message) {
      const serializedMessage = serialize(message);

      if (options.socket.readyState === websocketOpenState) {
        options.socket.send(serializedMessage);
        return;
      }

      if (options.socket.readyState === websocketConnectingState) {
        queuedMessages.push(serializedMessage);
        return;
      }

      if (options.socket.readyState >= websocketClosingState) {
        return;
      }
    },
    subscribe(listener) {
      subscribers.add(listener);

      return () => {
        subscribers.delete(listener);
      };
    },
  };
}
