// @vitest-environment jsdom

import { act } from "react";
import type { ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { MswPanelController, MswPanelHandlerSnapshot, MswPanelSnapshot } from "./index.js";
import { MswPanel } from "./react.js";

function createController(initialSnapshot: MswPanelSnapshot): MswPanelController {
  let snapshot = initialSnapshot;
  const listeners = new Set<() => void>();

  // Real controllers (local or bridge-backed) publish a fresh snapshot reflecting the applied change.
  // Mirror that here — including the meaningful state change — so deferred auto-refresh reloads, which
  // wait for the handler state to actually differ, fire as they would against a real controller.
  const update = (next: Partial<MswPanelSnapshot>) => {
    snapshot = { ...snapshot, ...next };
    for (const listener of listeners) listener();
  };
  const setAllEnabled = (enabled: boolean) =>
    update({ handlers: snapshot.handlers.map((handler) => ({ ...handler, enabled })) });

  return {
    applyPreset: vi.fn((presetId: string) => update({ activePreset: presetId })),
    getSnapshot: () => snapshot,
    setAllEnabled: vi.fn(setAllEnabled),
    setEnabled: vi.fn((id: string, enabled: boolean) =>
      update({
        handlers: snapshot.handlers.map((handler) =>
          handler.id === id ? { ...handler, enabled } : handler,
        ),
      }),
    ),
    setScenario: vi.fn((id: string, scenarioId: string) =>
      update({
        handlers: snapshot.handlers.map((handler) =>
          handler.id === id ? { ...handler, activeScenario: scenarioId } : handler,
        ),
      }),
    ),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    sync: vi.fn(),
    toggle: vi.fn((id: string) =>
      update({
        handlers: snapshot.handlers.map((handler) =>
          handler.id === id ? { ...handler, enabled: !handler.enabled } : handler,
        ),
      }),
    ),
  };
}

async function renderPanel(
  snapshot: MswPanelSnapshot,
  props: Partial<ComponentProps<typeof MswPanel>> = {},
) {
  const controller = createController(snapshot);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<MswPanel controller={controller} {...props} />);
  });

  return {
    container,
    controller,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

async function click(element: Element | null | undefined) {
  await act(async () => {
    (element as HTMLElement).click();
  });
}

const reloadMock = vi.fn();

beforeAll(() => {
  // jsdom's location.reload can't be re-spied between tests, so replace location once.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, reload: reloadMock },
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  process.env.NODE_ENV = "test";
  window.localStorage.clear();
  window.sessionStorage.clear();
  reloadMock.mockClear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// The auto-refresh reload is debounced (RELOAD_DEBOUNCE_MS, 600ms); flush a generous window so it fires.
async function flushReload() {
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
}

describe("MswPanel", () => {
  it("shows the enabled count on the collapsed trigger by default", async () => {
    const view = await renderPanel({
      activeHandlers: 3,
      disabledHandlers: 1,
      handlers: [],
    });

    expect(view.container.textContent).toContain("3");

    await view.unmount();
  });

  it("hides the collapsed trigger count when showCount is false", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 3,
        disabledHandlers: 1,
        handlers: [],
      },
      { showCount: false },
    );

    const badge = Array.from(view.container.querySelectorAll("span")).find(
      (element) => element.textContent === "3",
    );

    expect(badge).toBeUndefined();

    await view.unmount();
  });

  it("renders used and idle handler states in the expanded list", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 2,
        disabledHandlers: 0,
        handlers: [
          {
            enabled: true,
            id: "request:get:/users/1",
            kind: "http",
            label: "GET /api/users/1",
            method: "GET",
            path: "https://msw-panel.test/api/users/1",
            used: true,
          },
          {
            enabled: true,
            id: "graphql:query:GetUser:any",
            kind: "graphql",
            label: "QUERY GetUser",
            method: null,
            path: null,
            used: false,
          },
        ],
      },
      { defaultOpen: true },
    );

    expect(view.container.textContent).toContain("used");
    expect(view.container.textContent).toContain("idle");
    expect(view.container.textContent).toContain("https://msw-panel.test/api/users/1");
    expect(view.container.textContent).toContain("QUERY GetUser");

    await view.unmount();
  });

  it("uses tabular numerals for count badges and summary stats", async () => {
    const closedView = await renderPanel({
      activeHandlers: 10,
      disabledHandlers: 1,
      handlers: [],
    });

    const triggerBadge = closedView.container.querySelector(
      '[data-msw-panel-count="trigger-badge"]',
    );
    expect(triggerBadge).not.toBeNull();
    expect((triggerBadge as HTMLElement).style.fontVariantNumeric).toBe("tabular-nums");

    await closedView.unmount();

    const openView = await renderPanel(
      {
        activeHandlers: 10,
        disabledHandlers: 1,
        handlers: [
          {
            enabled: true,
            id: "request:get:/users",
            kind: "http",
            label: "GET /api/users",
            method: "GET",
            path: "https://msw-panel.test/api/users",
            used: false,
          },
        ],
      },
      { defaultOpen: true },
    );

    const summary = openView.container.querySelector('[data-msw-panel-count-group="summary"]');
    expect(summary).not.toBeNull();
    expect((summary as HTMLElement).style.fontVariantNumeric).toBe("tabular-nums");
    expect(
      Array.from((summary as HTMLElement).querySelectorAll("[data-msw-panel-count]")).map(
        (element) => element.textContent,
      ),
    ).toEqual(["10/11 enabled"]);

    await openView.unmount();
  });

  it("exposes a stable id on the wrapper for targeting", async () => {
    const view = await renderPanel({
      activeHandlers: 1,
      disabledHandlers: 0,
      handlers: [],
    });

    const aside = view.container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.id).toBe("msw-panel");

    await view.unmount();
  });

  it("lets clicks pass through the empty wrapper area but not the trigger", async () => {
    const view = await renderPanel({
      activeHandlers: 1,
      disabledHandlers: 0,
      handlers: [],
    });

    const aside = view.container.querySelector("aside") as HTMLElement;
    expect(aside.style.pointerEvents).toBe("none");

    const trigger = view.container.querySelector("button") as HTMLElement;
    expect(trigger.style.pointerEvents).toBe("auto");

    await view.unmount();
  });

  it("re-enables pointer events on the open panel frame", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [],
      },
      { defaultOpen: true },
    );

    const aside = view.container.querySelector("aside") as HTMLElement;
    expect(aside.style.pointerEvents).toBe("none");

    const frame = aside.firstElementChild as HTMLElement;
    expect(frame.style.pointerEvents).toBe("auto");

    await view.unmount();
  });

  it("names the aside landmark with the panel title", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 0,
        disabledHandlers: 0,
        handlers: [],
      },
      { title: "Mock controls" },
    );

    const aside = view.container.querySelector("aside");
    expect(aside?.getAttribute("aria-label")).toBe("Mock controls");

    await view.unmount();
  });

  it("closes the open panel when Escape is pressed", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 0,
        disabledHandlers: 0,
        handlers: [],
      },
      { defaultOpen: true },
    );

    expect(view.container.querySelector('[aria-label="Close MSW Panel"]')).not.toBeNull();

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(view.container.querySelector('[aria-label="Close MSW Panel"]')).toBeNull();
    expect(view.container.querySelector('[aria-label="Open MSW Panel"]')).not.toBeNull();

    await view.unmount();
  });

  it("labels handler toggles and uses a search input for the filter", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [
          {
            enabled: true,
            id: "request:get:/users",
            kind: "http",
            label: "GET /api/users",
            method: "GET",
            path: "https://msw-panel.test/api/users",
            used: false,
          },
        ],
      },
      { defaultOpen: true },
    );

    const toggle = view.container.querySelector('[role="switch"]');
    expect(toggle?.getAttribute("aria-label")).toBe("Toggle https://msw-panel.test/api/users");

    const filter = view.container.querySelector('[role="searchbox"]');
    expect(filter?.getAttribute("type")).toBe("text");

    await view.unmount();
  });

  const oneHandlerSnapshot: MswPanelSnapshot = {
    activeHandlers: 1,
    disabledHandlers: 0,
    handlers: [
      {
        enabled: true,
        id: "request:get:/users",
        kind: "http",
        label: "GET /api/users",
        method: "GET",
        path: "https://msw-panel.test/api/users",
        used: false,
      },
    ],
  };

  it("opens the settings view from the header gear and back again", async () => {
    const view = await renderPanel(oneHandlerSnapshot, { defaultOpen: true });

    await click(view.container.querySelector('[aria-label="Open settings"]'));
    expect(view.container.textContent).toContain("Auto-refresh on change");
    expect(
      view.container.querySelector('[aria-label="Toggle auto-refresh on change"]'),
    ).not.toBeNull();

    await click(view.container.querySelector('[aria-label="Back to handlers"]'));
    expect(view.container.querySelector('[aria-label="Open settings"]')).not.toBeNull();
    expect(view.container.textContent).not.toContain("Auto-refresh on change");

    await view.unmount();
  });

  it("shows the manual refresh banner instead of reloading when auto-refresh is off", async () => {
    const view = await renderPanel(oneHandlerSnapshot, { defaultOpen: true });

    await click(view.container.querySelector('[role="switch"]'));

    expect(reloadMock).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain("Refresh the page to apply handler changes.");

    await view.unmount();
  });

  it("reloads on handler change when auto-refresh defaults to on", async () => {
    vi.useFakeTimers();
    const view = await renderPanel(oneHandlerSnapshot, {
      defaultOpen: true,
      defaultAutoRefresh: true,
    });

    await click(view.container.querySelector('[role="switch"]'));

    // Debounced: the reload only fires once the change settles.
    expect(reloadMock).not.toHaveBeenCalled();
    await flushReload();
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(view.container.textContent).not.toContain("Refresh the page to apply handler changes.");

    await view.unmount();
  });

  it("debounces the auto-refresh reload, batching a burst of changes into one", async () => {
    vi.useFakeTimers();
    const view = await renderPanel(oneHandlerSnapshot, {
      defaultOpen: true,
      defaultAutoRefresh: true,
    });
    const switchEl = view.container.querySelector('[role="switch"]');

    // Toggle a few times in quick succession — each one restarts the debounce window.
    await click(switchEl);
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(reloadMock).not.toHaveBeenCalled();
    await click(switchEl);
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(reloadMock).not.toHaveBeenCalled();

    // Once the changes settle, exactly one reload fires for the whole burst.
    await flushReload();
    expect(reloadMock).toHaveBeenCalledTimes(1);

    await view.unmount();
  });

  it("pushes a pending reload back while the developer keeps typing in the filter", async () => {
    vi.useFakeTimers();
    const view = await renderPanel(oneHandlerSnapshot, {
      defaultOpen: true,
      defaultAutoRefresh: true,
    });

    // A change arms the debounced reload.
    await click(view.container.querySelector('[role="switch"]'));

    // Typing in the filter within the window keeps resetting it, so the reload never interrupts.
    const input = view.container.querySelector('[role="searchbox"]') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    for (const text of ["u", "us", "use", "user"]) {
      await act(async () => {
        nativeSetter?.call(input, text);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        vi.advanceTimersByTime(400);
      });
      expect(reloadMock).not.toHaveBeenCalled();
    }

    // Only once typing stops does the reload fire — with the typed filter intact.
    await flushReload();
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(input.value).toBe("user");

    await view.unmount();
  });

  it("persists the developer's auto-refresh choice and lets it override the codebase default", async () => {
    const first = await renderPanel(oneHandlerSnapshot, { defaultOpen: true });

    // Codebase default is off; developer turns it on via the settings toggle.
    await click(first.container.querySelector('[aria-label="Open settings"]'));
    const toggle = first.container.querySelector('[aria-label="Toggle auto-refresh on change"]');
    expect(toggle?.getAttribute("aria-checked")).toBe("false");
    await click(toggle);
    expect(toggle?.getAttribute("aria-checked")).toBe("true");

    await first.unmount();

    // A fresh mount reads the stored preference even though the codebase default is still off.
    vi.useFakeTimers();
    const second = await renderPanel(oneHandlerSnapshot, {
      defaultOpen: true,
      defaultAutoRefresh: false,
    });

    await click(second.container.querySelector('[role="switch"]'));
    await flushReload();
    expect(reloadMock).toHaveBeenCalledTimes(1);

    await second.unmount();
  });

  const profileSnapshot: MswPanelSnapshot = {
    activeHandlers: 3,
    disabledHandlers: 0,
    handlers: [
      {
        enabled: true,
        id: "me",
        kind: "http",
        label: "GET /profile/me",
        method: "GET",
        path: "/profile/me",
        used: false,
      },
      {
        enabled: true,
        id: "id",
        kind: "http",
        label: "GET /profile/:id",
        method: "GET",
        path: "/profile/:id",
        used: false,
      },
      {
        enabled: true,
        id: "followers",
        kind: "http",
        label: "GET /profile/:id/followers",
        method: "GET",
        path: "/profile/:id/followers",
        used: false,
      },
    ],
  };

  it("renders a collapsed group tree when grouped defaults on", async () => {
    const view = await renderPanel(profileSnapshot, { defaultOpen: true, defaultGroupBy: "path" });

    // Top-level "profile" group is shown, but nested handler rows stay hidden until expanded.
    expect(view.container.querySelector('[data-msw-panel-group="profile"]')).not.toBeNull();
    expect(view.container.querySelector("[data-handler-id]")).toBeNull();

    await view.unmount();
  });

  it("reveals handler rows when a group is expanded", async () => {
    const view = await renderPanel(profileSnapshot, { defaultOpen: true, defaultGroupBy: "path" });

    await click(view.container.querySelector('[data-msw-panel-group="profile"]'));

    // Leaf `/profile/me` renders its row inline; `/profile/:id` is a nested group still collapsed.
    expect(view.container.querySelector('[data-handler-id="me"]')).not.toBeNull();
    expect(view.container.querySelector('[data-msw-panel-group="profile/:id"]')).not.toBeNull();
    expect(view.container.querySelector('[data-handler-id="followers"]')).toBeNull();

    await view.unmount();
  });

  it("persists expanded group state across reloads", async () => {
    const first = await renderPanel(profileSnapshot, { defaultOpen: true, defaultGroupBy: "path" });

    await click(first.container.querySelector('[data-msw-panel-group="profile"]'));
    expect(first.container.querySelector('[data-handler-id="me"]')).not.toBeNull();

    await first.unmount();

    // A fresh mount (simulating a reload) reopens the previously expanded group.
    const second = await renderPanel(profileSnapshot, {
      defaultOpen: true,
      defaultGroupBy: "path",
    });

    expect(second.container.querySelector('[data-handler-id="me"]')).not.toBeNull();

    await second.unmount();
  });

  it("does not auto-expand groups while a filter is active", async () => {
    const view = await renderPanel(profileSnapshot, { defaultOpen: true, defaultGroupBy: "path" });

    const input = view.container.querySelector("input") as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      nativeSetter?.call(input, ":id");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Filter narrows the tree but collapsed groups stay collapsed until expanded manually.
    expect(view.container.querySelector('[data-handler-id="id"]')).toBeNull();
    expect(view.container.querySelector('[data-handler-id="followers"]')).toBeNull();
    expect(view.container.querySelector('[data-msw-panel-group="profile/:id"]')).not.toBeNull();

    await click(view.container.querySelector('[data-msw-panel-group="profile/:id"]'));

    expect(view.container.querySelector('[data-handler-id="id"]')).not.toBeNull();
    expect(view.container.querySelector('[data-handler-id="followers"]')).not.toBeNull();
    expect(view.container.querySelector('[data-handler-id="me"]')).toBeNull();

    await view.unmount();
  });

  it("keeps a flat list when group-by is none", async () => {
    const view = await renderPanel(profileSnapshot, { defaultOpen: true, defaultGroupBy: "none" });

    expect(view.container.querySelector("[data-msw-panel-group]")).toBeNull();
    expect(view.container.querySelectorAll("[data-handler-id]")).toHaveLength(3);

    await view.unmount();
  });

  it("toggles a single Expand all / Collapse all control by state", async () => {
    const view = await renderPanel(profileSnapshot, { defaultOpen: true, defaultGroupBy: "path" });
    const toggle = () =>
      Array.from(view.container.querySelectorAll("button")).find((button) =>
        /Expand all|Collapse all/.test(button.textContent ?? ""),
      );

    // Collapsed groups → the control offers "Expand all" (and only that one control exists).
    expect(toggle()?.textContent).toBe("Expand all");
    expect(
      Array.from(view.container.querySelectorAll("button")).filter((button) =>
        /Collapse all/.test(button.textContent ?? ""),
      ),
    ).toHaveLength(0);

    await click(toggle());
    expect(toggle()?.textContent).toBe("Collapse all");
    expect(view.container.querySelector('[data-handler-id="me"]')).not.toBeNull();

    await click(toggle());
    expect(toggle()?.textContent).toBe("Expand all");
    expect(view.container.querySelector('[data-handler-id="me"]')).toBeNull();

    await view.unmount();
  });

  it("filters to only used handlers via the checkbox", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 2,
        disabledHandlers: 0,
        handlers: [
          {
            enabled: true,
            id: "used-one",
            kind: "http",
            label: "GET /api/used",
            method: "GET",
            path: "/api/used",
            used: true,
          },
          {
            enabled: true,
            id: "idle-one",
            kind: "http",
            label: "GET /api/idle",
            method: "GET",
            path: "/api/idle",
            used: false,
          },
        ],
      },
      { defaultOpen: true, defaultGroupBy: "none" },
    );

    expect(view.container.querySelectorAll("[data-handler-id]")).toHaveLength(2);
    // The used count is surfaced under the toggle (one of the two handlers has served a request).
    expect(view.container.querySelector('[data-msw-panel-count="used"]')?.textContent).toBe(
      "1 used",
    );

    await click(view.container.querySelector("[data-msw-panel-only-used]"));

    expect(view.container.querySelector('[data-handler-id="used-one"]')).not.toBeNull();
    expect(view.container.querySelector('[data-handler-id="idle-one"]')).toBeNull();

    await view.unmount();
  });

  it("persists the filter text and 'Only used' toggle across reloads", async () => {
    const snapshot: MswPanelSnapshot = {
      activeHandlers: 2,
      disabledHandlers: 0,
      handlers: [
        {
          enabled: true,
          id: "used-one",
          kind: "http",
          label: "GET /api/used",
          method: "GET",
          path: "/api/used",
          used: true,
        },
        {
          enabled: true,
          id: "idle-one",
          kind: "http",
          label: "GET /api/idle",
          method: "GET",
          path: "/api/idle",
          used: false,
        },
      ],
    };

    const first = await renderPanel(snapshot, { defaultOpen: true, defaultGroupBy: "none" });
    const input = first.container.querySelector('[role="searchbox"]') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      nativeSetter?.call(input, "used");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click(first.container.querySelector("[data-msw-panel-only-used]"));
    await first.unmount();

    // A fresh mount (simulating a reload) restores both the filter text and the toggle.
    const second = await renderPanel(snapshot, { defaultOpen: true, defaultGroupBy: "none" });
    expect((second.container.querySelector('[role="searchbox"]') as HTMLInputElement).value).toBe(
      "used",
    );
    expect(
      (second.container.querySelector("[data-msw-panel-only-used]") as HTMLInputElement).checked,
    ).toBe(true);
    await second.unmount();
  });

  it("restores the handler list scroll position and records new scrolls", async () => {
    // jsdom has no layout (scrollTop always reads 0), so drive scrollTop through a prototype spy and
    // run rAF callbacks synchronously so the restore/save settle within act().
    const proto = window.HTMLElement.prototype;
    const original = Object.getOwnPropertyDescriptor(proto, "scrollTop");
    let scrollTop = 0;
    Object.defineProperty(proto, "scrollTop", {
      configurable: true,
      get() {
        return scrollTop;
      },
      set(value: number) {
        scrollTop = value;
      },
    });
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    try {
      window.sessionStorage.setItem("msw-panel:scroll", "120");

      const view = await renderPanel(profileSnapshot, {
        defaultOpen: true,
        defaultGroupBy: "none",
      });
      const list = Array.from(view.container.querySelectorAll("ul")).find((ul) =>
        ul.querySelector("[data-handler-id]"),
      ) as HTMLUListElement;

      // The saved offset is applied to the list container (before paint, via a layout effect).
      expect(list.scrollTop).toBe(120);

      // After mount the developer is in control, so scrolling records the new position.
      scrollTop = 80;
      await act(async () => {
        list.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      expect(window.sessionStorage.getItem("msw-panel:scroll")).toBe("80");

      await view.unmount();
    } finally {
      raf.mockRestore();
      if (original) {
        Object.defineProperty(proto, "scrollTop", original);
      } else {
        delete (proto as unknown as Record<string, unknown>).scrollTop;
      }
    }
  });

  it("defaults grouping to feature when handlers have tags, otherwise path", async () => {
    const tagged: MswPanelSnapshot = {
      ...profileSnapshot,
      handlers: profileSnapshot.handlers.map((handler, index) => ({
        ...handler,
        tags: index === 0 ? ["auth"] : [],
      })),
    };

    const featureView = await renderPanel(tagged, { defaultOpen: true });
    expect(featureView.container.querySelector('[data-msw-panel-group="tag:auth"]')).not.toBeNull();
    await featureView.unmount();

    const pathView = await renderPanel(profileSnapshot, { defaultOpen: true });
    expect(pathView.container.querySelector('[data-msw-panel-group="profile"]')).not.toBeNull();
    await pathView.unmount();
  });

  it("persists the developer's group-by choice and overrides the codebase default", async () => {
    // No tags → codebase default is "path", so the tree is shown.
    const first = await renderPanel(profileSnapshot, { defaultOpen: true });
    expect(first.container.querySelector('[data-msw-panel-group="profile"]')).not.toBeNull();

    await click(first.container.querySelector('[aria-label="Open settings"]'));
    await changeSelect(first.container.querySelector("[data-msw-panel-groupby-select]"), "none");
    await first.unmount();

    // A fresh mount picks up the stored "none" preference even though code default would group by path.
    const second = await renderPanel(profileSnapshot, {
      defaultOpen: true,
      defaultGroupBy: "path",
    });
    expect(second.container.querySelector("[data-msw-panel-group]")).toBeNull();
    expect(second.container.querySelectorAll("[data-handler-id]")).toHaveLength(3);

    await second.unmount();
  });

  it("restores the panel open state across remounts by default", async () => {
    const first = await renderPanel(oneHandlerSnapshot);

    // Open the panel, which should be saved to storage.
    await click(first.container.querySelector('[aria-label="Open MSW Panel"]'));
    expect(first.container.querySelector('[aria-label="Close MSW Panel"]')).not.toBeNull();

    await first.unmount();

    // A fresh mount (simulating a reload) reopens to the stored state despite defaultOpen being false.
    const second = await renderPanel(oneHandlerSnapshot);
    expect(second.container.querySelector('[aria-label="Close MSW Panel"]')).not.toBeNull();

    await second.unmount();
  });

  it("does not persist the open state when persistOpen is false", async () => {
    const first = await renderPanel(oneHandlerSnapshot, { persistOpen: false });
    await click(first.container.querySelector('[aria-label="Open MSW Panel"]'));
    expect(first.container.querySelector('[aria-label="Close MSW Panel"]')).not.toBeNull();
    await first.unmount();

    // With persistOpen disabled, a fresh mount starts collapsed again.
    const second = await renderPanel(oneHandlerSnapshot, { persistOpen: false });
    expect(second.container.querySelector('[aria-label="Close MSW Panel"]')).toBeNull();
    expect(second.container.querySelector('[aria-label="Open MSW Panel"]')).not.toBeNull();
    await second.unmount();
  });

  it("does not render in production unless showInProduction is true", async () => {
    process.env.NODE_ENV = "production";

    const hiddenView = await renderPanel({
      activeHandlers: 1,
      disabledHandlers: 0,
      handlers: [],
    });

    expect(hiddenView.container.innerHTML).toBe("");

    await hiddenView.unmount();

    const visibleView = await renderPanel(
      {
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [],
      },
      { showInProduction: true },
    );

    expect(visibleView.container.textContent).toContain("1");

    await visibleView.unmount();
  });
});

