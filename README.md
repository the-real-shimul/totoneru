# totoneru

> Transform your Anki deck in the browser. Local-first. Open source. Bring your own AI key.

[![CI](https://github.com/the-real-shimul/totoneru/actions/workflows/ci.yml/badge.svg)](https://github.com/the-real-shimul/totoneru/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)

**totoneru** is a visual transformation and controlled editing system for Anki decks, built for intermediate-to-advanced Japanese learners. Import any `.apkg`, reshape it with built-in transformations or custom AI prompts, preview the results side-by-side, and export a clean deck back to Anki — all without your data ever leaving your browser.

---

## What it does

- **Import** any Anki `.apkg` (`collection.anki21b` only)
- **Auto-backup** the original to your browser before anything else happens
- **Map fields** heuristically — expression, reading, meaning, sentence, translation, audio
- **Choose a template** — Vocabulary or Sentence layouts with structured preview
- **Transform** with built-in tools — furigana generation, HTML cleaner, field normalizer
- **Transform with AI** — run custom prompts against your own API key (OpenAI, Anthropic, Groq, OpenRouter, etc.)
- **Dry-run** on 5 sample cards before committing to the full deck
- **Stage changes** transactionally — abort, retry failed cards, or discard
- **Export** a verified `.apkg` with only the changed notes updated

## Core promises

- **Client-side only** — your deck and API key never touch our servers
- **Auto-backup on every import** — download the untouched original at any time
- **Dry-run before bulk apply** — see exactly what changes before committing
- **Transactional writes** — stage everything, confirm once, export cleanly
- **No account, no tracking without consent** — opt-in analytics only

## Quick start

Visit [totoneru.vercel.app](https://totoneru.vercel.app) (or your deployed URL) and drop an `.apkg` file. No signup required.

## How it works

```
User drops .apkg
    |
    v
[Auto-backup to IndexedDB]
    |
    v
[Web Worker: jszip + sql.js]
    |
    v
[Parse notes, fields, templates, media]
    |
    v
[Heuristic field role detection]
    |
    v
[User edits mappings + selects template]
    |
    v
[Preview: original vs transformed]
    |
    v
[Dry-run on 5 sample cards]
    |
    v
[User confirms dry-run]
    |
    v
[Bulk batch with per-card error isolation]
    |
    v
[Stage all changes in IndexedDB]
    |
    v
[User clicks Export]
    |
    v
[Re-open original SQLite from backup]
    |
    v
[UPDATE only changed notes]
    |
    v
[Re-zip with original media]
    |
    v
[Verify by re-opening exported DB]
    |
    v
[Download transformed.apkg]
```

## Built-in transformations

| Transformation | What it does |
|---|---|
| **Furigana generation** | Tokenizes Japanese with kuromoji.js and wraps kanji in `<ruby>` tags |
| **HTML cleaner** | Strips `<font>`, `<span>`, `<div>`, `<p>` tags and `style`/`class` attributes |
| **Field normalizer** | Normalizes `\r\n` to `\n`, collapses whitespace, trims ends |

## AI features

- Bring your own API key — stored in your browser's IndexedDB
- Supports any OpenAI-compatible endpoint plus native Anthropic
- Prompt library with 4 curated starters + custom prompt editor
- Cost estimation before running
- Per-card error isolation with exponential backoff on rate limits

## Tech stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui + Radix UI primitives
- **`.apkg` parsing:** jszip + sql.js (SQLite WASM) in Web Workers
- **Japanese tokenization:** kuromoji.js (Web Worker, offline)
- **Client storage:** IndexedDB via `idb`
- **AI calls:** Direct browser → user's endpoint (no proxy)
- **Error tracking:** Sentry (production only)
- **Analytics:** PostHog (opt-in only)

## Local development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Sentry / PostHog credentials (optional for local work)

# Start dev server
npm run dev
```

### Required checks before committing

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint . --max-warnings 0
npm run build       # next build
```

## Documentation

- [How it works](./app/how-it-works/page.tsx) — trust and data flow documentation
- [Prompt cookbook](./app/prompts/page.tsx) — curated AI prompts and writing guide
- [Keyboard shortcuts](./app/shortcuts/page.tsx) — accessibility reference
- [PROGRESS.md](./PROGRESS.md) — build state and session log
- [PROJECT_SPEC.md](./PROJECT_SPEC.md) — full product spec and architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) — contributor guidelines

## Roadmap

See [PROJECT_SPEC.md §E](./PROJECT_SPEC.md#part-e--future-features) for the full roadmap. Tier 1 candidates:

1. Advanced HTML/CSS editing layer
2. JMdict / Jisho API data enrichment
3. Deck analysis and optimization suggestions
4. SRS preset generator
5. Batch transformation workflows

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) first. The project is intentionally scoped — respect the architecture constraints and keep changes surgical.

## License

Apache 2.0. See [LICENSE](./LICENSE).
