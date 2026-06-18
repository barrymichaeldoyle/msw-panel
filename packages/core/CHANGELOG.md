# msw-panel

## 0.3.0

### Minor Changes

- 5e8b765: Add an optional grouped tree view that organizes handlers by shared path segments (closes #10).

  When enabled, HTTP handlers with a path are shown as a collapsible tree — `/profile/me`, `/profile/:id`, and `/profile/:id/followers` nest under a shared `profile` group, single-child chains compact like nested folders, and each group shows a handler count with **Expand all** / **Collapse all** controls. An active filter auto-expands matching groups; path-less handlers (GraphQL, WebSocket) stay in a flat section.

  It's off by default to preserve the existing flat list. Set the codebase default with the new `defaultGrouped` prop on `<MswPanel>` / `<MswPanelEmbedded>`; individual developers can override it from the panel's Settings view via a new "Group handlers by path" toggle, saved per-browser to `localStorage` and taking precedence over the prop. Group expand/collapse state is currently in-memory (not yet persisted across reloads).

- 179a35e: Add a Settings view to the panel, opened from a new gear icon in the header.

  The first setting, **Auto-refresh on change**, reloads the page whenever a handler is enabled or disabled instead of showing the manual "Refresh the page" banner. Configure the codebase-wide default with the new `defaultAutoRefresh` prop on `<MswPanel>` / `<MswPanelEmbedded>` (defaults to `false`); individual developers can override it from the panel's Settings view, and their choice is saved per-browser to `localStorage` (key `msw-panel:settings`), taking precedence over the prop default.

- 5e8b765: The floating `<MswPanel>` now remembers its open/closed state across page reloads by default (saved per-browser to `localStorage`). On load it restores the last state, overriding `defaultOpen`.

  Previously the panel always reopened collapsed after a reload, which was especially disruptive with `defaultAutoRefresh` — toggling a handler reloaded the page and you lost your place. Now the panel stays where you left it.

  Controlled by the new `persistOpen` prop (defaults to `true`). Set `persistOpen={false}` to restore the previous behavior of always starting from `defaultOpen` without persisting.

### Patch Changes

- d73a448: Add an `id="msw-panel"` to the floating panel's `<aside>` wrapper so developers can target it with their own CSS or scripts.

  Fix the collapsed panel covering content beneath it. The fixed-position wrapper now uses `pointer-events: none`, so clicks pass through its empty area; the trigger button and open panel re-enable pointer events on themselves.

  Accessibility and UX polish: press `Escape` to close the open panel, the `<aside>` landmark is now named via `aria-label`, handler toggles expose an `aria-label` describing which handler they control, and the filter field uses `type="search"`.

## 0.2.2

### Patch Changes

- Fix "disable all" state not persisting across page refreshes. When all handlers were disabled, `resetHandlers()` was called with no arguments, which MSW interprets as "restore initial handlers" — re-enabling everything. Disabled handlers are now passed to `resetHandlers` wrapped so their `run()` returns `null` (MSW's "didn't match" signal), avoiding the restore path entirely.
- 1ebf99a: Add a `defaultEnabled` controller option so apps can start with all MSW handlers disabled until users enable them.

## 0.2.1

### Patch Changes

- Add a `showInProduction` React prop for hosted demos, remove the stale `msw-panel/react/lazy` README reference, and align the example app tests with the current auto-loading demo UI.

## 0.2.0

### Minor Changes

- Add refresh banner, fix trigger button visibility, lock panel to fixed dimensions, and make lazy loading the default.
  - **Refresh banner**: toggling any handler (individually or via Enable all / Disable all) now shows an amber banner with a Refresh button, reminding you that handler changes require a page reload to take effect.
  - **Trigger button**: the floating trigger button is now hidden while the panel is open — the close button inside the panel is the only way to dismiss it.
  - **Fixed panel dimensions**: the panel is now a fixed `30rem` tall and always fills the full width of its container. Previously, filtering down to zero results would cause the panel to collapse to a very narrow sliver. The handler list scrolls internally; the empty and no-results states are vertically centred in the available space. `MswPanelEmbedded` users can still override dimensions via the `style` prop.
  - **Button text colour**: action button text in the dark theme is now white instead of near-black.
  - **Lazy loading by default**: `msw-panel/react` now ships the lazy-loaded bundle (previously `msw-panel/react/lazy`). The panel is code-split out of your initial bundle automatically with a built-in `Suspense` boundary. The `msw-panel/react/lazy` sub-path has been removed — update any imports to `msw-panel/react`.

## 0.1.5

### Patch Changes

- 726281a: Hide the Sync button by default. Add a `showSync` prop (defaults to `false`) to `MswPanel` and `MswPanelEmbedded` for users who need it when adding handlers dynamically at runtime.
- 726281a: Persist handler enabled/disabled state across page reloads by default. `storage` now defaults to `window.localStorage` and `storageKey` defaults to `"msw-panel"`, so no extra configuration is needed. Pass `storage: null` to opt out of persistence.

## 0.1.4

### Patch Changes

- Update the published package README to improve install guidance and peer dependency documentation.

## 0.1.3

### Patch Changes

- 19403d5: Use tabular numerals for the React panel's count badge and summary stats to avoid layout shift when digits change.

## 0.1.2

### Patch Changes

- Allow `undefined` to be passed as `controller` prop (in addition to `null`) in `MswPanel` and `MswPanelEmbedded`.

  Add subpath shim `package.json` files at `react/`, `react/lazy/`, and `bridge/` so that `eslint-plugin-import`'s `import/no-unresolved` rule can resolve `msw-panel/react` and other subpaths without requiring a special exports-aware resolver.

## 0.1.1

### Patch Changes

- Add `typesVersions` for TypeScript projects using `moduleResolution: "node"` so subpath imports (`msw-panel/react`, `msw-panel/bridge`, `msw-panel/react/lazy`) resolve correctly without requiring `moduleResolution: "bundler"`.
