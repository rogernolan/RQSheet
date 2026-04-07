# RQSheetWeb

`RQSheetWeb` is a web reimplementation of the `RQSheet` iOS app.

It is a local-first RuneQuest character sheet designed for desktop and iPad

## What It Is

The current web app includes:

- a local character workspace backed by browser storage
- character create, import, select, and delete flows
- a sheet-style layout for statistics, skills, combat, runes, magic, equipment, notes, and passions
- a text import flow based on the iOS app fixtures and importer design
- touch-friendly interactions with implicit save
- early PWA support for iPad installation

The project is currently local-only by design, but the code keeps a storage boundary so a hosted/synced version can be added later.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- IndexedDB/local browser storage
- Vitest

## Running Locally

From the repo root:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Running On Your Local Network

For testing on iPad or another device on the same Wi-Fi network:

```bash
npm run dev:lan
```

That script starts the dev server on `0.0.0.0` and configures the current LAN origin for Next.js dev mode.

Then open the URL shown by the script from your other device.

## Checks

```bash
npm test
npm run lint
npm run build
```

## Project Structure

```txt
src/
  app/                 Next.js app shell and routes
  components/          UI and workspace sections
  domain/              RuneQuest data model and derived rules
  lib/storage/         Local-first repository and persistence
  tests/               Domain and storage tests
public/                PWA and rune assets
docs/                  Planning notes
```

## Product Direction

- local-first first
- touch-friendly on desktop and iPad
- installable PWA
- no explicit save buttons; edits save implicitly
- sheet-inspired layout rather than mobile tab navigation

## Status

This is an active build, not a finished product. 

For the implementation plan, see [docs/implementation-plan.md](/Users/rog/Development/RQSheetWeb/docs/implementation-plan.md).
