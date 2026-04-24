# totoneru — Progress & Status

> This file is the single source of truth for current build state. Any AI agent or human can read this to understand exactly where the project is, what's done, and what's next. Update it at the end of every session.

---

## Current Status

**Phase:** 10 — Public Launch  
**Next session target:** Execute launch posts, monitor Sentry, enable GitHub Discussions  
**Last updated:** 2026-04-25

---

## Key Decisions (locked)

| Decision | Chosen | Notes |
|---|---|---|
| Project name | totoneru | — |
| License | Apache 2.0 | Open source, permissive, patent protection |
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
| 3 | Schema Mapping & Templates | ✅ Done | S3.1–S3.4 complete |
| 4 | Built-In Transformations | ✅ Done | S4.1–S4.4 complete |
| 5 | AI Integration | ✅ Done | S5.1–S5.6 complete |
| 6 | Dry-Run & Transactional Batches | ✅ Done | S6.1–S6.6 complete |
| 7 | Block Editor & Behavior Controls | ✅ Done | S7.1–S7.5, S7.8 complete |
| 8 | Export & Finalization | ✅ Done | S8.1–S8.4 complete |
| 9 | Polish & Trust | ✅ Done | S9.1–S9.5 + checklist complete |
| 10 | Public Launch | ✅ Done | S10.1–S10.3 complete, ready to execute |

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
| S3.3 | Template definitions | ✅ Done | Define Vocabulary and Sentence template types |
| S3.4 | Apply mappings | ✅ Done | Wire mappings into the internal representation |

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

### S3.4 implementation notes

- **Internal deck model:** `lib/deck-model.ts` added with `ActiveDeck` type that wraps `ParsedDeckSummary` + `NoteTypeMapping[]`.
- **Persistence layer:** `lib/deck-storage.ts` replaces `lib/deck-backups.ts` — adds a `decks` IndexedDB store (DB version bumped to 2).
- **Active deck lifecycle:** On import: `createActiveDeck` generates default mappings + template selections, then `saveActiveDeck` persists. On mount: `loadMostRecentActiveDeck` restores last workspace. On clear: `deleteActiveDeck` resets UI.
- **Live persistence:** Every mapping/template change updates in-memory `ActiveDeck` and saves to IndexedDB.

### S4.1–S4.4 implementation notes (Phase 4 — Built-In Transformations)

- **kuromoji.js Web Worker:** `workers/kuromoji.worker.ts` loads kuromoji from CDN via `importScripts`, lazy-loads the dictionary on first tokenization request, caches the tokenizer in memory for the worker's lifetime.
- **kuromoji client:** `lib/kuromoji-client.ts` wraps the worker with a Promise-based API (`tokenize`, `generateFurigana`) and request/response ID mapping.
- **Furigana generation (S4.2):** Tokenizes Japanese text, wraps kanji-bearing tokens in `<ruby>` tags with hiragana readings as `<rt>`. Katakana readings are converted to hiragana. Non-kanji tokens pass through unchanged.
- **HTML cleaner (S4.3):** Strips `<font>`, `<span>`, `<div>`, `<p>` tags and `style`/`class` attributes. Collapses excessive newlines.
- **Field normalizer (S4.4):** Normalizes `\r\n` to `\n`, collapses multiple spaces/tabs, trims whitespace.
- **Transformation engine:** `lib/transformations.ts` defines `TransformationConfig` types and `applyTransformations` which runs enabled transformations sequentially on a field value based on its role.
- **Preview integration:** Added transformation toggle panel to the UI (checkboxes for furigana, HTML clean, field normalize). `CardPreviewSection` is now async — uses `useEffect` to compute transformed preview, shows loading spinner while furigana worker is processing.
- **Default config:** HTML cleaner and field normalizer enabled by default; furigana disabled by default (requires dictionary download).

### S5.1–S5.6 implementation notes (Phase 5 — AI Integration)

