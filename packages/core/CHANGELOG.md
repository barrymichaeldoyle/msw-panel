# msw-panel

## 0.4.0

### Minor Changes

- Add scenarios and feature tags.
  - `defineScenarios` declares an endpoint with multiple named response states (e.g. `success`, `empty`, `error`). The panel renders a per-handler selector and switching a scenario changes the live response with no reload. Selections persist across reloads.
  - `withScenarios` wraps fully-formed MSW handlers as scenario variants instead of a resolver map, for adding scenarios to handlers you already have and for GraphQL (which `defineScenarios` does not cover).
  - `definePreset` bundles scenario selections into named presets (e.g. "Logged out") applied in one click. Pass them via the new `createMswPanelController({ presets })` option. Without a tag they are **global** (a selector at the top of the panel); with `definePreset(label, selections, { tag })` they are **feature-scoped** and appear in that feature's group header instead, so you can drive a single feature into a named state independently of the rest of the app.
  - When grouped by tag, each tag's group header offers a scenario control: it applies any feature-scoped presets and — when the group's handlers share scenario names — a "Set all to" option that fans one scenario out across every handler in the group at once (no extra authoring required).
  - `withTags` and `tagged` attach feature tags to handlers. Tags are searchable in the filter box and can be grouped from the panel.
  - Controller gains `setScenario(id, scenarioId)` and `applyPreset(presetId)`; the bridge protocol gains matching `set-scenario` and `apply-preset` commands. The handler snapshot gains optional `tags`, `scenarios`, and `activeScenario`; the top-level snapshot gains optional `presets` and `activePreset`, and each preset descriptor carries `active` plus an optional `tag`.

  Panel UI:
  - The "Group by" setting is now a single selector (None / Path / Tag) instead of separate path/feature toggles, and defaults to Tag when any handler has tags, otherwise Path. **Breaking:** the `defaultGrouped?: boolean` prop on `<MswPanel>` / `<MswPanelEmbedded>` is replaced by `defaultGroupBy?: "none" | "path" | "tag"` (use `defaultGroupBy="path"` for the old `defaultGrouped` behavior, or `defaultGroupBy="tag"` for the previous "group by feature" view).
  - Tightened the panel layout: "Enable all" / "Disable all" now sit inline on the summary line instead of their own row, the handler list no longer nests inside a bordered card and spans the full panel width, the filter placeholder reflects what is searchable, and the header gear/close buttons are equal-sized.

### Patch Changes

- Tighten up the panel's control rows and add a "used" filter:
  - The global scenario preset selector now sits inline with the "Enable all" / "Disable all" actions; the dedicated "Scenario preset" row is gone (the option label already says what it is, and an `aria-label` keeps it accessible).
  - The summary now reads as a single `enabled / total` count instead of separate "enabled", "disabled", and "used" tallies, so the whole control row fits on one line.
  - "Expand all" and "Collapse all" are now a single toggle that flips based on the current state, sized for the longer label so toggling doesn't shift the search row.
  - Added an "Only used" checkbox to the search row that narrows the list to handlers that have served a request, with the live used count shown beneath it (so the "used" stat removed from the summary is still visible, without its own row).

- Use the official Mock Service Worker logo for the panel's branding. The collapsed trigger button and the open panel header now show the MSW mark (a subtle ring keeps the dark logo tile legible on dark surfaces) instead of the previous generic icon. No API changes.
- Improve the auto-refresh reload and persist more panel state across reloads:
  - The auto-refresh reload is now debounced instead of firing the instant a change is made. This batches a burst of toggles into a single reload, gives an async (bridge-backed) controller time to apply and persist the change before the page reloads — fixing a race where `window.location.reload()` could outrun the change reaching the controller that owns storage — and, because the timer also resets while you keep typing in the filter, stops the reload from firing mid-edit and wiping what you're typing.
  - Group collapse/expand state is now persisted per browser, so the handler tree reopens to where you left it after a reload instead of resetting to fully collapsed.
  - Persisted UI state (open/closed, group-by, expanded groups) is now restored before the first paint rather than just after mount, so the panel no longer flashes closed/ungrouped for a frame on reload — including the auto-refresh reload — before snapping to its saved state. Restoring before paint keeps the first render equal to the codebase default, so there's still no SSR hydration mismatch.
  - The handler list now remembers its scroll position across reloads (per tab, via `sessionStorage`), so toggling a value far down the list no longer bounces you back to the top after the auto-refresh reload. The offset is re-applied before paint as the persisted groups expand, so there's no visible jump.
  - The filter text and the "Only used" toggle are now persisted per browser as well, so an active filter survives the auto-refresh reload (restored before paint) instead of resetting to the full list.

