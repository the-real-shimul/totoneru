# totoneru — Progress & Status

> This file is the single source of truth for current build state. Any AI agent or human can read this to understand exactly where the project is, what's done, and what's next. Update it at the end of every session.

---

## Current Status

**Phase:** 3 — Schema Mapping & Templates  
**Next session target:** S3.3 — Template definitions  
**Last updated:** 2026-04-25

---

## Key Decisions (locked)

| Decision | Chosen | Notes |
|---|---|---|
| Project name | totoneru | — |
| License | Totoneru Source License v1.0 | Source-available, personal non-commercial use only |
| Framework | Next.js 16 + TypeScript + Tailwind | See B.2 in PROJECT_SPEC.md |
| Primary AI adapter | OpenAI-compatible | Anthropic adapter as secondary option |
| Hosting | Vercel free tier | — |
| Domain | TBD | Buying later |
| Auth in MVP | None | Explicitly out of scope |
| Mobile support | Deferred post-MVP | Desktop browsers only |
| Git workflow | Direct push to `main` allowed | Keep CI checks and lightweight branch protection; PRs are optional |

---

## Phase Completion

| Phase | Name | Status | Notes |
|---|---|---|---|
| Pre-0 | Setup & decisions | ✅ Done | Spec written, decisions locked, repo created |
| 0 | Foundation | ✅ Done | S0.1–S0.4 complete |
| 1 | Deck Parsing | ✅ Done | S1.1–S1.5 complete |
| 2 | Preview & Rendering | ✅ Done | S2.1–S2.4 complete |
| 3 | Schema Mapping & Templates | 🟨 In progress | S3.1–S3.2 complete; S3.3 is next |
| 4 | Built-In Transformations | ⬜ Not started | — |
| 5 | AI Integration | ⬜ Not started | — |
| 6 | Dry-Run & Transactional Batches | ⬜ Not started | — |
| 7 | Block Editor & Behavior Controls | ⬜ Not started | — |
| 8 | Export & Finalization | ⬜ Not started | — |
| 9 | Polish & Trust | ⬜ Not started | — |
| 10 | Public Launch | ⬜ Not started | — |

---

## Phase 0 — Foundation

| Session | Goal | Status | Notes |
|---|---|---|---|
| S0.1 | Scaffold Next.js 16 + shadcn + deploy to Vercel | ✅ Done | shadcn preset `b3ES8mGIfA`, Space Grotesk + JetBrains Mono fonts, fixed circular font var bug in globals.css |
| S0.2 | Sentry, PostHog (opt-in), GitHub Actions CI | ✅ Done | See notes below |
| S0.3 | App shell — header, nav, dark mode toggle in UI | ✅ Done | Starter page replaced with shell scaffold, visible theme toggle added, lint blockers cleaned up |
| S0.4 | README, CONTRIBUTING, repo CLAUDE.md | ✅ Done | Docs now describe setup, workflow, architecture, and agent handoff |

## Phase 1 — Deck Parsing (current)

| Session | Goal | Status | Notes |
|---|---|---|---|
| S1.1 | `jszip` + `sql.js` setup | ✅ Done | Local WASM asset added, browser-side `.apkg` unzip probe built, SQLite schema inspection verified |
| S1.2 | SQLite reader — extract notes, fields, note types | ✅ Done | Import probe now reads note rows, note type metadata, field names, and sample field values from `collection.anki21b` |
| S1.3 | Templates + media parsing | ✅ Done | Parser extracts card template names/formats from note types and parses Anki media manifest entries |
| S1.4 | Schema detection | ✅ Done | Parser accepts `collection.anki21b` only and rejects older `collection.anki2` / `collection.anki21` packages with a clear error |
| S1.5 | Web Worker migration + auto-backup | ✅ Done | APKG parsing moved to a Web Worker; original package is saved to IndexedDB before parsing |

## Phase 2 — Preview & Rendering (current)

