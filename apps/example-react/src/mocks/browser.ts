import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

type HandlersUpdateListener = (nextHandlers: typeof handlers) => void;

const handlerUpdateListeners = new Set<HandlersUpdateListener>();

export function subscribeToHandlerUpdates(listener: HandlersUpdateListener) {
  handlerUpdateListeners.add(listener);

  return () => {
    handlerUpdateListeners.delete(listener);
  };
}

if (import.meta.hot) {
  import.meta.hot.accept("./handlers", (nextModule) => {
    const nextHandlers = nextModule?.handlers ?? handlers;

    worker.resetHandlers(...nextHandlers);

    for (const listener of handlerUpdateListeners) {
      listener(nextHandlers);
    }
  });
}
