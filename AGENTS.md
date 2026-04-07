# AGENTS.md

This file gives coding agents a quick orientation for working in `RQSheetWeb`.

## Project Purpose

`RQSheetWeb` is a web reimplementation of the `RQSheet` iOS app.

The goal is not a literal screen-for-screen port. The web app should feel native to desktop and iPad, while preserving the underlying RuneQuest character-sheet behavior and importer logic from the iOS app.

## Product Direction

- local-first first
- touch-friendly on desktop and iPad
- installable PWA
- sheet-inspired layout, not mobile-style tabs
- implicit save by default
- keep a clean storage boundary so a hosted/synced version can be added later

## Current Architecture

- `src/app/`
  - Next.js app shell and routing
- `src/components/`
  - workspace UI and section components
- `src/domain/`
  - RuneQuest rules, derived values, import parsing, and data normalization
- `src/lib/storage/`
  - local-first repository and persistence layer
- `src/tests/`
  - domain and storage tests

## Important UI Conventions

- Avoid a mobile-app card stack when a denser sheet-like layout is possible.
- Prefer compact section spacing over oversized padding.
- Avoid unnecessary borders, chip UIs, and nested panels.
- There should never be horizontal scrolling for core workspace content.
- Editing should generally be inline and implicit, not explicit-save form workflows.
- The app should remain finger-friendly on iPad, but should not look like a blown-up phone UI.

## Data And Persistence Conventions

- Keep business logic in `src/domain`, not embedded in component JSX.
- Preserve the repository/storage boundary in `src/lib/storage`.
- New persisted booleans and fields should be normalized so older stored records remain safe.
- Imported data should generally be treated as authoritative where the existing product expects it.

## Importer Guidance

- The web importer should stay aligned with the iOS importer behavior and fixtures.
- Prefer extending the existing parser pipeline rather than creating a parallel import path.
- When changing import behavior, add or update fixture-backed tests.

## Verification

Before claiming a change is done, run:

```bash
npm test
npm run lint
npm run build
```

At minimum, `lint` and `build` should pass for UI-only changes.

## Notes For Future Work

- Keep the path open for a hosted version, but do not design the MVP around it.
- Prefer evolutions that improve the web experience even if they differ from the iOS navigation model.
- When in doubt, use the iOS app and official character sheet as behavior/layout references, not as rigid templates.
