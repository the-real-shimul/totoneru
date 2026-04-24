# agents.md — totoneru

This file is for any AI agent (Claude, Kimi, Cursor, OpenCode, etc.) working on this codebase. Read this before doing anything.

**Start here:** Check `PROGRESS.md` for current build state, completed sessions, and what to work on next. Check `PROJECT_SPEC.md` for the full product spec and architecture.

---

## Coding Guidelines

These apply to every agent, every session. They are non-negotiable.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan and verify each step before moving on.

---

## Project Non-Negotiables

These are architectural constraints. Never violate them — even if it seems convenient.

- **Client-side only.** No server storage of decks or API keys, ever.
- **Three layers.** Data / Behavior / Presentation. Transformations must not cross layer boundaries.
- **Transactional writes.** Never mutate the canonical deck until the user explicitly confirms.
- **Auto-backup on every import.** Always, no exceptions.
- **Dry-run before bulk apply.** Always, no exceptions.
- **No auth in MVP.**
- **Target Anki schema:** `collection.anki21b` only. Reject older versions with a clear error message.
- **No analytics without opt-in.** PostHog is wrapped in a consent banner — keep it that way.

---

## Tech Stack (do not suggest alternatives)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + Radix UI via shadcn/ui |
| `.apkg` parsing | jszip + sql.js (SQLite WASM) in Web Workers |
| Japanese tokenization | kuromoji.js (Web Worker, offline) |
| Client storage | IndexedDB via `idb` |
| AI calls | Direct browser → user's endpoint (no proxy) |
| Error tracking | Sentry (`@sentry/nextjs`) |
| Analytics | PostHog (`posthog-js`), opt-in only |
| Hosting | Vercel |

---

## File Map

| File | Purpose |
|---|---|
| `PROGRESS.md` | Current build state — read this to orient |
| `PROJECT_SPEC.md` | Full product spec, architecture, roadmap |
| `agents.md` | This file — coding rules for AI agents |
| `app/` | Next.js App Router pages and layouts |
| `components/` | React components (shadcn/ui in `components/ui/`) |
| `lib/` | Shared utilities |
| `hooks/` | Custom React hooks |
| `.env.local.example` | Required environment variables |
| `.github/workflows/ci.yml` | CI — type check, lint, build on every PR |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values before running locally.

```
NEXT_PUBLIC_SENTRY_DSN=       # from sentry.io
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=      # from posthog.com
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Before You Commit

- Run `npx tsc --noEmit` — must pass with zero errors.
- Run `npx eslint . --max-warnings 0` — must pass clean.
- Run `npm run build` — must succeed.
- Commit message format: `feat:` / `fix:` / `chore:` + one sentence.

---

## Model Routing Recommendation

| Task | Recommended model |
|---|---|
| Standard feature work | Sonnet 4.6 |
| Architecture decisions, hard bugs | Opus 4.7 |
| Phase 6 (batches) and Phase 7 (block editor) | Opus 4.7 |
| Read-only exploration | Haiku 4.5 |
| UI-heavy work | Kimi K2.6 or Sonnet 4.6 |

See `PROJECT_SPEC.md §I.3` for the full model routing table.


<claude-mem-context>
# Memory Context

# [totoneru] recent context, 2026-04-24 8:41pm GMT+9

No previous sessions found.
</claude-mem-context>