async function changeSelect(select: Element | null | undefined, value: string) {
  await act(async () => {
    const element = select as HTMLSelectElement;
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("MswPanel scenarios and tags", () => {
  it("renders feature tag chips", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [
          {
            enabled: true,
            id: "request:get:/api/user",
            kind: "http",
            label: "GET /api/user",
            method: "GET",
            path: "/api/user",
            tags: ["auth", "profile"],
            used: false,
          },
        ],
      },
      { defaultGroupBy: "none", defaultOpen: true },
    );

    const chips = view.container.querySelectorAll("[data-handler-tag]");
    expect([...chips].map((chip) => chip.textContent)).toEqual(["auth", "profile"]);

    await view.unmount();
  });

  it("renders a scenario selector and calls setScenario on change", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [
          {
            activeScenario: "success",
            enabled: true,
            id: "request:get:/api/user",
            kind: "http",
            label: "GET /api/user",
            method: "GET",
            path: "/api/user",
            scenarios: [
              { id: "success", label: "success" },
              { id: "error", label: "error" },
            ],
            tags: [],
            used: false,
          },
        ],
      },
      { defaultGroupBy: "none", defaultOpen: true },
    );

    const select = view.container.querySelector("[data-handler-scenario]");
    expect(select).not.toBeNull();
    expect((select as HTMLSelectElement).value).toBe("success");

    await changeSelect(select, "error");
    expect(view.controller.setScenario).toHaveBeenCalledWith("request:get:/api/user", "error");

    await view.unmount();
  });

  it("renders the preset selector and calls applyPreset", async () => {
    const view = await renderPanel(
      {
        activePreset: null,
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [
          {
            enabled: true,
            id: "request:get:/api/user",
            kind: "http",
            label: "GET /api/user",
            method: "GET",
            path: "/api/user",
            tags: [],
            used: false,
          },
        ],
        presets: [{ id: "Logged out", label: "Logged out" }],
      },
      { defaultOpen: true },
    );

    const select = view.container.querySelector("[data-msw-panel-preset-select]");
    expect(select).not.toBeNull();

    await changeSelect(select, "Logged out");
    expect(view.controller.applyPreset).toHaveBeenCalledWith("Logged out");

    await view.unmount();
  });

  it("only offers the 'Custom…' option while no preset is active", async () => {
    const handler: MswPanelHandlerSnapshot = {
      enabled: true,
      id: "request:get:/api/user",
      kind: "http",
      label: "GET /api/user",
      method: "GET",
      path: "/api/user",
      tags: [],
      used: false,
    };
    const optionLabels = (container: Element) =>
      Array.from(container.querySelectorAll("[data-msw-panel-preset-select] option")).map(
        (option) => option.textContent,
      );

    // No active preset: "Custom…" is shown so the select has a label for the current state.
    const custom = await renderPanel(
      {
        activePreset: null,
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [handler],
        presets: [{ id: "Logged out", label: "Logged out", active: false }],
      },
      { defaultOpen: true },
    );
    expect(optionLabels(custom.container)).toEqual(["Custom…", "Logged out"]);
    await custom.unmount();

    // A preset is active: "Custom…" is dropped — you can never switch back to it manually.
    const active = await renderPanel(
      {
        activePreset: "Logged out",
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [handler],
        presets: [{ id: "Logged out", label: "Logged out", active: true }],
      },
      { defaultOpen: true },
    );
    expect(optionLabels(active.container)).toEqual(["Logged out"]);
    await active.unmount();
  });

  it("shows the picked preset immediately, before the async snapshot catches up", async () => {
    // Async controller: applyPreset does not update the snapshot synchronously (mimics the bridge).
    let snapshot: MswPanelSnapshot = {
      activePreset: null,
      activeHandlers: 1,
      disabledHandlers: 0,
      handlers: [
        {
          enabled: true,
          id: "request:get:/api/user",
          kind: "http",
          label: "GET /api/user",
          method: "GET",
          path: "/api/user",
          tags: [],
          used: false,
        },
      ],
      presets: [{ id: "Logged out", label: "Logged out", active: false }],
    };
    const controller: MswPanelController = {
      applyPreset: vi.fn(),
      getSnapshot: () => snapshot,
      setAllEnabled: vi.fn(),
      setEnabled: vi.fn(),
      setScenario: vi.fn(),
      subscribe: () => () => {},
      sync: vi.fn(),
      toggle: vi.fn(),
    };

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<MswPanel controller={controller} defaultOpen />);
    });

    const select = container.querySelector("[data-msw-panel-preset-select]") as HTMLSelectElement;
    await changeSelect(select, "Logged out");

    // Even though the snapshot still reports no active preset, the selector optimistically shows the
    // chosen preset and drops "Custom…" — so it never flashes back to "Custom…" before settling.
    expect(controller.applyPreset).toHaveBeenCalledWith("Logged out");
    expect(select.value).toBe("Logged out");
    expect(
      Array.from(select.querySelectorAll("option")).map((option) => option.textContent),
    ).toEqual(["Logged out"]);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("keeps feature-scoped presets out of the global selector", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [
          {
            activeScenario: "paid",
            enabled: true,
            id: "request:get:/api/invoices",
            kind: "http",
            label: "GET /api/invoices",
            method: "GET",
            path: "/api/invoices",
            scenarios: [
              { id: "paid", label: "paid" },
              { id: "overdue", label: "overdue" },
            ],
            tags: ["billing"],
            used: false,
          },
        ],
        presets: [{ id: "Past due", label: "Past due", tag: "billing", active: false }],
      },
      { defaultGroupBy: "tag", defaultOpen: true },
    );

    // The only preset is feature-scoped, so the global selector should not appear at all.
    expect(view.container.querySelector("[data-msw-panel-preset-select]")).toBeNull();

    await view.unmount();
  });

  it("fans a shared scenario out to every handler in a feature group", async () => {
    const handler = (id: string, path: string): MswPanelHandlerSnapshot => ({
      activeScenario: "success",
      enabled: true,
      id,
      kind: "http",
      label: `GET ${path}`,
      method: "GET",
      path,
      scenarios: [
        { id: "success", label: "success" },
        { id: "error", label: "error" },
      ],
      tags: ["billing"],
      used: false,
    });

    const view = await renderPanel(
      {
        activeHandlers: 2,
        disabledHandlers: 0,
        handlers: [
          handler("request:get:/api/invoices", "/api/invoices"),
          handler("request:get:/api/subscription", "/api/subscription"),
        ],
        presets: [],
      },
      { defaultGroupBy: "tag", defaultOpen: true },
    );

    const featureSelect = view.container.querySelector(
      '[data-msw-panel-feature-scenario="billing"]',
    );
    expect(featureSelect).not.toBeNull();
    // Both handlers share "success", so the feature selector reflects it.
    expect((featureSelect as HTMLSelectElement).value).toBe("scenario:success");

    await changeSelect(featureSelect, "scenario:error");
    expect(view.controller.setScenario).toHaveBeenCalledWith("request:get:/api/invoices", "error");
    expect(view.controller.setScenario).toHaveBeenCalledWith(
      "request:get:/api/subscription",
      "error",
    );

    await view.unmount();
  });

  it("applies a feature-scoped preset from the feature group header", async () => {
    const view = await renderPanel(
      {
        activeHandlers: 1,
        disabledHandlers: 0,
        handlers: [
          {
            activeScenario: "paid",
            enabled: true,
            id: "request:get:/api/invoices",
            kind: "http",
            label: "GET /api/invoices",
            method: "GET",
            path: "/api/invoices",
            scenarios: [
              { id: "paid", label: "paid" },
              { id: "overdue", label: "overdue" },
            ],
            tags: ["billing"],
            used: false,
          },
        ],
        presets: [{ id: "Past due", label: "Past due", tag: "billing", active: false }],
      },
      { defaultGroupBy: "tag", defaultOpen: true },
    );

    const featureSelect = view.container.querySelector(
      '[data-msw-panel-feature-scenario="billing"]',
    );
    expect(featureSelect).not.toBeNull();

    await changeSelect(featureSelect, "preset:Past due");
    expect(view.controller.applyPreset).toHaveBeenCalledWith("Past due");

    await view.unmount();
  });

  it("holds the chosen feature scenario while the async snapshot catches up (no 'Mixed…' flash)", async () => {
    const handler = (id: string, path: string): MswPanelHandlerSnapshot => ({
      activeScenario: "success",
      enabled: true,
      id,
      kind: "http",
      label: `GET ${path}`,
      method: "GET",
      path,
      scenarios: [
        { id: "success", label: "success" },
        { id: "error", label: "error" },
      ],
      tags: ["billing"],
      used: false,
    });
    // Async controller: setScenario does not update the snapshot synchronously, and a "Set all to"
    // fans out one call per handler — exactly the window where the group would otherwise read "Mixed…".
    const snapshot: MswPanelSnapshot = {
      activeHandlers: 2,
      disabledHandlers: 0,
      handlers: [
        handler("request:get:/api/invoices", "/api/invoices"),
        handler("request:get:/api/subscription", "/api/subscription"),
      ],
      presets: [],
    };
    const controller: MswPanelController = {
      applyPreset: vi.fn(),
      getSnapshot: () => snapshot,
      setAllEnabled: vi.fn(),
      setEnabled: vi.fn(),
      setScenario: vi.fn(),
      subscribe: () => () => {},
      sync: vi.fn(),
      toggle: vi.fn(),
    };

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<MswPanel controller={controller} defaultGroupBy="tag" defaultOpen />);
    });

    const featureSelect = container.querySelector(
      '[data-msw-panel-feature-scenario="billing"]',
    ) as HTMLSelectElement;
    expect(featureSelect.value).toBe("scenario:success");

    await changeSelect(featureSelect, "scenario:error");

    // The snapshot still reports "success", but the control optimistically shows the picked scenario
    // and never exposes the "Mixed…" placeholder while the per-handler commands are in flight.
    expect(controller.setScenario).toHaveBeenCalledTimes(2);
    expect(featureSelect.value).toBe("scenario:error");
    expect(
      Array.from(featureSelect.querySelectorAll("option")).map((option) => option.textContent),
    ).not.toContain("Mixed…");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
