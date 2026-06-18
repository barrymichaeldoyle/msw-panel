// @vitest-environment jsdom

import { act } from "react";
import type { ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => {
  document.body.innerHTML = "";
  process.env.NODE_ENV = "test";
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
