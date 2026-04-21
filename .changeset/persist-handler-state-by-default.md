---
"msw-panel": patch
---

Persist handler enabled/disabled state across page reloads by default. `storage` now defaults to `window.localStorage` and `storageKey` defaults to `"msw-panel"`, so no extra configuration is needed. Pass `storage: null` to opt out of persistence.