| Session | Goal | Status | Notes |
|---|---|---|---|
| S2.1 | Card browser | ✅ Done | Import result now includes up to 50 sample notes and a selectable browser with previous/next controls |
| S2.2 | Card renderer | ✅ Done | Selected sample note renders front/back card faces in sandboxed iframes using basic Anki field interpolation |
| S2.3 | Split-pane preview | ✅ Done | Selected card now shows original and transformed preview panes side by side |
| S2.4 | Diff highlighting | ✅ Done | Preview includes a field-level before/after diff summary for the current preview transform |

## Phase 3 — Schema Mapping & Templates (current)

| Session | Goal | Status | Notes |
|---|---|---|---|
| S3.1 | Heuristic field role detection | ✅ Done | Added role detection by field name + sample content and surfaced confidence indicators in the import result |
| S3.2 | Mapping UI | ✅ Done | Suggested field roles are now editable per field |
| S3.3 | Template definitions | ⬜ Not started | Define Vocabulary and Sentence template types |
| S3.4 | Apply mappings | ⬜ Not started | Wire mappings into the internal representation |

### S1.1 implementation notes

- **Dependencies:** `jszip`, `sql.js`, and `@types/sql.js` added.
- **Local WASM:** `public/sql-wasm.wasm` copied into the app so SQLite boots fully client-side without remote fetches.
- **Import probe:** `components/apkg-import-probe.tsx` added and wired into `app/page.tsx`; it accepts an `.apkg`, opens the zip in-browser, finds `collection.anki21b`, initializes `sql.js` lazily, and lists SQLite tables as a proof that parsing can start client-side.

### S1.2 implementation notes

- **SQLite reader:** `components/apkg-import-probe.tsx` now reads from `notes` and `col`, parses note type metadata from the `models` JSON, and splits note field values using Anki's field separator.
- **Visible proof:** the import probe now shows note count, note type count, aggregate field count, note type definitions, and sample notes with field labels.

### S1.3-S1.5 implementation notes

- **Templates:** `workers/apkg-parser.worker.ts` extracts card template names plus front/back formats from Anki's note type model JSON.
- **Media:** the worker parses the APKG `media` manifest and returns a media count plus sample archive-name mappings.
- **Schema gate:** import accepts `collection.anki21b` only; older collection files are rejected with an explicit unsupported-schema error.
- **Worker parsing:** the UI now sends the deck buffer to `workers/apkg-parser.worker.ts` so zip and SQLite work happen off the main thread.
- **Auto-backup:** `lib/deck-backups.ts` saves the original `.apkg` to IndexedDB before the parser runs.

### S2.1-S2.2 implementation notes

- **Card browser:** `components/apkg-import-probe.tsx` now lets users select from parsed sample notes and move through them with previous/next controls.
- **Renderer:** `lib/anki-template-renderer.ts` added for initial Anki template interpolation; selected card front/back render in sandboxed iframes.
- **Scope note:** current rendering is intentionally basic field interpolation. Full Anki template parity and original/transformed split preview are next-phase work.

### S2.3-S2.4 implementation notes

- **Split preview:** selected sample cards now render original and transformed preview panes side by side.
- **Preview transform:** transformed preview currently applies a non-destructive field normalization pass to copied note data.
- **Diff summary:** changed fields are shown with before/after values so users can see exactly what the preview transform changed.

### S2 compatibility notes

- **Modern `.apkg` support:** parser now handles Zstandard-compressed `collection.anki21b` / `media` entries using pure-JS `fzstd`.
- **Normalized Anki schema:** parser supports newer `notetypes`, `fields`, and `templates` tables when `col.models` is empty.
- **Worker WASM paths:** SQLite WASM is resolved from the worker origin to avoid invalid relative URLs.
- **Real deck validation:** `Nihongo So-matome N2.apkg` parses locally with 56 notes, 56 cards, and the `Japanese So-Matome` note type.

### S3.1 implementation notes

