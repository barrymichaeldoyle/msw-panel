---
"msw-panel": patch
---

Fix "disable all" state not persisting across page refreshes. When all handlers were disabled, `resetHandlers()` was called with no arguments, which MSW interprets as "restore initial handlers" — re-enabling everything. Disabled handlers are now passed to `resetHandlers` wrapped so their `run()` returns `null` (MSW's "didn't match" signal), avoiding the restore path entirely.