## 0.3.0

### Minor Changes

- 5e8b765: Add an optional grouped tree view that organizes handlers by shared path segments (closes #10).

  When enabled, HTTP handlers with a path are shown as a collapsible tree. `/profile/me`, `/profile/:id`, and `/profile/:id/followers` nest under a shared `profile` group, single-child chains compact like nested folders, and each group shows a handler count with **Expand all** / **Collapse all** controls. An active filter auto-expands matching groups; path-less handlers (GraphQL, WebSocket) stay in a flat section.

  It's off by default to preserve the existing flat list. Set the codebase default with the new `defaultGrouped` prop on `<MswPanel>` / `<MswPanelEmbedded>`; individual developers can override it from the panel's Settings view via a new "Group handlers by path" toggle, saved per-browser to `localStorage` and taking precedence over the prop. Group expand/collapse state is currently in-memory (not yet persisted across reloads).

- 179a35e: Add a Settings view to the panel, opened from a new gear icon in the header.

  The first setting, **Auto-refresh on change**, reloads the page whenever a handler is enabled or disabled instead of showing the manual "Refresh the page" banner. Configure the codebase-wide default with the new `defaultAutoRefresh` prop on `<MswPanel>` / `<MswPanelEmbedded>` (defaults to `false`); individual developers can override it from the panel's Settings view, and their choice is saved per-browser to `localStorage` (key `msw-panel:settings`), taking precedence over the prop default.

- 5e8b765: The floating `<MswPanel>` now remembers its open/closed state across page reloads by default (saved per-browser to `localStorage`). On load it restores the last state, overriding `defaultOpen`.

  Previously the panel always reopened collapsed after a reload, which was especially disruptive with `defaultAutoRefresh`. Toggling a handler reloaded the page and you lost your place. Now the panel stays where you left it.

  Controlled by the new `persistOpen` prop (defaults to `true`). Set `persistOpen={false}` to restore the previous behavior of always starting from `defaultOpen` without persisting.

### Patch Changes

- d73a448: Add an `id="msw-panel"` to the floating panel's `<aside>` wrapper so developers can target it with their own CSS or scripts.

  Fix the collapsed panel covering content beneath it. The fixed-position wrapper now uses `pointer-events: none`, so clicks pass through its empty area; the trigger button and open panel re-enable pointer events on themselves.

  Accessibility and UX polish: press `Escape` to close the open panel, the `<aside>` landmark is now named via `aria-label`, handler toggles expose an `aria-label` describing which handler they control, and the filter field uses `type="search"`.

## 0.2.2

### Patch Changes

- Fix "disable all" state not persisting across page refreshes. When all handlers were disabled, `resetHandlers()` was called with no arguments, which MSW interprets as "restore initial handlers", re-enabling everything. Disabled handlers are now passed to `resetHandlers` wrapped so their `run()` returns `null` (MSW's "didn't match" signal), avoiding the restore path entirely.
- 1ebf99a: Add a `defaultEnabled` controller option so apps can start with all MSW handlers disabled until users enable them.

## 0.2.1

### Patch Changes

- Add a `showInProduction` React prop for hosted demos, remove the stale `msw-panel/react/lazy` README reference, and align the example app tests with the current auto-loading demo UI.

## 0.2.0

### Minor Changes

- Add refresh banner, fix trigger button visibility, lock panel to fixed dimensions, and make lazy loading the default.
  - **Refresh banner**: toggling any handler (individually or via Enable all / Disable all) now shows an amber banner with a Refresh button, reminding you that handler changes require a page reload to take effect.
  - **Trigger button**: the floating trigger button is now hidden while the panel is open. The close button inside the panel is the only way to dismiss it.
  - **Fixed panel dimensions**: the panel is now a fixed `30rem` tall and always fills the full width of its container. Previously, filtering down to zero results would cause the panel to collapse to a very narrow sliver. The handler list scrolls internally; the empty and no-results states are vertically centred in the available space. `MswPanelEmbedded` users can still override dimensions via the `style` prop.
  - **Button text colour**: action button text in the dark theme is now white instead of near-black.
  - **Lazy loading by default**: `msw-panel/react` now ships the lazy-loaded bundle (previously `msw-panel/react/lazy`). The panel is code-split out of your initial bundle automatically with a built-in `Suspense` boundary. The `msw-panel/react/lazy` sub-path has been removed. Update any imports to `msw-panel/react`.

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
