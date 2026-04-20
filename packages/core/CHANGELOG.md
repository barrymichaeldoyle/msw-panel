# msw-panel

## 0.1.2

### Patch Changes

- Allow `undefined` to be passed as `controller` prop (in addition to `null`) in `MswPanel` and `MswPanelEmbedded`.

  Add subpath shim `package.json` files at `react/`, `react/lazy/`, and `bridge/` so that `eslint-plugin-import`'s `import/no-unresolved` rule can resolve `msw-panel/react` and other subpaths without requiring a special exports-aware resolver.

## 0.1.1

### Patch Changes

- Add `typesVersions` for TypeScript projects using `moduleResolution: "node"` so subpath imports (`msw-panel/react`, `msw-panel/bridge`, `msw-panel/react/lazy`) resolve correctly without requiring `moduleResolution: "bundler"`.
