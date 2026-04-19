---
title: Status and next steps
description: Current boundaries in the implementation and the most likely next improvements.
---

## Current status

The React panel is the primary supported UI. It works with MSW's browser worker (`setupWorker`) and is safe to ship in your dev setup.

## Known limitations

- Runtime-added handlers require a manual `controller.sync()` call to appear in the panel.
- Handler labels are richest for HTTP and GraphQL handlers.
- The remote bridge examples assume the relay is already reachable (no reconnect/backoff yet).

## Planned

1. **Framework adapters** — Vue, Svelte, and other framework panel UIs.
2. **Auto-sync** — lifecycle hooks so runtime-added handlers appear without a manual `sync()`.
3. **Published packages** — stable npm releases for `msw-panel`, `msw-panel/react`, and `msw-panel/bridge`.
4. **Integration tests** — browser-level tests covering real request fallthrough when a handler is toggled off.
5. **Remote bridge reconnect** — backoff and reconnect logic for the WebSocket transport.