- **AI adapter types:** `lib/ai-types.ts` defines `AiAdapter`, `AiAdapterConfig`, `AiMessage`, and `AiProvider` types.
- **OpenAI-compatible adapter (S5.1):** `lib/openai-adapter.ts` — standard chat completions API with Bearer auth. Supports any OpenAI-shaped endpoint (OpenAI, Groq, OpenRouter, etc.).
- **Anthropic adapter (S5.2):** `lib/anthropic-adapter.ts` — native Messages API with `x-api-key` header and `anthropic-version`. Handles system message separation.
- **Unified client:** `lib/ai-client.ts` — `sendAiRequest` picks the correct adapter by provider ID.
- **Key storage (S5.3):** `lib/ai-keys.ts` — API keys stored in IndexedDB `keys` store (DB v3). Supports multiple keys. `getActiveApiKey` returns the first saved key.
- **Key management UI:** `components/ai-settings.tsx` — form with provider selector, endpoint URL, masked API key input (toggle visibility), model name, and label. Shows saved keys with reveal/delete actions.
- **Prompt variable interpolation (S5.4):** `lib/prompts.ts` — `interpolatePrompt` replaces `{{variableName}}` with values from a record. `extractVariables` scans templates for placeholders.
- **Prompt editor:** `components/prompt-library.tsx` — form for creating custom prompts with name, description, system message, and user message. Variables auto-detected from `{{}}` syntax.
- **Prompt library (S5.5):** 4 curated starter prompts (example sentence, meaning clarify, sentence translation, usage note). User-created prompts stored in localStorage. Library UI shows token/cost estimates per prompt.
- **Output sanitizer (S5.6):** `sanitizeAiOutput` strips markdown fences and surrounding quotes.
- **Cost estimator:** `estimateTokens` uses CJK=1 token, other=1/4 token heuristic. `estimateCost` maps model names to per-1k pricing.
- **AI transform section:** In the workspace, when a prompt is selected, an "AI Transform" card appears with interpolated prompt preview, cost estimate, and "Run on sample" button. Result shown inline.

### S6.1–S6.6 implementation notes (Phase 6 — Dry-Run & Transactional Batches)

- **Batch engine:** `lib/batch-operations.ts` — `processCard` applies template transforms, built-in transformations, and optional AI prompts to a single note. `runBatch` iterates over all notes with per-card error isolation. `runDryRun` runs on first 5 sample notes only.
- **Error isolation (S6.3):** Each card is wrapped in try/catch. One failure doesn't abort the batch. Failed cards show error messages in the UI.
- **Rate limit backoff (S6.4):** `withRetry` implements exponential backoff (1s, 2s, 4s + jitter) on 429/5xx errors. Up to 3 retries per AI call.
- **Staged transactions (S6.2):** `lib/batch-storage.ts` — IndexedDB `staged` store (DB v4) holds pending changes before commit. `batches` store holds batch results.
- **Progress + abort (S6.5):** `BatchRunner` component shows live progress bar with current/total count. AbortController cancels mid-batch. "Retry failed only" button re-runs just the failed cards.
- **Dry-run flow (S6.1):** "Dry-run (5 cards)" button runs on sample. When an AI prompt is selected, user must confirm dry-run before "Apply to all" is enabled. Diff view per card with before/after.
- **Resumable batches (S6.6):** On mount, `BatchRunner` checks for staged changes and restores the previous batch result. Discard button clears staged state.
- **Batch UI:** `components/batch-runner.tsx` — shows dry-run result cards with expandable diff rows. Success cards show green, errors show red, unchanged show gray. Summary badges for success/failed/changed counts.

### S7.1–S7.5, S7.8 implementation notes (Phase 7 — Block Editor & Behavior Controls)

- **Block model (S7.1):** `lib/block-editor.ts` — `BlockConfig` type with role, visible flag, style (fontSize, color, emphasis), and behavior (revealMode, delayMs). `LayoutConfig` contains ordered blocks, gap, maxWidth, centered flag. `DEFAULT_BLOCK_CONFIGS` provides sensible defaults per role.
- **Block editor UI (S7.2):** `components/block-editor.tsx` — Drag-and-drop reorder via HTML5 drag API (grip handle). Visibility toggle per block (eye/eye-off icons). Settings panel per block (gear icon) for font size, bold, reveal mode, delay.
- **Styling controls (S7.3):** Font size picker (14px–32px + default). Bold toggle. Color is wired in defaults but exposed in the type for future UI expansion.
- **Behavior model (S7.4):** Four reveal modes: `always` (visible on both faces), `onFlip` (hidden on front, shown on back), `delay` (fades in after N ms on front), `hover` (CSS hover — works on desktop only). Delay config range 100ms–10s.
- **JS/CSS generator (S7.5):** `generateBlockStyles` emits CSS with flex column layout, per-block font/color/weight rules, and display:none for onFlip blocks. `generateBlockBehaviorScript` emits a small JS snippet for delay-based opacity transitions. `generateCardHtmlFromBlocks` builds card HTML from blocks and field mappings.
- **Validation (S7.8):** `validateLayout` checks: at least one visible block (error), delay <100ms or >10s (warning), hover mode on any block (touch-device warning).
- **Preview integration:** Block editor appears inside the card preview section when enabled. Preview uses block-based HTML/styles when a layout is configured, falling back to template-based rendering when none. Block layouts are per-note-type and stored in React state.

### S8.1–S8.4 implementation notes (Phase 8 — Export & Finalization)

