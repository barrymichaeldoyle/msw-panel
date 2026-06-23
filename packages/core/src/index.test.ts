import { describe, expect, it, vi } from "vitest";
import { graphql, http, HttpResponse, type RequestHandler } from "msw";
import { setupServer } from "msw/node";

import { createMswPanelController, defineScenarios, definePreset, withScenarios } from "./index";

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

    const [enabledArg, disabledArg] = (runtime.resetHandlers as ReturnType<typeof vi.fn>).mock
      .lastCall!;
    expect(enabledArg).toBe(handlers[0]);
    expect(disabledArg.run()).toBeNull();
    expect(controller.getSnapshot().handlers).toEqual([
      expect.objectContaining({ enabled: true }),
      expect.objectContaining({ enabled: false, id: postsHandlerId }),
    ]);
  });

  it("hydrates disabled state from storage", async () => {
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

    const [passedHandler] = (runtime.resetHandlers as ReturnType<typeof vi.fn>).mock.lastCall!;
    expect(passedHandler).toBeTruthy();
    expect(await passedHandler.run({})).toBeNull();
    expect(controller.getSnapshot().handlers[0]).toEqual(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("defaults handlers to disabled when defaultEnabled is false", async () => {
    const handlers = [
      createHandler({
        header: "GET /user",
        method: "GET",
        path: "/user",
      }),
      createHandler({
        header: "GET /posts",
        method: "GET",
        path: "/posts",
      }),
    ];
    const runtime = {
      listHandlers: vi.fn(() => handlers),
      resetHandlers: vi.fn(),
    };

    const controller = createMswPanelController({
      handlers,
      runtime,
      defaultEnabled: false,
    });

    const lastCallArgs = (runtime.resetHandlers as ReturnType<typeof vi.fn>).mock.lastCall!;
    expect(lastCallArgs).toHaveLength(2);
    for (const passedHandler of lastCallArgs) {
      expect(await passedHandler.run({})).toBeNull();
    }
    expect(controller.getSnapshot()).toEqual(
      expect.objectContaining({
        activeHandlers: 0,
        disabledHandlers: 2,
      }),
    );
    expect(controller.getSnapshot().handlers).toEqual([
      expect.objectContaining({ enabled: false, path: "/user" }),
      expect.objectContaining({ enabled: false, path: "/posts" }),
    ]);
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
    const lastCallArgs = (runtime.resetHandlers as ReturnType<typeof vi.fn>).mock.lastCall!;
    expect(lastCallArgs).toHaveLength(2);
    expect(lastCallArgs.find((h: { run?: () => null }) => !h.run || h.run() !== null)).toBe(
      userHandler,
    );
    expect(lastCallArgs.find((h: { run?: () => null }) => h.run?.() === null)).toBeTruthy();
  });

  it("applies defaultEnabled to new handlers discovered during sync", () => {
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
    let activeHandlers = [userHandler];
    const runtime = {
      listHandlers: vi.fn(() => activeHandlers),
      resetHandlers: vi.fn(),
    };

    const controller = createMswPanelController({
      handlers: activeHandlers,
      runtime,
      storage: null,
      defaultEnabled: false,
    });

    controller.setEnabled(controller.getSnapshot().handlers[0].id, true);
    activeHandlers = [userHandler, postsHandler];

    controller.sync();

    expect(controller.getSnapshot().handlers).toEqual([
      expect.objectContaining({ enabled: true, path: "/user" }),
      expect.objectContaining({ enabled: false, path: "/posts" }),
    ]);
    const lastCallArgs = (runtime.resetHandlers as ReturnType<typeof vi.fn>).mock.lastCall!;
    expect(lastCallArgs).toHaveLength(2);
    expect(lastCallArgs.find((h: { run?: () => null }) => !h.run || h.run() !== null)).toBe(
      userHandler,
    );
    expect(lastCallArgs.find((h: { run?: () => null }) => h.run?.() === null)).toBeTruthy();
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

describe("createMswPanelController scenarios and tags", () => {
  function makeUserGroup() {
    return defineScenarios({
      method: "get",
      path: "/api/user",
      tags: ["auth"],
      default: "success",
      scenarios: {
        success: () => HttpResponse.json({ name: "Barry" }),
        error: () => HttpResponse.error(),
      },
    });
  }

  it("surfaces tags and scenarios on the handler snapshot", () => {
    const user = makeUserGroup();
    const runtime = { listHandlers: vi.fn(() => [user]), resetHandlers: vi.fn() };

    const controller = createMswPanelController({ handlers: [user], runtime, storage: null });
    const handler = controller.getSnapshot().handlers[0];

    expect(handler.tags).toEqual(["auth"]);
    expect(handler.activeScenario).toBe("success");
    expect(handler.scenarios?.map((scenario) => scenario.id)).toEqual(["success", "error"]);
  });

  it("setScenario flips the active scenario and notifies subscribers", () => {
    const user = makeUserGroup();
    const runtime = { listHandlers: vi.fn(() => [user]), resetHandlers: vi.fn() };
    const controller = createMswPanelController({ handlers: [user], runtime, storage: null });
    const listener = vi.fn();
    controller.subscribe(listener);

    const id = controller.getSnapshot().handlers[0].id;
    controller.setScenario(id, "error");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().handlers[0].activeScenario).toBe("error");
    // A no-op (same scenario) does not re-notify.
    controller.setScenario(id, "error");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("applies presets and reports the active preset", () => {
    const user = makeUserGroup();
    const projects = defineScenarios({
      method: "get",
      path: "/api/projects",
      default: "full",
      scenarios: {
        full: () => HttpResponse.json([{ id: 1 }]),
        empty: () => HttpResponse.json([]),
      },
    });
    const loggedOut = definePreset("Logged out", [user.use("error"), projects.use("empty")]);
    const runtime = { listHandlers: vi.fn(() => [user, projects]), resetHandlers: vi.fn() };

    const controller = createMswPanelController({
      handlers: [user, projects],
      presets: [loggedOut],
      runtime,
      storage: null,
    });

    expect(controller.getSnapshot().presets).toEqual([
      { id: "Logged out", label: "Logged out", active: false },
    ]);
    expect(controller.getSnapshot().activePreset).toBeNull();

    controller.applyPreset("Logged out");

    const snapshot = controller.getSnapshot();
    expect(snapshot.activePreset).toBe("Logged out");
    expect(snapshot.presets?.[0].active).toBe(true);
    expect(snapshot.handlers[0].activeScenario).toBe("error");
    expect(snapshot.handlers[1].activeScenario).toBe("empty");
  });

  it("applies a preset whose handlers are different instances than the tracked ones", () => {
    // Reproduces the HMR skew: a preset captures the handler objects at module load, but the
    // controller tracks the (re-evaluated) instances the runtime reports. They are logically the same
    // endpoint — same method + path, so the same stable id — but different object references.
    const config = {
      method: "get" as const,
      path: "/api/user",
      default: "success" as const,
      scenarios: {
        success: () => HttpResponse.json({ name: "Barry" }),
        error: () => HttpResponse.error(),
      },
    };
    const presetGroup = defineScenarios(config);
    const trackedGroup = defineScenarios(config);
    expect(presetGroup).not.toBe(trackedGroup);

    const preset = definePreset("Logged out", [presetGroup.use("error")]);
    const runtime = { listHandlers: vi.fn(() => [trackedGroup]), resetHandlers: vi.fn() };
    const controller = createMswPanelController({
      handlers: [trackedGroup],
      presets: [preset],
      runtime,
      storage: null,
    });

    controller.applyPreset("Logged out");

    const snapshot = controller.getSnapshot();
    expect(snapshot.handlers[0].activeScenario).toBe("error");
    expect(snapshot.activePreset).toBe("Logged out");
    expect(snapshot.presets?.[0].active).toBe(true);
  });

  it("scopes a preset to a feature tag and reports its active state", () => {
    const invoices = defineScenarios({
      method: "get",
      path: "/api/invoices",
      tags: ["billing"],
      default: "paid",
      scenarios: {
        paid: () => HttpResponse.json([{ id: 1, status: "paid" }]),
        overdue: () => HttpResponse.json([{ id: 1, status: "overdue" }]),
      },
    });
    const pastDue = definePreset("Past due", [invoices.use("overdue")], { tag: "billing" });
    const runtime = { listHandlers: vi.fn(() => [invoices]), resetHandlers: vi.fn() };

    const controller = createMswPanelController({
      handlers: [invoices],
      presets: [pastDue],
      runtime,
      storage: null,
    });

    expect(controller.getSnapshot().presets).toEqual([
      { id: "Past due", label: "Past due", tag: "billing", active: false },
    ]);

    controller.applyPreset("Past due");

    const snapshot = controller.getSnapshot();
    expect(snapshot.presets?.[0].active).toBe(true);
    expect(snapshot.handlers[0].activeScenario).toBe("overdue");
  });

  it("persists and restores the active scenario across reloads", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    };
    const runtime = { listHandlers: vi.fn(() => [makeUserGroup()]), resetHandlers: vi.fn() };

    const first = createMswPanelController({
      handlers: runtime.listHandlers(),
      runtime,
      storage,
      storageKey: "msw-panel:test",
    });
    const id = first.getSnapshot().handlers[0].id;
    first.setScenario(id, "error");

    // Fresh controller + fresh group reads persisted state back.
    const reloadedGroup = makeUserGroup();
    const reloadedRuntime = {
      listHandlers: vi.fn(() => [reloadedGroup]),
      resetHandlers: vi.fn(),
    };
    const second = createMswPanelController({
      handlers: [reloadedGroup],
      runtime: reloadedRuntime,
      storage,
      storageKey: "msw-panel:test",
    });

    expect(second.getSnapshot().handlers[0].activeScenario).toBe("error");
  });

  it("migrates legacy array-form persisted state without throwing", () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify(["request:get:/api/user"])),
      setItem: vi.fn(),
    };
    const user = makeUserGroup();
    const runtime = { listHandlers: vi.fn(() => [user]), resetHandlers: vi.fn() };

    const controller = createMswPanelController({
      handlers: [user],
      runtime,
      storage,
      storageKey: "msw-panel:test",
    });

    // Legacy disabled id still applies; scenario falls back to its default.
    expect(controller.getSnapshot().handlers[0].enabled).toBe(false);
    expect(controller.getSnapshot().handlers[0].activeScenario).toBe("success");
  });

  it("changes the live response when the scenario is switched (end-to-end)", async () => {
    const user = defineScenarios({
      method: "get",
      path: "https://example.test/api/user",
      default: "success",
      scenarios: {
        success: () => HttpResponse.json({ name: "Barry" }),
        error: () => HttpResponse.error(),
      },
    });
    const server = setupServer(user);
    server.listen();

    const controller = createMswPanelController({
      runtime: server,
      handlers: [user],
      storage: null,
    });

    const ok = await fetch("https://example.test/api/user");
    expect(ok.status).toBe(200);

    const id = controller.getSnapshot().handlers[0].id;
    controller.setScenario(id, "error");

    await expect(fetch("https://example.test/api/user")).rejects.toThrow();

    server.close();
  });

  it("switches the live response for withScenarios HTTP variants (end-to-end)", async () => {
    const user = withScenarios({
      default: "full",
      tags: ["users"],
      scenarios: {
        full: http.get("https://example.test/api/user", () => HttpResponse.json({ name: "Barry" })),
        empty: http.get(
          "https://example.test/api/user",
          () => new HttpResponse(null, { status: 404 }),
        ),
      },
    });
    const server = setupServer(user);
    server.listen();

    const controller = createMswPanelController({
      runtime: server,
      handlers: [user],
      storage: null,
    });
    const snapshot = controller.getSnapshot().handlers[0];
    expect(snapshot.tags).toEqual(["users"]);
    expect(snapshot.activeScenario).toBe("full");

    expect((await fetch("https://example.test/api/user")).status).toBe(200);

    controller.setScenario(snapshot.id, "empty");
    expect((await fetch("https://example.test/api/user")).status).toBe(404);

    server.close();
  });

  it("switches the live response for withScenarios GraphQL variants (end-to-end)", async () => {
    const me = withScenarios({
      default: "Signed in",
      scenarios: {
        "Signed in": graphql.query("Me", () =>
          HttpResponse.json({ data: { me: { name: "Barry" } } }),
        ),
        "Signed out": graphql.query("Me", () => HttpResponse.json({ data: { me: null } })),
      },
    });
    const server = setupServer(me);
    server.listen({ onUnhandledRequest: "bypass" });

    const controller = createMswPanelController({ runtime: server, handlers: [me], storage: null });
    const snapshot = controller.getSnapshot().handlers[0];
    expect(snapshot.kind).toBe("graphql");
    expect(snapshot.scenarios?.map((scenario) => scenario.id)).toEqual(["Signed in", "Signed out"]);

    const query = async () => {
      const response = await fetch("https://example.test/graphql", {
        body: JSON.stringify({ query: "query Me { me { name } }" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      return (await response.json()) as { data: { me: { name: string } | null } };
    };

    expect((await query()).data.me).toEqual({ name: "Barry" });

    controller.setScenario(snapshot.id, "Signed out");
    expect((await query()).data.me).toBeNull();

    server.close();
  });
});
