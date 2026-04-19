---
title: Mount the React panel
description: Add the floating React UI on top of an existing browser worker setup.
---

Use `msw-panel/react` when the UI can live in the same process as the runtime.

## 1. Create the controller

```ts
import { createMswPanelController } from "msw-panel";

const controller = createMswPanelController({
  runtime: worker,
  storage: window.localStorage,
  storageKey: "msw-panel:demo",
});
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
- In production (`process.env.NODE_ENV === "production"`) the component renders nothing and is eliminated by the bundler. It is safe to leave `<MswPanel>` in your tree unconditionally.
- The panel subscribes through `useSyncExternalStore()`.
- The UI does not need direct access to MSW; it only depends on the controller interface.
- This is the simplest integration path and should be the default choice unless you need a remote inspector.
