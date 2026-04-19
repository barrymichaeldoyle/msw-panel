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
});
