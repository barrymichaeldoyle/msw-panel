# msw-panel

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
