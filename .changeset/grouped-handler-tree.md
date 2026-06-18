---
"msw-panel": minor
---

Add an optional grouped tree view that organizes handlers by shared path segments (closes #10).

When enabled, HTTP handlers with a path are shown as a collapsible tree — `/profile/me`, `/profile/:id`, and `/profile/:id/followers` nest under a shared `profile` group, single-child chains compact like nested folders, and each group shows a handler count with **Expand all** / **Collapse all** controls. An active filter auto-expands matching groups; path-less handlers (GraphQL, WebSocket) stay in a flat section.

It's off by default to preserve the existing flat list. Set the codebase default with the new `defaultGrouped` prop on `<MswPanel>` / `<MswPanelEmbedded>`; individual developers can override it from the panel's Settings view via a new "Group handlers by path" toggle, saved per-browser to `localStorage` and taking precedence over the prop. Group expand/collapse state is currently in-memory (not yet persisted across reloads).
