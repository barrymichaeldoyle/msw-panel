---
title: Use the controller with Node
description: Apply the same handler control model to setupServer and CLI-driven workflows.
---

The controller does not require a browser worker. Any runtime that can list handlers and reset handlers fits the contract.

## Runtime contract

```ts
interface MswRuntimeController {
  listHandlers(): readonly MswAnyHandler[];
  resetHandlers(...nextHandlers: MswAnyHandler[]): void;
}
```

`setupServer` satisfies this pattern, which is why the Node example can reuse the same controller model.

## Local example

Run the example CLI:

```bash
pnpm dev:example-node
```

Available commands include:

- `list`
- `user`
- `projects`
- `toggle 1`
- `all off`
- `exit`

Disabled state is persisted to `apps/example-node/.msw-panel-state.json`.

## Why Node works cleanly here

The controller only depends on a runtime that can list handlers and reset handlers. That keeps the package useful outside the browser without special Node-specific UI logic.
