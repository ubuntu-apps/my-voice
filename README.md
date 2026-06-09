# My Voice

A simple, installable Progressive Web App (PWA) for tracking your vocal range.
Record your lowest and highest comfortable notes in separate sessions; the app
detects pitch in real time and saves only the frequency (Hz) — no audio is stored.

Works offline and installs to the home screen on both **iPhone (iOS/Safari)** and
**Android (Chrome)**.

## Features

- **Two recording modes** — separate sessions for your lowest and highest notes.
- **Live pitch detection** — see the current frequency and note while you sing.
- **Personal range** — view your best low, best high, and total span.
- **History** — every reading is logged by day with frequency and note name.
- **Local & private** — all data stays on your device (localStorage); nothing is
  sent to a server.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 7](https://vite.dev/) with [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/)
- [`pitchy`](https://www.npmjs.com/package/pitchy) for browser pitch detection
- [`lucide-react`](https://lucide.dev/) icons

## Getting started

```bash
npm install
npm run generate-icons
npm run dev
```

Open the printed local URL. For microphone access, use HTTPS or localhost. To test
installability, build and preview:

```bash
npm run build
npm run preview
```

## How to record

1. Choose **Low note** or **High note**.
2. Tap **Start** and allow microphone access.
3. Sing or hum a steady note for a few seconds.
4. Tap **Stop & save** — the extreme frequency for that session is stored.

Record low and high notes on separate sessions to build your full range.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (PWA enabled in dev). |
| `npm run build` | Type-check and build for production. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run generate-icons` | Regenerate PNG icons from the SVG sources. |

## License

Part of the [ubuntu-apps](https://github.com/ubuntu-apps) collection.
