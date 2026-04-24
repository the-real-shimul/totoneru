# totoneru — Progress & Status

> This file is the single source of truth for current build state. Any AI agent or human can read this to understand exactly where the project is, what's done, and what's next. Update it at the end of every session.

---

## Current Status

**Phase:** 1 — Deck Parsing  
**Next session target:** S1.2 — SQLite reader (notes, fields, note types)  
**Last updated:** 2026-04-24

---

## Key Decisions (locked)

| Decision | Chosen | Notes |
|---|---|---|
| Project name | totoneru | — |
| License | Totoneru Source License v1.0 | Source-available, personal non-commercial use only |
| Framework | Next.js 15 + TypeScript + Tailwind | See B.2 in PROJECT_SPEC.md |
| Primary AI adapter | OpenAI-compatible | Anthropic adapter as secondary option |
| Hosting | Vercel free tier | — |
| Domain | TBD | Buying later |
| Auth in MVP | None | Explicitly out of scope |
| Mobile support | Deferred post-MVP | Desktop browsers only |

---

## Phase Completion

| Phase | Name | Status | Notes |
|---|---|---|---|
| Pre-0 | Setup & decisions | ✅ Done | Spec written, decisions locked, repo created |
| 0 | Foundation | ✅ Done | S0.1–S0.4 complete |
| 1 | Deck Parsing | 🔄 In progress | S1.1 complete, S1.2 next |
| 2 | Preview & Rendering | ⬜ Not started | — |
| 3 | Schema Mapping & Templates | ⬜ Not started | — |
| 4 | Built-In Transformations | ⬜ Not started | — |
| 5 | AI Integration | ⬜ Not started | — |
| 6 | Dry-Run & Transactional Batches | ⬜ Not started | — |
| 7 | Block Editor & Behavior Controls | ⬜ Not started | — |
| 8 | Export & Finalization | ⬜ Not started | — |
| 9 | Polish & Trust | ⬜ Not started | — |
| 10 | Public Launch | ⬜ Not started | — |

---

## Phase 0 — Foundation (current)

| Session | Goal | Status | Notes |
|---|---|---|---|
| S0.1 | Scaffold Next.js 15 + shadcn + deploy to Vercel | ✅ Done | shadcn preset `b3ES8mGIfA`, Space Grotesk + JetBrains Mono fonts, fixed circular font var bug in globals.css |
| S0.2 | Sentry, PostHog (opt-in), GitHub Actions CI | ✅ Done | See notes below |
| S0.3 | App shell — header, nav, dark mode toggle in UI | ✅ Done | Starter page replaced with shell scaffold, visible theme toggle added, lint blockers cleaned up |
| S0.4 | README, CONTRIBUTING, repo CLAUDE.md | ✅ Done | Docs now describe setup, workflow, architecture, and agent handoff |

## Phase 1 — Deck Parsing (current)

| Session | Goal | Status | Notes |
|---|---|---|---|
| S1.1 | `jszip` + `sql.js` setup | ✅ Done | Local WASM asset added, browser-side `.apkg` unzip probe built, SQLite schema inspection verified |
| S1.2 | SQLite reader — extract notes, fields, note types | ⬜ Next | — |

### S1.1 implementation notes

- **Dependencies:** `jszip`, `sql.js`, and `@types/sql.js` added.
- **Local WASM:** `public/sql-wasm.wasm` copied into the app so SQLite boots fully client-side without remote fetches.
- **Import probe:** `components/apkg-import-probe.tsx` added and wired into `app/page.tsx`; it accepts an `.apkg`, opens the zip in-browser, finds `collection.anki21b`, initializes `sql.js` lazily, and lists SQLite tables as a proof that parsing can start client-side.

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
- [ ] Enable Vercel preview deployments on PRs (link repo in Vercel dashboard)
- [ ] Set `main` branch protection rule on GitHub (require CI to pass)

---

## Phase 0 Checklist (from PROJECT_SPEC.md §D)

- [x] Scaffold Next.js 15 + TypeScript + Tailwind project
- [x] Configure ESLint, Prettier, strict TS
- [ ] Set up GitHub repo with `main` branch protection ← needs human action
- [ ] Configure Vercel preview deployments on PRs ← needs human action
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
- S0.1: Next.js 15 scaffolded with shadcn preset `b3ES8mGIfA`, font circular-reference bug fixed, pushed
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

**Next session goal:** S1.2 — SQLite reader for notes, fields, and note types

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
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + Radix UI via shadcn/ui |
| `.apkg` parsing | jszip + sql.js (WASM) in Web Workers |
| Japanese tokenization | kuromoji.js (Web Worker, offline) |
| Client storage | IndexedDB via `idb` |
| AI calls | Direct browser → user's endpoint (no proxy) |
| Error tracking | Sentry |
| Analytics | PostHog (opt-in only) |
