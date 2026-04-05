# RQSheetWeb

Web reimplementation of the `RQSheet` iOS app.

## Product direction

- Local-first MVP
- Touch-friendly on desktop and iPad
- Installable PWA on iPad
- Single-character workspace dashboard instead of mobile-style top-level tabs
- Keep a clean boundary between domain logic and storage so a hosted version can be added later

## Near-term goals

1. Port the RuneQuest domain model and derived rules from Swift to TypeScript.
2. Build a local-only character repository backed by IndexedDB.
3. Create a responsive app shell with a persistent character menu and a single multi-column workspace.
4. Reimplement import as a modal flow that creates a new character and switches to it.
5. Ship an installable PWA that works well on iPad.

## Proposed stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- IndexedDB for local persistence
- PWA support
- Vitest and Playwright for testing

## Layout model

- Desktop, laptop, tablet landscape: 3-column workspace
- Tablet portrait: 2-column workspace
- Narrow mobile: 1-column stacked fallback

## Repo shape

```txt
src/
  app/
  components/
  domain/
  hooks/
  lib/
    storage/
  styles/
  tests/
docs/
```

See [docs/implementation-plan.md](/Users/rog/Development/RQSheetWeb/docs/implementation-plan.md) for the phased build plan.
