# Contributing to msw-panel

Thanks for your interest in contributing.

`msw-panel` is a pnpm workspace built around a publishable core package plus
private docs and example apps. The project is still moving quickly, so it is
worth aligning on non-trivial changes before you invest time in a pull request.

## Before you start

Please open an issue before submitting a PR for:

- New features
- Architectural changes
- Public API changes
- Anything that touches package structure or release behavior

Small documentation fixes, focused bug fixes, and test improvements can usually
go straight to a PR.

## Repository layout

- `packages/core`
  Publishable package currently released as `msw-panel`
- `apps/docs`
  Astro documentation site
- `apps/example-*`
  Private example apps used for local development and integration coverage

## Local setup

Prerequisites:

- Node.js
- pnpm

```bash
git clone https://github.com/barrymichaeldoyle/msw-panel.git
cd msw-panel
pnpm install
```

## Common workflows

Run the main quality checks from the repo root:

```bash
pnpm ci:check
```

Useful commands while working:

```bash
pnpm dev:docs
pnpm dev:example-react
pnpm dev:example-react-minimal
pnpm dev:example-node
pnpm dev:example-remote-relay
pnpm dev:example-remote-inspector
pnpm test
pnpm test:e2e
pnpm lint
pnpm typecheck
pnpm fmt
pnpm fmt:check
```

## Contribution expectations

- Keep PRs focused. Avoid bundling unrelated cleanup.
- Add or update tests when behavior changes.
- Preserve the current package boundaries unless the change is discussed first.
- Prefer additive API changes over breaking ones while the package surface is
  still settling.
- Update docs when user-facing behavior, setup, or examples change.

## Pull request checklist

Before opening a PR, make sure you have:

- Run the relevant tests for your change
- Run linting and type-checking
- Updated docs or examples if needed
- Linked the issue, if one exists

## Release notes

There is no contributor-facing release workflow yet beyond standard pull
requests to `main`. If a change needs package publication or versioning work,
call that out in the PR description so it can be handled deliberately.

## Questions

If you are unsure whether a change is in scope, open an issue first and outline
the use case, proposed change, and any API impact.
