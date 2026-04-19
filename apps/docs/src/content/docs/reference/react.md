---
title: React reference
description: Props and behavior for the floating React panel.
---

## `MswPanel`

```tsx
interface MswPanelProps {
  controller: MswPanelController;
  defaultOpen?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showCount?: boolean;
  theme?: "dark" | "light";
  title?: string;
}
```

## Props

| Prop | Default | Description |
|------|---------|-------------|
| `controller` | — | Required. A `MswPanelController` from `createMswPanelController` or `createMswPanelBridgeClient`. |
| `defaultOpen` | `false` | When `true`, the panel opens expanded on first render instead of showing the collapsed trigger button. |
| `position` | `"bottom-right"` | Corner of the viewport to anchor the panel. |
| `showCount` | `true` | When `false`, hides the numeric badge on the collapsed trigger button. |
| `theme` | `"dark"` | Visual theme for the panel UI. |
| `title` | `"MSW Panel"` | Heading shown inside the open panel. |

## Behavior

- When collapsed, the panel renders as a floating icon button. By default, its badge shows the count of enabled handlers when non-zero.
- When expanded, the panel shows a handler count summary, bulk enable/disable and sync actions, a filter input, and one toggle per handler.
- Each handler row uses a compact meta line for the kind or method badge plus `used`/`idle`, followed by a second line for the endpoint or label.
- Handler snapshots include MSW's `used` state, so the UI can distinguish handlers that matched a request from ones that are still idle in the current session.
- The filter input searches across label, method, and path.
- In production (`process.env.NODE_ENV === "production"`) the component returns `null` and is dead-code-eliminated by the bundler. It is safe to leave `<MswPanel>` in your tree unconditionally.

## Rendering model

The component subscribes to the controller with `useSyncExternalStore()`, which keeps it aligned with the external snapshot source without requiring React-specific state inside the controller itself.
