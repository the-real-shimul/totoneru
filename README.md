# totoneru

Totoneru is a local-first Anki deck transformation tool for Japanese learners. You import a deck, inspect and reshape it visually or with controlled AI prompts, dry-run the results, and export a clean `.apkg` back to Anki without sending your deck or API key through our server.

## Status

The project is in early implementation. Foundation work is complete, and the next build target is Phase 1 deck parsing.

- Current progress: [PROGRESS.md](/Users/shimul/Documents/Claude%20Playground/totoneru/PROGRESS.md)
- Full product and architecture spec: [PROJECT_SPEC.md](/Users/shimul/Documents/Claude%20Playground/totoneru/PROJECT_SPEC.md)
- AI-agent working rules: [agents.md](/Users/shimul/Documents/Claude%20Playground/totoneru/agents.md)

## Core promises

- Client-side only for deck data and API keys
- Automatic backup on every import
- Dry-run before bulk apply
- Transactional writes until the user confirms
- Clear separation between data, behavior, and presentation

## How it works

1. Import an Anki `.apkg` file in the browser.
2. Save the original package to IndexedDB as a local backup.
3. Parse the package client-side into notes, fields, note types, templates, and media.
4. Let the user map fields, choose a template, and preview transformations.
5. Stage all changes before commit so the canonical deck stays untouched until confirmation.
6. Export a transformed `.apkg` plus access to the original backup.

## Data flow

```text
Anki .apkg
  -> browser import
  -> local backup in IndexedDB
  -> client-side parsing in Web Workers
  -> preview and staged transformations
  -> optional direct API calls from browser to user-provided AI endpoint
  -> confirmed export back to .apkg
```

The app is designed so deck contents and API keys do not pass through a Totoneru-controlled backend.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui primitives
- `jszip` + `sql.js` for `.apkg` and SQLite parsing
- Web Workers for parsing and tokenization
- IndexedDB via `idb` for backups and local state
- Sentry for error reporting
- PostHog for opt-in analytics only

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.local.example` to `.env.local`.
3. Add whatever values you have available.

Sentry and PostHog credentials are optional for local work. The app can build without them.

## Available scripts

- `npm run dev` — start the local dev server
- `npm run typecheck` — run TypeScript without emitting files
- `npm run lint` — run ESLint
- `npm run build` — create a production build
- `npm run start` — serve the production build

## Environment variables

See [.env.local.example](/Users/shimul/Documents/Claude%20Playground/totoneru/.env.local.example).

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## Project rules that matter most

- No server storage of decks or API keys
- Support `collection.anki21b` only in MVP
- Never mutate the canonical deck until explicit confirmation
- Never skip automatic backup on import
- Never enable analytics without opt-in consent

## Next up

The next implementation target is Phase 1 deck parsing, starting with:

- `S1.1` `jszip` + `sql.js` setup
- lazy-loaded WASM
- basic unzip verification

## License

This project is released under the Totoneru Source License v1.0. See [LICENSE](/Users/shimul/Documents/Claude%20Playground/totoneru/LICENSE).
