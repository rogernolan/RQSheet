# RQSheetWeb

`RQSheetWeb` is a small web app RuneQuest: RolePlaying in Gloranth (or Runequest 4e) character sheet designed for desktop and iPad.
It supports import from and export to the [RPGG Play By Forum format](https://rpggeek.com/thread/1207530/article/30823864#30823864) by Edward Bolme.

## What It Is

RQWebSheet currently lets you:

- create and manage multiple characters in your browser
- import a character from an RPGGeek formatted character
- export your character to RPGGeek markdown
- install it on tablet as a PWA web app

At the moment, data is stored locally in your browser on that device.

Save is implicit and there is no undo. 

This app was entirely vibe coded with Codex. Use it at your own risk.

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

To install on a tablet or another device on the same Wi-Fi network:

```bash
npm run dev:lan
```

That script starts the dev server on `0.0.0.0` and configures the current LAN origin for Next.js dev mode.

Then open the URL shown by the script from your other device and save to homescreen or whatever your favourite way of doing this is.

## Testing

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
