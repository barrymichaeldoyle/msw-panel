# msw-panel

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
