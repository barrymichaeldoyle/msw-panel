import { describe, expect, it, vi } from "vitest";
import type { RequestHandler } from "msw";

import { createMswPanelController } from "./index";

function createHandler(info: Record<string, unknown>): RequestHandler {
  return { info, kind: "request" } as unknown as RequestHandler;
}

describe("createMswPanelController", () => {
  it("toggles a tracked handler by reapplying the enabled handler list", () => {
    const handlers = [
      createHandler({ header: "GET /user", method: "GET", path: "/user" }),
      createHandler({ header: "GET /posts", method: "GET", path: "/posts" }),
    ];
    const runtime = {
      listHandlers: vi.fn(() => handlers),
      resetHandlers: vi.fn(),
    };

    const controller = createMswPanelController({
      handlers,
      runtime,
    });
    const postsHandlerId = controller.getSnapshot().handlers[1].id;

    controller.toggle(postsHandlerId);

    expect(runtime.resetHandlers).toHaveBeenLastCalledWith(handlers[0]);
    expect(controller.getSnapshot().handlers).toEqual([
      expect.objectContaining({ enabled: true }),
      expect.objectContaining({ enabled: false, id: postsHandlerId }),
    ]);
  });

  it("hydrates disabled state from storage", () => {
    const handlers = [
      createHandler({
        callFrame: "/src/mocks/handlers.ts:10:5",
        header: "GET /user",
        method: "GET",
        path: "/user",
      }),
    ];
    const runtime = {
      listHandlers: vi.fn(() => handlers),
      resetHandlers: vi.fn(),
    };
    const storage = {
      getItem: vi.fn(() => JSON.stringify(["request:get:/user"])),
      setItem: vi.fn(),
    };

    const controller = createMswPanelController({
      handlers,
      runtime,
      storage,
      storageKey: "msw-panel:test",
    });

    expect(runtime.resetHandlers).toHaveBeenLastCalledWith();
    expect(controller.getSnapshot().handlers[0]).toEqual(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("keeps persisted disabled state when call frames change across reloads", () => {
    const firstHandler = createHandler({
      callFrame: "/src/mocks/handlers.ts:10:5",
      header: "GET /user",
      method: "GET",
      path: "/user",
    });
    const secondHandler = createHandler({
      callFrame: "/src/mocks/handlers.ts:99:2",
      header: "GET /user",
      method: "GET",
      path: "/user",
    });
    const storageState = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => storageState.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storageState.set(key, value);
      }),
    };
    const runtime = {
      listHandlers: vi.fn(),
      resetHandlers: vi.fn(),
    };

    const firstController = createMswPanelController({
      handlers: [firstHandler],
      runtime: { ...runtime, listHandlers: vi.fn(() => [firstHandler]) },
      storage,
      storageKey: "msw-panel:test",
    });

    firstController.toggle(firstController.getSnapshot().handlers[0].id);

    const secondController = createMswPanelController({
      handlers: [secondHandler],
      runtime: { ...runtime, listHandlers: vi.fn(() => [secondHandler]) },
      storage,
      storageKey: "msw-panel:test",
    });

    expect(secondController.getSnapshot().handlers[0]).toEqual(
      expect.objectContaining({ enabled: false, id: "request:get:/user" }),
    );
  });

  it("preserves disabled state when handlers are reordered during sync", () => {
    const userHandler = createHandler({
      callFrame: "/src/mocks/handlers.ts:10:5",
      header: "GET /user",
      method: "GET",
      path: "/user",
    });
    const postsHandler = createHandler({
      callFrame: "/src/mocks/handlers.ts:20:5",
      header: "GET /posts",
      method: "GET",
      path: "/posts",
    });
    let activeHandlers = [userHandler, postsHandler];
    const runtime = {
      listHandlers: vi.fn(() => activeHandlers),
      resetHandlers: vi.fn(),
    };

    const controller = createMswPanelController({
      handlers: activeHandlers,
      runtime,
    });
    const postsHandlerId = controller
      .getSnapshot()
      .handlers.find((handler) => handler.path === "/posts")!.id;

    controller.toggle(postsHandlerId);
    activeHandlers = [postsHandler, userHandler];

    controller.sync();

    expect(controller.getSnapshot().handlers).toEqual([
      expect.objectContaining({ enabled: false, path: "/posts" }),
      expect.objectContaining({ enabled: true, path: "/user" }),
    ]);
    expect(runtime.resetHandlers).toHaveBeenLastCalledWith(userHandler);
  });

  it("returns a stable snapshot reference until controller state changes", () => {
    const handlers = [
      createHandler({
        callFrame: "/src/mocks/handlers.ts:10:5",
        header: "GET /user",
        method: "GET",
        path: "/user",
      }),
    ];
    const runtime = {
      listHandlers: vi.fn(() => handlers),
      resetHandlers: vi.fn(),
    };

    const controller = createMswPanelController({
      handlers,
      runtime,
    });

    const initialSnapshot = controller.getSnapshot();

    expect(controller.getSnapshot()).toBe(initialSnapshot);

    controller.toggle(initialSnapshot.handlers[0].id);

    const updatedSnapshot = controller.getSnapshot();

    expect(updatedSnapshot).not.toBe(initialSnapshot);
    expect(controller.getSnapshot()).toBe(updatedSnapshot);
    expect(updatedSnapshot.handlers[0]).toEqual(expect.objectContaining({ enabled: false }));
  });

  it("polls handler usage and emits a new snapshot when a handler becomes used", () => {
    vi.useFakeTimers();

    const handler = createHandler({
      callFrame: "/src/mocks/handlers.ts:10:5",
      header: "GET /user",
      method: "GET",
      path: "/user",
    }) as RequestHandler & { isUsed?: boolean };
    handler.isUsed = false;

    const runtime = {
      listHandlers: vi.fn(() => [handler]),
      resetHandlers: vi.fn(),
    };

    const controller = createMswPanelController({
      handlers: [handler],
      runtime,
    });
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    expect(controller.getSnapshot().handlers[0]).toEqual(expect.objectContaining({ used: false }));

    handler.isUsed = true;
    vi.advanceTimersByTime(400);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().handlers[0]).toEqual(expect.objectContaining({ used: true }));

    unsubscribe();
    vi.useRealTimers();
  });
});
