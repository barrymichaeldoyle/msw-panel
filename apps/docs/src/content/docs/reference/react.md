---
title: React reference
description: Props and behavior for the React panel components.
---

## `MswPanel`

Floating panel anchored to a corner of the viewport. The trigger button is always visible; clicking it toggles the panel open or closed.

```tsx
import { MswPanel } from "msw-panel/react";

interface MswPanelProps {
  controller: MswPanelController | null | undefined;
  defaultAutoRefresh?: boolean;
  defaultGroupBy?: "none" | "path" | "tag";
  defaultOpen?: boolean;
  panelSide?: "top" | "bottom";
  persistOpen?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  shadow?: boolean;
  showInProduction?: boolean;
  showCount?: boolean;
  showSync?: boolean;
  theme?: "dark" | "light";
  title?: string;
}
```

### Props

| Prop                 | Default          | Description                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `controller`         | (none)           | Required. A `MswPanelController` from `createMswPanelController` or `createMswPanelBridgeClient`, or `null` to render nothing.                                                                                                                                                                                                          |
| `defaultAutoRefresh` | `false`          | Codebase default for the "Auto-refresh on change" setting: reload the page when a handler is toggled. Developers can override this per-browser in the panel's Settings view, and their saved choice wins.                                                                                                                               |
| `defaultGroupBy`     | smart            | Codebase default for the "Group by" setting: `"none"` (flat list), `"path"` (tree by shared path segments), or `"tag"` (tree by [tag](/msw-panel/guides/feature-tags/)). Defaults to `"tag"` when any handler has tags, otherwise `"path"`. Developers can override this per-browser in the Settings view, and their saved choice wins. |
| `defaultOpen`        | `false`          | When `true`, the panel opens expanded on first render.                                                                                                                                                                                                                                                                                  |
| `panelSide`          | inferred         | Which side of the trigger button the panel expands toward. Defaults to `"top"` for bottom-anchored positions and vice versa.                                                                                                                                                                                                            |
| `persistOpen`        | `true`           | Remember the panel's open/closed state across reloads (saved per-browser). Restores the last state on load, overriding `defaultOpen`, so the panel does not vanish on a reload (e.g. with `defaultAutoRefresh`). Set `false` to always start from `defaultOpen` and never persist.                                                      |
| `position`           | `"bottom-right"` | Corner of the viewport to anchor the trigger button.                                                                                                                                                                                                                                                                                    |
| `shadow`             | `false`          | Renders the panel inside a Shadow DOM root to isolate it from external CSS resets.                                                                                                                                                                                                                                                      |
| `showInProduction`   | `false`          | When `true`, renders even in production. Intended for hosted demos and docs only.                                                                                                                                                                                                                                                       |
| `showCount`          | `true`           | When `false`, hides the numeric badge on the trigger button.                                                                                                                                                                                                                                                                            |
| `showSync`           | `false`          | When `true`, shows a Sync button in the toolbar. Only needed when handlers are added dynamically at runtime via `worker.use()`.                                                                                                                                                                                                         |
| `theme`              | `"dark"`         | Visual theme for the panel UI.                                                                                                                                                                                                                                                                                                          |
| `title`              | `"MSW Panel"`    | Heading shown inside the open panel.                                                                                                                                                                                                                                                                                                    |

---

## `MswPanelEmbedded`

Inline panel with no floating trigger button. Always expanded. Useful for Storybook addons, custom dev dashboards, or any layout where you control placement yourself.

```tsx
import { MswPanelEmbedded } from "msw-panel/react";

interface MswPanelEmbeddedProps {
  controller: MswPanelController | null | undefined;
  defaultAutoRefresh?: boolean;
  defaultGroupBy?: "none" | "path" | "tag";
  shadow?: boolean;
  showInProduction?: boolean;
  showSync?: boolean;
  style?: CSSProperties;
  theme?: "dark" | "light";
  title?: string;
}
```

### Props

