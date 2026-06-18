---
"msw-panel": minor
---

The floating `<MswPanel>` now remembers its open/closed state across page reloads by default (saved per-browser to `localStorage`). On load it restores the last state, overriding `defaultOpen`.

Previously the panel always reopened collapsed after a reload, which was especially disruptive with `defaultAutoRefresh` — toggling a handler reloaded the page and you lost your place. Now the panel stays where you left it.

Controlled by the new `persistOpen` prop (defaults to `true`). Set `persistOpen={false}` to restore the previous behavior of always starting from `defaultOpen` without persisting.