- **Role detector:** `lib/schema-mapping.ts` added with heuristic field role detection for expression, reading, meaning, sentence, sentence reading, translation, and audio.
- **Content heuristics:** suggestions combine field-name matches with sample content checks for Japanese, kana-heavy text, Latin text, text length, and Anki sound markers.
- **Confidence UI:** import results now show suggested mappings and high/medium/low confidence badges per field.

### S3.2 implementation notes

- **Editable mapping:** suggested field roles can now be changed per field from the import result UI.
- **Mapping state:** field role selections are stored in React state keyed by note type and field name.
- **Scope note:** drag-and-drop ordering is still deferred; S3.2 currently covers editable role assignment and confidence display.

### S0.4 implementation notes

- **README:** replaced the template placeholder with project positioning, local-first architecture summary, setup instructions, and data flow.
- **CONTRIBUTING:** added contributor setup, required checks, workflow expectations, and architectural guardrails.
- **CLAUDE.md:** added a short Claude-specific repo entry point that directs agents to the canonical project docs and the next session target.

### S0.2 implementation notes

- **Sentry:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` created. Production-only capture. Reads `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` from env. `next.config.mjs` wrapped with `withSentryConfig`.
- **PostHog:** `components/analytics-provider.tsx` — consent banner on first visit, stores choice in localStorage under `totoneru_analytics_consent`, only inits PostHog if user accepts AND `NODE_ENV === "production"`. Wrapped around children in `app/layout.tsx`.
- **CI:** `.github/workflows/ci.yml` — runs `tsc --noEmit`, `eslint`, `npm run build` on push/PR to `main`. Secrets needed: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.

### S0.3 implementation notes

- **App shell:** `app/page.tsx` now provides the initial marketing/workspace shell with header, workflow nav pills, hero area, staged workflow sidebar, and footer.
- **Theme control:** `components/theme-toggle.tsx` added for a visible dark mode toggle in the header. Existing `d` keyboard shortcut remains available via `components/theme-provider.tsx`.
- **Foundation cleanup:** `components/analytics-provider.tsx` consent initialization changed to a lazy state initializer to satisfy lint rules; `app/layout.tsx` unused import removed and body-level shell classes added.

### Pending setup (needs human action)

- [x] Create Sentry project at sentry.io → grab DSN → add to Vercel env vars + GitHub secrets
- [x] Create PostHog project at posthog.com → grab key → add to Vercel env vars + GitHub secrets
- [x] Add `SENTRY_AUTH_TOKEN` to Vercel env vars (for source map uploads on build)
- [x] Enable Vercel preview deployments on PRs (link repo in Vercel dashboard)
- [x] Set `main` branch protection rule on GitHub (require CI to pass)

---

## Phase 0 Checklist (from PROJECT_SPEC.md §D)

- [x] Scaffold Next.js 16 + TypeScript + Tailwind project
- [x] Configure ESLint, Prettier, strict TS
- [x] Set up GitHub repo with `main` branch protection
- [x] Configure Vercel preview deployments on PRs
- [x] Add Sentry integration
- [x] Add PostHog (opt-in wrapper)
- [x] Set up basic app shell (header, main content, footer)
- [x] Write initial README (positioning, how it works, data flow)
- [x] Create CONTRIBUTING.md

---

## Session Log

### 2026-04-24 — Pre-Phase-0 + S0.1 + S0.2

**Done:**
- PROJECT_SPEC.md written in full (Parts A–I)
- All pre-Phase-0 decisions resolved: name, license, adapter preference
- LICENSE file created (Totoneru Source License v1.0)
- GitHub repo initialized and pushed: https://github.com/the-real-shimul/totoneru
- PROGRESS.md and agents.md created
- S0.1: Next.js 16 scaffolded with shadcn preset `b3ES8mGIfA`, font circular-reference bug fixed, pushed
- S0.2: Sentry + PostHog opt-in + GitHub Actions CI wired up, pushed

**Decisions made this session:**
- OpenAI-compatible adapter featured first in onboarding; Anthropic is secondary
- Custom source-available license instead of MIT/Apache
- Domain purchase deferred
- PostHog consent stored in localStorage (not cookies) — simpler, no cookie banner law risk for MVP

### 2026-04-24 — S0.3 + S0.4

**Done:**
- S0.3: app shell built with header, workflow shell, footer, and visible theme toggle
- Local fonts moved to `next/font/local` so the app builds offline without Google font fetches
- S0.4: `README.md`, `CONTRIBUTING.md`, and `CLAUDE.md` added and aligned with the spec

**Next session goal:** S1.1 — `jszip` + `sql.js` setup

### 2026-04-24 — S1.1

**Done:**
- Installed `jszip` and `sql.js` for browser-side `.apkg` inspection
- Added a local `sql.js` WASM asset so SQLite can initialize without external fetches
- Built an import probe UI that verifies unzip + `collection.anki21b` discovery + SQLite schema access in the browser
- Verified `typecheck`, `eslint`, and `build` all pass
- Enabled Vercel preview deployments and lightweight `main` branch protection, then adjusted the workflow back to allow direct pushes to `main` while keeping CI

### 2026-04-24 — S1.2

**Done:**
- Extended the import probe to read actual notes from SQLite instead of only listing tables
- Parsed note type metadata from `col.models`
- Mapped sample note rows into labeled field values for browser-side inspection
- Verified `typecheck` and `eslint` pass cleanly

**Next session goal:** S1.3 — templates and media parsing

### 2026-04-24 — S1.3 + S1.4 + S1.5

**Done:**
- Parsed card template metadata from Anki note types
- Parsed the APKG media manifest and displayed media stats/samples
- Added strict `collection.anki21b` schema detection with clear rejection for older collection files
- Moved APKG parsing into `workers/apkg-parser.worker.ts`
- Added original `.apkg` backup storage in IndexedDB before parsing
- Verified `typecheck`, `eslint`, and `build` all pass

**Next session goal:** Phase 2 — preview and rendering

### 2026-04-24 — S2.1 + S2.2

**Done:**
- Added a selectable card browser for parsed sample notes
- Increased parsed sample notes to 50 for more useful browsing
- Added initial Anki template interpolation helper
- Rendered selected card front/back faces in sandboxed iframes
- Verified `typecheck` and `eslint` pass; browser render is clean

**Next session goal:** S2.3 — split-pane original-vs-transformed preview

### 2026-04-25 — S2.3 + S2.4

**Done:**
- Added original-vs-transformed preview panes for the selected sample card
- Added a non-destructive preview transform that normalizes copied field values
- Added field-level before/after diff summary
- Verified `eslint` passes and browser render is clean

**Next session goal:** S3.3 — template definitions

---

## Open Questions

- Color/typography direction for UI (Radix leaves this open — decide in S0.3 shell)
- Whether to ship a "how to contribute a prompt" template in Phase 5 or later
- Discord vs GitHub Discussions only for community (decide at launch)

---

## Architecture Quick Reference

For full details see `PROJECT_SPEC.md`. Key constraints any agent must respect:

- **Client-side only.** No server storage of decks or API keys, ever.
- **Three layers.** Data / Behavior / Presentation. Transformations must not cross layer boundaries.
- **Transactional writes.** Never mutate the canonical deck until the user explicitly confirms.
- **Auto-backup on every import.** Non-negotiable.
- **Dry-run before bulk apply.** Non-negotiable.
- **No auth in MVP.**
- **Target schema:** `collection.anki21b` only. Reject older with a clear error.

## Tech Stack Quick Reference

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + Radix UI via shadcn/ui |
| `.apkg` parsing | jszip + sql.js (WASM) in Web Workers |
| Japanese tokenization | kuromoji.js (Web Worker, offline) |
| Client storage | IndexedDB via `idb` |
| AI calls | Direct browser → user's endpoint (no proxy) |
| Error tracking | Sentry |
| Analytics | PostHog (opt-in only) |