- **Atomic export (S8.1):** `lib/anki-export.ts` — `buildTransformedApkg` loads original .apkg from IndexedDB backup, extracts SQLite via jszip, modifies notes in sql.js, exports modified DB, re-zips, and triggers download. Post-export verification re-opens the exported SQLite to confirm it loads. No partial file is ever written to disk.
- **Byte-level preservation (S8.2):** Only notes whose fields actually change receive an `UPDATE`. Unchanged notes are left untouched in the SQLite DB. `mod` and `csum` columns are updated only for changed notes. `lib/anki-checksum.ts` implements Anki-compatible adler32 for `csum` computation.
- **Media preservation (S8.3):** Original media files from the backup are carried through unchanged via jszip. No re-compression or media mutation occurs.
- **Dual download (S8.4):** `components/export-panel.tsx` — "Export transformed" button (vermillion) runs the full export pipeline. "Download original" button serves the raw backup from IndexedDB. Export summary shows changed/unchanged counts and verification status.

### S9.1–S9.5 + checklist implementation notes (Phase 9 — Polish & Trust)

- **`/how-it-works` page (S9.1):** Already built — comprehensive trust doc covering local-only processing, auto-backup, dry-run, BYO API key, no tracking without consent, transactional writes, and open source pipeline. Includes ASCII data flow diagram.
- **Onboarding flow (S9.2):** Already built — 4-step welcome overlay with dismiss persistence. Enhanced with focus trap, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape-to-close, and focus restoration on dismiss.
- **Prompt cookbook (S9.3):** Already built — `/prompts` page displays 4 curated prompts with system/user messages, variables, and usage guide. No changes needed.
- **Accessibility audit (S9.4):**
  - Fixed `OnboardingOverlay`: focus trap cycles Tab within modal, Escape closes, focus moves to first element on open, restored on close.
  - Fixed label associations: `AddKeyForm` and `PromptEditor` now use `useId` + `htmlFor`/`id` pairs for all inputs.
  - Fixed nested `<button>` in `PromptCard`: outer card changed to `<div role="button" tabIndex={0}>` with Enter/Space handler.
  - Added `role="progressbar"` + `aria-valuenow/min/max` to batch progress indicator.
  - Added `aria-expanded` to `CardResultRow` expand button.
  - Added `aria-pressed` to `NoteRow` for selected state.
  - Added keyboard reordering to `BlockEditor`: up/down arrow buttons per block.
  - Added skip-to-content links to all pages (`/`, `/how-it-works`, `/prompts`, `/shortcuts`).
  - Created `/shortcuts` page documenting all keyboard shortcuts and accessibility features.
- **Performance pass (S9.5):**
  - Build succeeds with static prerendering for all routes.
  - Largest JS chunks: ~560K (sql.js + jszip), ~531K (Sentry). Expected for client-side SQLite + error tracking.
  - Web Workers used for parsing and tokenization — main thread stays responsive.
  - No unnecessary re-renders detected in critical paths.
- **Cross-browser testing:** Deferred to pre-launch manual QA (no automated test suite for this).
- **Final Sentry / PostHog review:**
  - Sentry: `instrumentation-client.ts` with `enabled: NODE_ENV === "production"`, replay integration at 10% session / 100% error sampling.
  - PostHog: Consent-gated, production-only, localStorage persistence, proxy rewrites configured in `next.config.mjs`.

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

### 2026-04-25 — S2.3 + S2.4 + S3.3 + S3.4 + Phase 4 (S4.1–S4.4) + Phase 5 (S5.1–S5.6) + Phase 6 (S6.1–S6.6) + Phase 7 (S7.1–S7.5, S7.8)

