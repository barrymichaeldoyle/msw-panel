---
"msw-panel": patch
---

Add an `id="msw-panel"` to the floating panel's `<aside>` wrapper so developers can target it with their own CSS or scripts.

Fix the collapsed panel covering content beneath it. The fixed-position wrapper now uses `pointer-events: none`, so clicks pass through its empty area; the trigger button and open panel re-enable pointer events on themselves.

Accessibility and UX polish: press `Escape` to close the open panel, the `<aside>` landmark is now named via `aria-label`, handler toggles expose an `aria-label` describing which handler they control, and the filter field uses `type="search"`.
