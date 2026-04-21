---
title: Mount the React panel
description: Add the floating React UI on top of an existing browser worker setup.
---

Use `msw-panel/react` when the UI can live in the same process as the runtime.

## 1. Create the controller

```ts
import { createMswPanelController } from "msw-panel";

const controller = createMswPanelController({ runtime: worker });
```

## 2. Render the panel

```tsx
import { MswPanel } from "msw-panel/react";

export function App() {
  return (
    <>
      <MainApp />
      <MswPanel controller={controller} showCount theme="dark" title="MSW Panel" />
    </>
  );
}
```

## 3. Sync when needed

If your app adds handlers at runtime, call `controller.sync()` after that change so the snapshot reflects the runtime's current handler list.

## Notes

- `defaultOpen` defaults to `false` — the panel starts as a small floating icon button that opens on click.
- `theme` defaults to `"dark"`.
- `showCount` defaults to `true` and controls the enabled-handler badge on the collapsed trigger button.
- `panelSide` controls which direction the panel expands from the trigger button (`"top"` or `"bottom"`). Defaults to the natural direction for the chosen corner.
- In production (`process.env.NODE_ENV === "production"`) or when `controller` is `null`, the component renders nothing. It is safe to leave `<MswPanel controller={controller} />` in your tree unconditionally — no ternary needed.
- The panel subscribes through `useSyncExternalStore()`.
- The UI does not need direct access to MSW; it only depends on the controller interface.
- This is the simplest integration path and should be the default choice unless you need a remote inspector.

## Embedded panel

Use `MswPanelEmbedded` when you want the panel to live inline rather than floating — for example in a Storybook addon panel or a custom dev toolbar:

```tsx
import { MswPanelEmbedded } from "msw-panel/react";

<MswPanelEmbedded controller={controller} style={{ height: "500px" }} />;
```

## Lazy loading

To split the panel out of your initial bundle entirely, import from `msw-panel/react/lazy`. The API is identical:

```tsx
import { MswPanel } from "msw-panel/react/lazy";

<MswPanel controller={controller} />;
```

## Shadow DOM isolation

Pass `shadow` to render the panel inside a Shadow DOM root. This prevents aggressive host-page CSS resets from affecting the panel's appearance:

```tsx
<MswPanel controller={controller} shadow />
```
