---
"msw-panel": minor
---

Add a Settings view to the panel, opened from a new gear icon in the header.

The first setting, **Auto-refresh on change**, reloads the page whenever a handler is enabled or disabled instead of showing the manual "Refresh the page" banner. Configure the codebase-wide default with the new `defaultAutoRefresh` prop on `<MswPanel>` / `<MswPanelEmbedded>` (defaults to `false`); individual developers can override it from the panel's Settings view, and their choice is saved per-browser to `localStorage` (key `msw-panel:settings`), taking precedence over the prop default.