| Prop                 | Default       | Description                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `controller`         | (none)        | Required. A `MswPanelController` from `createMswPanelController` or `createMswPanelBridgeClient`, or `null` to render nothing.                                                                                                                                                                                                          |
| `defaultAutoRefresh` | `false`       | Codebase default for the "Auto-refresh on change" setting: reload the page when a handler is toggled. Developers can override this per-browser in the panel's Settings view, and their saved choice wins.                                                                                                                               |
| `defaultGroupBy`     | smart         | Codebase default for the "Group by" setting: `"none"` (flat list), `"path"` (tree by shared path segments), or `"tag"` (tree by [tag](/msw-panel/guides/feature-tags/)). Defaults to `"tag"` when any handler has tags, otherwise `"path"`. Developers can override this per-browser in the Settings view, and their saved choice wins. |
| `shadow`             | `false`       | Renders the panel inside a Shadow DOM root to isolate it from external CSS resets.                                                                                                                                                                                                                                                      |
| `showInProduction`   | `false`       | When `true`, renders even in production. Intended for hosted demos and docs only.                                                                                                                                                                                                                                                       |
| `showSync`           | `false`       | When `true`, shows a Sync button in the toolbar. Only needed when handlers are added dynamically at runtime via `worker.use()`.                                                                                                                                                                                                         |
| `style`              | (none)        | Inline styles applied to the panel frame. Use to set `height`, `width`, `overflow`, etc.                                                                                                                                                                                                                                                |
| `theme`              | `"dark"`      | Visual theme for the panel UI.                                                                                                                                                                                                                                                                                                          |
| `title`              | `"MSW Panel"` | Heading shown at the top of the panel.                                                                                                                                                                                                                                                                                                  |

### Example

```tsx
<MswPanelEmbedded controller={controller} style={{ height: "500px" }} theme="light" />
```

---

## Behavior

- The trigger button stays visible at all times (floating panel only). Clicking it toggles the panel open or closed.
- When open, the panel shows a summary row — the enabled count as a fraction of the total, the scenario preset selector (when presets exist), and bulk enable/disable actions all on one line — followed by a search row and one toggle per handler. A Sync button can be shown by passing `showSync={true}`. It re-reads the handler list from the MSW runtime, which is only needed when handlers are added dynamically via `worker.use()` after the panel initialises.
- Each handler row uses a compact meta line for the kind or method badge plus `used`/`idle`, followed by a second line for the endpoint or label.
- Handler snapshots include MSW's `used` state, so the UI can distinguish handlers that matched a request from ones that are still idle in the current session.
- The filter input searches across label, method, path, and feature tags; its placeholder reflects what is searchable (it mentions tags only when handlers carry them). An **Only used** checkbox beside it narrows the list to handlers that have served a request this session, with the live used count shown beneath it. Both the filter text and the Only-used toggle are saved per-browser and restored on the next load.
- A gear icon in the header opens a Settings view. The first setting, **Auto-refresh on change**, reloads the page whenever a handler is changed (otherwise a manual "Refresh the page" banner appears). The reload is debounced, so a burst of changes collapses into a single reload and it holds off while you keep typing in the filter rather than interrupting you. The codebase default comes from the `defaultAutoRefresh` prop; a developer's own choice is saved per-browser to `localStorage` (key `msw-panel:settings`) and takes precedence over the prop.
- The second setting, **Group by**, organizes the list as a flat list (`none`), a collapsible tree grouped by shared path segments (`path`, with single-child chains compacted like nested folders), or a tree grouped by [tag](/msw-panel/guides/feature-tags/) (`tag`; untagged handlers fall into an _Untagged_ section). Each group shows a count, and a single **Expand all** / **Collapse all** toggle (flipping based on the current state) sits in the search row. The codebase default comes from the `defaultGroupBy` prop (when omitted, `tag` if any handler has tags, otherwise `path`); a developer's own choice is saved per-browser and takes precedence. The set of expanded groups is also persisted across reloads.
- Handlers created with [`defineScenarios`](/msw-panel/guides/scenarios/) render a scenario selector on their row; their feature tags render as chips. When the controller has global presets, the **scenario preset** selector sits in the summary row; [feature-scoped presets](/msw-panel/guides/scenarios/#feature-scoped-presets-and-feature-states) (defined with `{ tag }`) instead appear in their tag's group header when grouped by tag, alongside a "Set all to" option that switches every scenario handler sharing a name in that tag at once.
- The panel persists its UI state across reloads per-browser (`localStorage` for the open/closed state, group-by, expanded groups, filter, and Only-used toggle; `sessionStorage` for the list scroll position). State is restored before the first paint, so the panel doesn't flash its default and the list keeps its place — handy alongside `defaultAutoRefresh`. Set `persistOpen={false}` to always start the open/closed state from `defaultOpen` instead.
- By default, in production (`process.env.NODE_ENV === "production"`) or when `controller` is `null`, all components return `null`. Pass `showInProduction={true}` only for hosted demos or docs previews.
- All styling uses inline `CSSProperties`. No `<style>` tags are injected, so CSP nonce configuration is not required.

## Rendering model

Components subscribe to the controller with `useSyncExternalStore()`, which keeps them aligned with the external snapshot source without requiring React-specific state inside the controller itself.
