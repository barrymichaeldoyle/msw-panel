// @vitest-environment jsdom

import { act } from "react";
import type { ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { MswPanelController, MswPanelSnapshot } from "./index.js";
import { MswPanel } from "./react.js";

function createController(snapshot: MswPanelSnapshot): MswPanelController {
  return {
    getSnapshot: vi.fn(() => snapshot),
    setAllEnabled: vi.fn(),
    setEnabled: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    sync: vi.fn(),
    toggle: vi.fn(),
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
  reloadMock.mockClear();
  vi.restoreAllMocks();
});

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
      Array.from(openView.container.querySelectorAll("[data-msw-panel-count]")).map(
        (element) => element.textContent,
      ),
    ).toEqual(["10 enabled", "1 disabled", "0 used"]);

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

    const filter = view.container.querySelector("input");
    expect(filter?.getAttribute("type")).toBe("search");

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
    const view = await renderPanel(oneHandlerSnapshot, {
      defaultOpen: true,
      defaultAutoRefresh: true,
    });

    await click(view.container.querySelector('[role="switch"]'));

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(view.container.textContent).not.toContain("Refresh the page to apply handler changes.");

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
    const second = await renderPanel(oneHandlerSnapshot, {
      defaultOpen: true,
      defaultAutoRefresh: false,
    });

    await click(second.container.querySelector('[role="switch"]'));
    expect(reloadMock).toHaveBeenCalledTimes(1);

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