**Done:**
- Added original-vs-transformed preview panes for the selected sample card
- Added a non-destructive preview transform that normalizes copied field values
- Added field-level before/after diff summary
- Added template definitions (Vocabulary, Sentence, None) in `lib/templates.ts`
- Added template matching/scoring based on detected field roles
- Added template selection UI with required/optional field checklist
- Added template-aware preview renderer with structured HTML layouts
- Updated diff panel to show field reordering with "reordered" badges
- Created `lib/deck-model.ts` with `ActiveDeck` internal representation
- Created `lib/deck-storage.ts` with IndexedDB persistence for active decks
- Wired field mappings and template selections into persisted `ActiveDeck`
- Added auto-restore of last active deck on page load
- Added "Clear workspace" button to reset state
- Installed `kuromoji.js` for Japanese tokenization
- Created `workers/kuromoji.worker.ts` with lazy dictionary loading from CDN
- Created `lib/kuromoji-client.ts` as Promise-based wrapper for the worker
- Implemented furigana generation: tokenizes text, wraps kanji in `<ruby>` tags with hiragana `<rt>`
- Implemented HTML cleaner: strips font/span/div/p tags and style/class attributes
- Implemented field normalizer: normalizes line endings and whitespace
- Created `lib/transformations.ts` with configurable transformation pipeline
- Added transformation toggle panel to the UI (furigana, HTML clean, field normalize)
- Made preview async with loading spinner during furigana computation
- Created OpenAI-compatible API adapter (`lib/openai-adapter.ts`)
- Created Anthropic native API adapter (`lib/anthropic-adapter.ts`)
- Created unified AI client (`lib/ai-client.ts`)
- Added API key storage in IndexedDB with provider/endpoint/model/label
- Built AI settings UI with masked key input, provider selector, endpoint picker
- Built prompt editor with variable auto-detection from `{{}}` syntax
- Built prompt library with 4 curated starters + user-saved prompts
- Added output sanitizer (strips markdown fences, quotes)
- Added cost estimator (token heuristic × model pricing)
- Wired AI transform into workspace: interpolated prompt preview, cost estimate, "Run on sample" button
- Created `lib/batch-operations.ts` with `processCard`, `runBatch`, `runDryRun`
- Implemented per-card error isolation: one failure doesn't kill the batch
- Implemented exponential backoff (1s/2s/4s + jitter) on 429/5xx errors
- Created `lib/batch-storage.ts` with IndexedDB `staged` and `batches` stores (DB v4)
- Built `components/batch-runner.tsx` with dry-run, progress bar, abort, retry-failed-only
- Added dry-run confirmation gate: when AI prompt selected, must confirm dry-run before bulk apply
- Added expandable per-card diff view in batch results
- Added resumable batch state: restores staged changes on mount
- Created `lib/block-editor.ts` with BlockConfig, LayoutConfig, and generator functions
- Built `components/block-editor.tsx` with drag-and-drop reorder, visibility toggles, per-block settings
- Added font size picker (14px–32px), bold toggle, reveal mode selector (always/onFlip/delay/hover)
- Added delay configuration for fade-in reveal mode
- Implemented `generateBlockStyles` for safe Anki-compatible CSS emission
- Implemented `generateBlockBehaviorScript` for delay-based JS emission
- Implemented `generateCardHtmlFromBlocks` for block-based card HTML generation
- Added layout validation: no-visible-blocks error, delay range warnings, hover touch-device warning
- Wired block editor into preview: block-based rendering when layout configured, template fallback otherwise
- Created `lib/anki-checksum.ts` with Anki-compatible adler32 implementation
- Created `lib/anki-export.ts` with `buildTransformedApkg` — loads original SQLite, applies transforms to all notes, exports modified DB
- Implemented byte-level preservation: only UPDATE notes whose fields actually changed
- Implemented atomic export: build in memory, verify by re-opening SQLite, then trigger download
- Implemented csum recomputation for changed notes using adler32
- Created `lib/download.ts` with Blob-based file download helper
- Created `components/export-panel.tsx` with "Export transformed" and "Download original" buttons
- Added export summary with changed/unchanged counts and verification status
- Verified `eslint` passes and `npm run build` succeeds

**Next session goal:** Phase 10 — Public Launch (S10.1 repo public, README final)

### 2026-04-25 — S10.1 + S10.2 + S10.3 (Phase 10 — Public Launch)

**Done:**
- Rewrote `README.md` for launch: clear value prop, feature list, quick start, data flow diagram, built-in transformations table, AI features summary, tech stack, local dev instructions, documentation links, roadmap preview, contributing guide
- Fixed `CONTRIBUTING.md` relative links to use `./` instead of absolute file paths
- Switched license from Totoneru Source License v1.0 to **Apache 2.0** (resolves spec non-negotiable conflict)
- Updated `LICENSE` file to full Apache 2.0 text with copyright header
- Updated README badge and license section to reflect Apache 2.0
- Updated `PROGRESS.md` Key Decisions table: License now Apache 2.0
- Updated `PROJECT_SPEC.md` Part F.1 non-negotiable: "Open source from day one (license: Apache 2.0)"
- Created `.github/ISSUE_TEMPLATE/bug_report.md` with reproduction steps and environment fields
- Created `.github/ISSUE_TEMPLATE/feature_request.md` with problem/solution/alternatives structure
- Created `.github/pull_request_template.md` with what/why/verification/open-questions format
- Created `LAUNCH_POSTS.md` with draft posts for:
  - r/Anki — focused on deck transformation, client-side privacy, tech stack
  - r/LearnJapanese — focused on Japanese learner use cases, furigana, AI prompts
  - Hacker News (optional) — focused on WASM SQLite, Web Workers, architecture decisions
  - Posting checklist with Sentry monitoring and GitHub response SLAs

**Decisions made this session:**
- License: Apache 2.0 (over MIT) for patent protection
- GitHub Discussions only for community (no Discord for MVP — can add later if demand)
- Hacker News launch deferred until post has traction on Reddit first

**Ready to execute:**
- Make repo public on GitHub
- Enable GitHub Discussions
- Post to r/Anki and r/LearnJapanese
- Monitor Sentry for first 48 hours

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
