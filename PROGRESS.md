# totoneru — Progress & Status

> This file is the single source of truth for current build state. Any AI agent or human can read this to understand exactly where the project is, what's done, and what's next. Update it at the end of every session.

---

## Current Status

**Phase:** Pre-Phase 0 — Setup  
**Stage:** Repository initialized, spec finalized, not yet building  
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
| 0 | Foundation | ⬜ Not started | — |
| 1 | Deck Parsing | ⬜ Not started | — |
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

## Phase 0 — Foundation (current target)

Sessions to complete (from PROJECT_SPEC.md §I.2):

- [ ] **S0.1 Scaffold** — Next.js 15 + TypeScript + Tailwind + ESLint + Prettier. Deploy to Vercel.
- [ ] **S0.2 Observability** — Sentry, PostHog (opt-in), GitHub Actions CI.
- [ ] **S0.3 Shell** — App layout, routing, basic navigation, dark mode.
- [ ] **S0.4 Docs** — README, CONTRIBUTING, LICENSE, initial CLAUDE.md for repo.

Phase 0 checklist (from PROJECT_SPEC.md §D):

- [ ] Scaffold Next.js 15 + TypeScript + Tailwind project
- [ ] Configure ESLint, Prettier, strict TS
- [ ] Set up GitHub repo with `main` branch protection
- [ ] Configure Vercel preview deployments on PRs
- [ ] Add Sentry integration
- [ ] Add PostHog (opt-in wrapper)
- [ ] Set up basic app shell (header, main content, footer)
- [ ] Write initial README (positioning, how it works, data flow)
- [ ] Create CONTRIBUTING.md

---

## Session Log

### 2026-04-24 — Pre-Phase-0 Setup

**Done:**
- PROJECT_SPEC.md written in full (Parts A–I)
- All pre-Phase-0 decisions resolved: name, license, adapter preference
- LICENSE file created
- GitHub repo initialized and pushed (public)
- PROGRESS.md created

**Decisions made:**
- OpenAI-compatible adapter featured first in onboarding; Anthropic is secondary
- Custom source-available license instead of MIT/Apache
- Domain purchase deferred

**Next session goal:** S0.1 — scaffold Next.js 15 app and deploy to Vercel

---

## Open Questions

- Color/typography direction for UI (Radix leaves this open — decide in Phase 0 shell)
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
| Styling | Tailwind CSS + Radix UI |
| `.apkg` parsing | jszip + sql.js (WASM) in Web Workers |
| Japanese tokenization | kuromoji.js (Web Worker, offline) |
| Client storage | IndexedDB via `idb` |
| AI calls | Direct browser → user's endpoint (no proxy) |
| Error tracking | Sentry |
| Analytics | PostHog (opt-in only) |
