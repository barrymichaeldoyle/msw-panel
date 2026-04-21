---
title: React reference
description: Props and behavior for the React panel components.
---

## `MswPanel`

Floating panel anchored to a corner of the viewport. The trigger button is always visible; clicking it toggles the panel open or closed.

```tsx
import { MswPanel } from "msw-panel/react";

interface MswPanelProps {
  controller: MswPanelController | null;
  defaultOpen?: boolean;
  panelSide?: "top" | "bottom";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  shadow?: boolean;
  showCount?: boolean;
  showSync?: boolean;
  theme?: "dark" | "light";
  title?: string;
}
```

### Props

| Prop          | Default          | Description                                                                                                                     |
| ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `controller`  | —                | Required. A `MswPanelController` from `createMswPanelController` or `createMswPanelBridgeClient`, or `null` to render nothing.  |
| `defaultOpen` | `false`          | When `true`, the panel opens expanded on first render.                                                                          |
| `panelSide`   | inferred         | Which side of the trigger button the panel expands toward. Defaults to `"top"` for bottom-anchored positions and vice versa.    |
| `position`    | `"bottom-right"` | Corner of the viewport to anchor the trigger button.                                                                            |
| `shadow`      | `false`          | Renders the panel inside a Shadow DOM root to isolate it from external CSS resets.                                              |
| `showCount`   | `true`           | When `false`, hides the numeric badge on the trigger button.                                                                    |
| `showSync`    | `false`          | When `true`, shows a Sync button in the toolbar. Only needed when handlers are added dynamically at runtime via `worker.use()`. |
| `theme`       | `"dark"`         | Visual theme for the panel UI.                                                                                                  |
| `title`       | `"MSW Panel"`    | Heading shown inside the open panel.                                                                                            |

---

## `MswPanelEmbedded`

Inline panel with no floating trigger button — always expanded. Useful for Storybook addons, custom dev dashboards, or any layout where you control placement yourself.

```tsx
import { MswPanelEmbedded } from "msw-panel/react";

interface MswPanelEmbeddedProps {
  controller: MswPanelController | null;
  shadow?: boolean;
  showSync?: boolean;
  style?: CSSProperties;
  theme?: "dark" | "light";
  title?: string;
}
```

### Props

| Prop         | Default       | Description                                                                                                                     |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `controller` | —             | Required. A `MswPanelController` from `createMswPanelController` or `createMswPanelBridgeClient`, or `null` to render nothing.  |
| `shadow`     | `false`       | Renders the panel inside a Shadow DOM root to isolate it from external CSS resets.                                              |
| `showSync`   | `false`       | When `true`, shows a Sync button in the toolbar. Only needed when handlers are added dynamically at runtime via `worker.use()`. |
| `style`      | —             | Inline styles applied to the panel frame. Use to set `height`, `width`, `overflow`, etc.                                        |
| `theme`      | `"dark"`      | Visual theme for the panel UI.                                                                                                  |
| `title`      | `"MSW Panel"` | Heading shown at the top of the panel.                                                                                          |

### Example

```tsx
<MswPanelEmbedded controller={controller} style={{ height: "500px" }} theme="light" />
```

---

## Lazy import (`msw-panel/react/lazy`)

Import from `msw-panel/react/lazy` to code-split the panel out of your initial bundle. The components have the same API as the standard exports and include a built-in `Suspense` boundary so no wrapper is needed.

```tsx
import { MswPanel } from "msw-panel/react/lazy";

// Drop-in replacement — loads asynchronously
<MswPanel controller={controller} />;
```

---

## Behavior

- The trigger button stays visible at all times (floating panel only). Clicking it toggles the panel open or closed.
- When open, the panel shows a handler count summary, bulk enable/disable actions, a filter input, and one toggle per handler. A Sync button can be shown by passing `showSync={true}` — it re-reads the handler list from the MSW runtime, which is only needed when handlers are added dynamically via `worker.use()` after the panel initialises.
- Each handler row uses a compact meta line for the kind or method badge plus `used`/`idle`, followed by a second line for the endpoint or label.
- Handler snapshots include MSW's `used` state, so the UI can distinguish handlers that matched a request from ones that are still idle in the current session.
- The filter input searches across label, method, and path.
- In production (`process.env.NODE_ENV === "production"`) or when `controller` is `null`, all components return `null`. It is safe to leave `<MswPanel controller={controller} />` in your tree unconditionally — no ternary needed.
- All styling uses inline `CSSProperties`. No `<style>` tags are injected, so CSP nonce configuration is not required.

## Rendering model

Components subscribe to the controller with `useSyncExternalStore()`, which keeps them aligned with the external snapshot source without requiring React-specific state inside the controller itself.
