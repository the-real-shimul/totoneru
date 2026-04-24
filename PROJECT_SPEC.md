# totoneru — Project Specification & Implementation Brief

> A visual transformation and controlled editing system for Anki decks, targeted at intermediate-to-advanced Japanese learners. Open source. Bring-your-own AI API key. Client-side first.

---

## 0. How to Use This Document

This file is the single source of truth for totoneru. It contains:

- **Part A:** Product specification (what to build and why)
- **Part B:** Technical architecture
- **Part C:** MVP scope (every item is committed, do not cut)
- **Part D:** Implementation roadmap (phased, buildable tasks)
- **Part E:** Future feature list (Tier 1 roadmap + Tier 2 ideas)
- **Part F:** Non-negotiables and known limitations

When in doubt, prefer simplicity in the default UI and put power behind progressive disclosure. The user should feel the tool is *finished*, not perpetually in beta.

---

# PART A — PRODUCT SPECIFICATION

## A.1 One-Sentence Value Proposition

> Import any Anki deck, transform it visually or via custom AI prompts, and export a clean `.apkg` back to Anki — all in the browser, with your data never leaving your machine.

## A.2 Target User

Intermediate-to-advanced Japanese language learners who:

- Use Anki as their primary SRS tool
- Work with community decks (Kaishi 1.5k, Core series, mined decks)
- Are frustrated by rigid card layouts and the difficulty of bulk editing
- Are technical enough to paste an AI API key but want a clean UI, not a CLI
- Value open source, local-first software

## A.3 Core Philosophy

1. **Separate data, behavior, and presentation.** Users should control each independently.
2. **Simple UI, powerful escape hatches.** Advanced settings exist but never block the default path.
3. **Client-side first.** The user's deck never touches a server unless they explicitly opt in.
4. **Trust through transparency.** Open source, visible API call paths, auto-backup on every import.
5. **Finished-feeling product.** Not a perpetual roadmap of 50 features — a confident, scoped tool.

## A.4 Core Problem Being Solved

Anki decks are:

- Stored as SQLite databases (fields, notes, note types, templates)
- Rendered with HTML/CSS templates and optional JavaScript
- Shared as `.apkg` files (zipped archive of SQLite + media)

This creates friction:

- Editing requires HTML/CSS knowledge and tool-switching
- Bulk transformations are painful or impossible without add-ons
- Data, layout, and behavior are mixed together
- No portable way to normalize decks across sources

totoneru is a pre-processing layer that sits between the user and Anki, removing this friction.

## A.5 What This Product Is NOT

- Not a replacement for Anki
- Not a scheduler / SRS engine
- Not an account-based SaaS
- Not a collaborative / cloud-first product (at least in MVP)
- Not a general-purpose Anki tool — the focus is Japanese learners first

---

# PART B — TECHNICAL ARCHITECTURE

## B.1 Architecture Overview

**Client-side-first web application.** Nearly all compute runs in the browser. The only server-side code is minimal (optional analytics, static hosting). The user's deck and API key never touch our servers.

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│                                                      │
│  ┌─────────────┐   ┌──────────────┐  ┌────────────┐ │
│  │  Next.js UI │──▶│ Web Workers  │─▶│ sql.js     │ │
│  │  (React)    │   │ (parsing,    │  │ (WASM)     │ │
│  │             │   │  tokenizing) │  └────────────┘ │
│  └──────┬──────┘   └──────────────┘                 │
│         │                                            │
│         ▼                                            │
│  ┌─────────────┐   ┌──────────────┐                 │
│  │  IndexedDB  │   │ kuromoji.js  │                 │
│  │  (decks,    │   │ (furigana)   │                 │
│  │   prompts,  │   └──────────────┘                 │
│  │   backups,  │                                     │
│  │   keys)     │                                     │
│  └─────────────┘                                     │
│         │                                            │
│         └────────────────▶ User's AI provider ──┐   │
│                            (Groq/OpenAI/Claude/ │   │
│                             OpenRouter/local)   │   │
└─────────────────────────────────────────────────┼───┘
                                                  │
                                      (direct, no proxy)
```

## B.2 Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 15 (App Router) + TypeScript | Mature, free hosting via Vercel, good DX |
| Styling | Tailwind CSS | Lean, no component-library bloat |
| UI primitives | Radix UI | Headless, accessible, no visual lock-in |
| State | React state + Zustand (if needed) | Avoid global state library until required |
| `.apkg` parsing | `jszip` + `sql.js` (SQLite WASM) | Handles zip + SQLite entirely in-browser |
| Japanese tokenization | `kuromoji.js` | Runs offline, no API cost, well-tested |
| Heavy work | Web Workers | Prevents UI jank on large decks |
| Client storage | IndexedDB via `idb` | Handles large binary data (decks, backups) |
| AI calls | Direct fetch from browser to user's endpoint | OpenAI-compatible API adapter covers most providers |
| Hosting | Vercel free tier | Near-zero cost at 10k MAU |
| Error tracking | Sentry free tier | Non-negotiable for production |
| Analytics | PostHog free tier (opt-in) | Privacy-friendly |
| CI/CD | GitHub Actions | Free for public repos |

**Deliberately not using:**

- No ORM (raw SQL via sql.js is simpler)
- No component library like MUI/Chakra
- No serverless functions for AI (browser → provider direct)
- No auth in MVP

## B.3 Three-Layer Internal Model

Every deck operation treats the deck as three layers:

1. **Data layer:** notes, fields, tags (the content)
2. **Behavior layer:** reveal logic, timing, interaction patterns (when/how content appears)
3. **Presentation layer:** HTML/CSS layout, styling (how content looks)

Transformations target specific layers. Never modify layers the user didn't explicitly touch.

## B.4 Supported AI Provider Endpoints

The AI client uses an **OpenAI-compatible adapter** by default, which covers:

- OpenAI
- Groq
- OpenRouter
- Together
- Fireworks
- DeepSeek
- Local Ollama / LM Studio

A second adapter is included for **Anthropic's native API** (different request shape).

Users paste their endpoint URL, API key, and model name. Keys are stored in IndexedDB, never sent to our servers. UI masks the key by default.

---

# PART C — MVP SCOPE (COMMITTED, DO NOT CUT)

Every item below ships in v1.0. No deferrals.

## C.1 Deck Import & Parsing

- Accept `.apkg` files via drag-and-drop and file picker
- Unzip in browser (jszip)
- Parse SQLite (sql.js) entirely client-side
- Extract: notes, fields, note types, card templates, media, tags
- Detect Anki schema version; support `collection.anki21b` (current). Reject older with clear error message.
- Build internal structured representation of deck

## C.2 Automatic Backup System

- On every import, auto-save the original `.apkg` to IndexedDB under `backups:`
- Persistent "Restore original" button always visible during editing
- Backup retained until user explicitly deletes it
- Show backup size and timestamp in UI

## C.3 AI-Assisted Schema Mapping

- Detect likely field roles (word, reading, meaning, sentence, audio)
- Show suggestions with confidence indicators
- User can edit mappings via drag-and-drop
- Target: under 10 seconds from import to mapped

## C.4 Template System

Two initial templates, each with layout + field mapping + transformation logic:

- **Vocabulary Template:** word, reading (furigana), meaning, example sentence
- **Sentence Template:** sentence (JP), translation, key expression highlight

## C.5 Transformation Engine

Built-in transformations:

- Furigana generation (kuromoji.js, Web Worker)
- HTML cleaning / normalization
- Field normalization
- AI enrichment: example sentence generation, meaning clarification

All transformations respect layer boundaries (never modify fields the user didn't target).

## C.6 Custom AI Prompts + BYO API Key

- Endpoint URL + API key + model name input (key masked by default)
- OpenAI-compatible adapter by default; Anthropic adapter as option
- Custom prompt editor with variable interpolation (`{{word}}`, `{{reading}}`, etc.)
- Prompt library: 3-5 curated starter prompts, plus user-saved prompts (stored in IndexedDB)
- Output sanitizer (strips markdown fences, validates shape)

## C.7 Visual Transformation Preview

Split-pane interface:

- **Left:** original card (raw)
- **Right:** transformed card (live)
- Real-time updates as transformation changes
- Support for multiple sample cards (cycle through 5 by default)
- Visual highlight of changes

## C.8 Dry-Run Before Bulk Apply

- Mandatory dry-run on 5 sample cards before bulk apply is enabled
- Diff view per card
- User must confirm dry-run results to unlock bulk apply

## C.9 Controlled Visual Block Editor

Block components: word, reading, meaning, sentence, audio.

User can:

- Reorder blocks (drag-and-drop)
- Toggle visibility
- Apply styling (font size, color, emphasis)

Block editor sits behind progressive disclosure — default path doesn't require it.

## C.10 Behavior Control System

Expose behavior as structured toggles, not raw CSS/JS:

- Furigana visibility: always / reveal on flip / reveal after delay / reveal on hover
- Translation visibility: (same pattern)
- Additional behavior toggles as needed

Generated card JS/CSS must be validated as safe and must render consistently on Anki desktop and AnkiWeb. (Mobile support explicitly deferred.)

## C.11 Transactional Transformation

- All transformations stage changes in memory + IndexedDB
- Never mutate the canonical deck until user confirms
- Support abort mid-batch with clean rollback
- Per-card error isolation: one failed card doesn't kill the batch
- Clear reporting of which cards failed and why
- Retry-failed-only option

## C.12 Rate Limit & Error Handling

- Exponential backoff on 429 / 5xx errors
- Cost estimator before bulk runs (rough token count × model pricing)
- Hard spend cap the user can set (abort batch if exceeded)
- Progress bar with abort button
- Resumable batches (pick up where interrupted)

## C.13 Virtualized Card Browser

- Use `react-window` or equivalent for the card list
- Supports decks of 20,000+ cards without UI freeze
- "Limit to N cards" option for bulk operations

## C.14 Export System

- Export back to `.apkg` with atomic write (build in temp, verify, finalize)
- Preserve all fields, templates, media
- Preserve byte-level fidelity for anything the user didn't touch
- Auto-export original `.apkg` alongside transformed version (second download)
- Optional: include recommended Anki settings as a sidecar file

## C.15 Trust & Transparency

- README with clear explanation of architecture
- One-page `/how-it-works` route explaining data flow
- Link to exact file in repo where API calls originate
- No analytics without explicit opt-in

## C.16 Production Infrastructure

- Sentry error tracking (free tier)
- PostHog analytics, opt-in only
- Public GitHub Discussions for community Q&A
- Changelog maintained in repo
- Status page (can be a simple README badge or Vercel status)

---

# PART D — IMPLEMENTATION ROADMAP

Each phase is independently shippable. Do not start the next phase until the current one is production-quality.

## Phase 0 — Foundation (Week 1-2)

**Goal:** Boilerplate and dev environment.

- [ ] Scaffold Next.js 15 + TypeScript + Tailwind project
- [ ] Configure ESLint, Prettier, strict TS
- [ ] Set up GitHub repo with `main` branch protection
- [ ] Configure Vercel preview deployments on PRs
- [ ] Add Sentry integration
- [ ] Add PostHog (opt-in wrapper)
- [ ] Set up basic app shell (header, main content, footer)
- [ ] Write initial README (positioning, how it works, data flow)
- [ ] Create CONTRIBUTING.md

## Phase 1 — Deck Parsing (Week 3-4)

**Goal:** Load a deck and display its contents.

- [ ] Integrate `jszip` and `sql.js`
- [ ] Build `.apkg` parser in a Web Worker
- [ ] Parse notes, fields, note types, templates, media
- [ ] Detect schema version; gate on `collection.anki21b`
- [ ] Display deck stats (note type count, card count, media count)
- [ ] Build virtualized card browser (`react-window`)
- [ ] Store parsed deck in IndexedDB (via `idb`)
- [ ] Auto-backup original `.apkg` on import

## Phase 2 — Preview & Rendering (Week 5-6)

**Goal:** Render cards visually with original fidelity.

- [ ] Render card HTML in sandboxed iframe (preserve Anki's templating)
- [ ] Build split-pane original-vs-transformed preview
- [ ] Support cycling through 5 sample cards
- [ ] Implement diff highlighting between original and transformed

## Phase 3 — Schema Mapping & Templates (Week 7-8)

**Goal:** Let the user identify what each field means.

- [ ] Build schema detection logic (heuristics + optional AI assist)
- [ ] Drag-and-drop field mapping UI
- [ ] Confidence indicators on suggestions
- [ ] Define Vocabulary and Sentence template types
- [ ] Apply mappings to internal representation

## Phase 4 — Built-In Transformations (Week 9-10)

**Goal:** Useful transformations that don't require an AI key.

- [ ] Integrate `kuromoji.js` in a Web Worker; lazy-load dictionary
- [ ] Cache dictionary in IndexedDB after first load
- [ ] Implement furigana generation
- [ ] Implement HTML cleaner / normalizer
- [ ] Implement field normalizer
- [ ] Wire transformations through the preview system

## Phase 5 — AI Integration (Week 11-13)

**Goal:** Custom prompts with BYO key.

- [ ] Build OpenAI-compatible API client
- [ ] Add Anthropic native API adapter
- [ ] API key input UI with masking
- [ ] Endpoint / model configuration
- [ ] Custom prompt editor with variable interpolation
- [ ] Prompt library UI (save/load/delete)
- [ ] Ship 3-5 curated starter prompts
- [ ] Output sanitizer (strip fences, validate shape)
- [ ] Cost estimator (token count × pricing)
- [ ] Hard spend cap per batch

## Phase 6 — Dry-Run & Transactional Batches (Week 14-15)

**Goal:** Safe, reliable bulk operations.

- [ ] Dry-run flow on 5 sample cards
- [ ] Diff view per card
- [ ] Block bulk apply until dry-run confirmed
- [ ] Stage all changes in IndexedDB before commit
- [ ] Per-card error isolation
- [ ] Exponential backoff on rate limits / 5xx
- [ ] Progress bar + abort button
- [ ] Retry-failed-only option
- [ ] Resumable batches across tab close/reopen

## Phase 7 — Block Editor & Behavior Controls (Week 16-18)

**Goal:** Visual card layout editing with progressive disclosure.

- [ ] Block editor UI (word, reading, meaning, sentence, audio blocks)
- [ ] Drag-and-drop reorder
- [ ] Visibility toggles
- [ ] Basic styling controls (font size, color, emphasis)
- [ ] Behavior toggles (furigana reveal modes, etc.)
- [ ] Generate safe JS/CSS for card templates
- [ ] Validate rendering on Anki desktop + AnkiWeb

## Phase 8 — Export & Finalization (Week 19-20)

**Goal:** Round-trip the deck back to Anki.

- [ ] Atomic `.apkg` export (temp build → verify → finalize)
- [ ] Preserve byte-level fidelity for untouched fields
- [ ] Media hash verification on export
- [ ] Second download button for original `.apkg`
- [ ] Optional sidecar file with recommended Anki settings

## Phase 9 — Polish & Trust (Week 21-22)

**Goal:** Feels finished, inspires trust.

- [ ] `/how-it-works` page
- [ ] Onboarding flow (briefly surfaces advanced capabilities)
- [ ] Keyboard shortcut cheat sheet
- [ ] Prompt cookbook documentation
- [ ] Accessibility audit (Radix helps but verify)
- [ ] Performance audit on a 20k-card deck
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Final Sentry / PostHog review

## Phase 10 — Public Launch (Week 23+)

- [ ] Publish repo publicly
- [ ] Open GitHub Discussions
- [ ] Post to r/Anki, r/LearnJapanese with clear scope claims
- [ ] Monitor Sentry closely for first two weeks
- [ ] Community poll for Tier 1 roadmap prioritization

---

# PART E — FUTURE FEATURES

## E.1 Tier 1 — Probable Next Features (public roadmap, community poll candidates)

1. **Advanced HTML/CSS editing layer** — scoped editing inside blocks, sandboxed rendering, validation
2. **Data enrichment layer** — JMdict / Jisho API integration for automatic synonyms, antonyms, JLPT classification
3. **Deck analysis system** — explain deck before editing (missing fields, inconsistent structure, optimization suggestions)
4. **SRS preset generator** — high-retention, balanced, low-workload presets that emit recommended Anki config
5. **Batch transformation workflows** — convert entire deck to cloze, add furigana across all cards, normalize multiple decks

## E.2 Tier 2 — Ideas List (internal, not promised)

- Advanced behavior engine (conditional rendering, multi-stage reveals, interactive hints)
- Full template builder (custom templates from scratch, reusable library)
- AI transformation pipelines (multi-step, user-defined chains)
- Multi-deck normalization (merge, resolve conflicts, unify schema)
- Plugin compatibility layer (detect add-on dependencies, replicate without plugins)
- Versioning and rollback beyond last-action undo
- Collaborative / cloud features (shared presets, team editing)
- Mobile support
- Non-Japanese language support

---

# PART F — NON-NEGOTIABLES & KNOWN LIMITATIONS

## F.1 Non-Negotiables

- Client-side first — no server-side storage of user decks or API keys, ever
- Auto-backup on every import
- Dry-run required before bulk apply
- Transactional batches with per-card error isolation
- Open source from day one (license: MIT or Apache 2.0, decide before launch)
- Sentry error tracking in production
- No analytics without opt-in
- Key masking by default in UI

## F.2 Known Limitations (v1)

- Desktop browsers only (mobile explicitly deferred)
- Japanese-focused (non-Japanese decks may work but are not tested)
- `collection.anki21b` only (older Anki versions rejected with clear message)
- AnkiMobile rendering parity not guaranteed (desktop + AnkiWeb are the targets)
- Behavior features involving hover do not apply on touch-only clients

## F.3 Known Risks

- **Prompt reliability on Japanese content.** Mitigations: dry-run default, diff view, documented model recommendations, uncertainty-flagging in prompts.
- **AI provider breakage.** Mitigations: abstracted adapter, users can switch providers trivially.
- **Large deck performance.** Mitigations: Web Workers, virtualization, IndexedDB staging.
- **Deck corruption.** Mitigations: auto-backup, transactional commits, atomic exports, byte-level preservation of untouched data.

---

# PART G — STICKINESS & COMMUNITY STRATEGY

This tool succeeds long-term if it becomes *the* canonical answer to "how do I transform my Anki deck with AI."

## G.1 Principles

- Feel finished, not perpetually beta
- Small, opinionated core; slow feature growth
- Resist feature creep even when polls demand it
- Invest disproportionately in documentation
- Build a community where users teach users

## G.2 Concrete Investments

- **Prompt cookbook:** curated, high-quality prompt examples with explanations. Grow via community PRs.
- **GitHub Discussions:** open from day one; tag maintainers sparingly
- **Changelog:** every release, no exceptions
- **Naming:** short, specific, easy to use in a sentence ("I used [X] on my deck")
- **Canonical positioning:** explicit in README — "the tool for AI-powered Anki deck transformation for Japanese learners"

---

# PART H — OPEN QUESTIONS (to resolve before or during Phase 0)

- [x] Final project name → **totoneru**
- [x] License → **Totoneru Source License v1.0** (source-available, non-commercial)
- [ ] Domain name → buying later
- [x] Featured adapter in onboarding → **OpenAI-compatible** (Anthropic available as secondary)
- [ ] Color/typography direction for UI (Radix leaves this open)
- [ ] Whether to ship a `how to contribute a prompt` template in Phase 5 or later

---

# PART I — VIBE-CODING EXECUTION PLAN

> This section covers how to actually build totoneru using Claude Code and/or OpenCode with model routing. Replaces traditional timeline estimates with realistic vibe-coding ones, breaks work into sessions, recommends which model to use for which task, and covers memory/context strategies.

## I.1 Honest Timeline (Vibe Coding)

Vibe coding speeds up writing code. It does not speed up testing, debugging subtle bugs, deciding what to build, or learning unfamiliar APIs. The compression is real but not magical.

| Phase | Traditional | Full-time vibe coding | Part-time (~10 hrs/week) |
|---|---|---|---|
| 0. Foundation | 2 weeks | 1-2 days | 1 week |
| 1. Deck parsing | 2 weeks | 3-5 days | 2 weeks |
| 2. Preview & rendering | 2 weeks | 4-7 days | 2-3 weeks |
| 3. Schema mapping & templates | 2 weeks | 1 week | 3 weeks |
| 4. Built-in transformations | 2 weeks | 3-5 days | 2 weeks |
| 5. AI integration | 3 weeks | 1 week | 3 weeks |
| 6. Dry-run & transactional batches | 2 weeks | 1.5 weeks | 4 weeks |
| 7. Block editor & behavior controls | 3 weeks | 2-3 weeks | 6-8 weeks |
| 8. Export & finalization | 2 weeks | 3-5 days | 2 weeks |
| 9. Polish & trust | 2 weeks | 3-5 days | 1-2 weeks |
| 10. Launch | — | 1 week | 2 weeks |
| **Total** | **22 weeks** | **10-13 weeks** | **5-8 months** |

Phases 6 and 7 barely compress because correctness and cross-client rendering parity require real Anki testing, not code generation. Budget conservatively there.

## I.2 Session-Based Work Plan

Each session is 2-4 focused hours with a clear goal and a single scope. Start each session by loading `CLAUDE.md` and a task-specific context file. End each session by updating the task log. Keep sessions small — long sessions burn context and produce drift.

### Phase 0 — Foundation (4 sessions)

- **S0.1 Scaffold** — Next.js 15 + TypeScript + Tailwind + ESLint + Prettier. Deploy to Vercel.
- **S0.2 Observability** — Sentry, PostHog (opt-in), GitHub Actions CI.
- **S0.3 Shell** — App layout, routing, basic navigation, dark mode.
- **S0.4 Docs** — README, CONTRIBUTING, LICENSE, initial CLAUDE.md.

### Phase 1 — Deck Parsing (5 sessions)

- **S1.1 jszip + sql.js setup** — Lazy-load WASM, verify basic unzip works.
- **S1.2 SQLite reader** — Extract notes, fields, note types.
- **S1.3 Templates + media** — Parse card templates and media manifest.
- **S1.4 Schema detection** — Identify `collection.anki21b`, gate older versions.
- **S1.5 Web Worker migration** — Move parsing off the main thread. Auto-backup on import.

### Phase 2 — Preview & Rendering (4 sessions)

- **S2.1 Card browser** — Virtualized list with react-window.
- **S2.2 Card renderer** — Sandboxed iframe with template rendering.
- **S2.3 Split-pane preview** — Original vs transformed side-by-side.
- **S2.4 Diff highlighting** — Visual diff between original and transformed.

### Phase 3 — Schema Mapping & Templates (4 sessions)

- **S3.1 Heuristic detection** — Field role detection by name + content heuristics.
- **S3.2 Mapping UI** — Drag-and-drop, confidence badges.
- **S3.3 Template definitions** — Vocabulary and Sentence templates.
- **S3.4 Apply mappings** — Wire mappings into internal representation.

### Phase 4 — Built-In Transformations (4 sessions)

- **S4.1 kuromoji.js integration** — Web Worker, dictionary lazy-load + cache.
- **S4.2 Furigana generation** — First useful transformation.
- **S4.3 HTML cleaner** — Strip unwanted tags, normalize structure.
- **S4.4 Field normalizer** — Whitespace, encoding, consistency.

### Phase 5 — AI Integration (6 sessions)

- **S5.1 OpenAI-compatible client** — Base adapter, supports any OpenAI-shaped API.
- **S5.2 Anthropic adapter** — Native Anthropic API support.
- **S5.3 Key management UI** — Masked input, IndexedDB storage, endpoint picker.
- **S5.4 Prompt editor** — Variable interpolation, preview.
- **S5.5 Prompt library** — Save/load/delete, ship 3-5 curated prompts.
- **S5.6 Output sanitizer + cost estimator** — Token counting, spend cap UI.

### Phase 6 — Dry-Run & Transactional Batches (6 sessions)

- **S6.1 Dry-run flow** — 5-card sample, diff view, block bulk until confirmed.
- **S6.2 Staged transactions** — All changes in IndexedDB before commit.
- **S6.3 Per-card error isolation** — One failure doesn't kill the batch.
- **S6.4 Rate limit handling** — Exponential backoff on 429 and 5xx.
- **S6.5 Progress + abort** — Progress bar, abort button, retry-failed-only.
- **S6.6 Resumable batches** — Survive tab close, resume on reopen.

### Phase 7 — Block Editor & Behavior Controls (8 sessions)

- **S7.1 Block model** — Data structure for word/reading/meaning/sentence/audio blocks.
- **S7.2 Block editor UI** — Drag-and-drop reorder, visibility toggles.
- **S7.3 Styling controls** — Font size, color, emphasis.
- **S7.4 Behavior model** — Reveal modes (always, on flip, delay, hover).
- **S7.5 JS/CSS generator** — Emit safe Anki-compatible template code.
- **S7.6 Anki desktop parity test** — Manual testing cycle on real Anki.
- **S7.7 AnkiWeb parity test** — Manual testing cycle on AnkiWeb.
- **S7.8 Validation + error reporting** — Detect incompatible configurations early.

### Phase 8 — Export & Finalization (4 sessions)

- **S8.1 Atomic export** — Build in temp, verify, finalize.
- **S8.2 Byte-level preservation** — Untouched fields pass through unchanged.
- **S8.3 Media verification** — Hash check on export.
- **S8.4 Original + transformed download** — Dual export flow.

### Phase 9 — Polish & Trust (5 sessions)

- **S9.1 /how-it-works page** — Trust doc.
- **S9.2 Onboarding flow** — Surface advanced features briefly.
- **S9.3 Prompt cookbook** — Documentation with real examples.
- **S9.4 Accessibility audit** — Radix helps, verify with axe.
- **S9.5 Performance pass** — Test on 20k-card deck, profile, optimize.

### Phase 10 — Launch (3 sessions)

- **S10.1 Repo public, README final** — License, badges, clear positioning.
- **S10.2 Discussions open, community channels** — GitHub Discussions + optional Discord.
- **S10.3 Launch post** — r/Anki, r/LearnJapanese, Hacker News if confident.

**Total: ~53 focused sessions.** At 2 sessions per week part-time, that's ~26 weeks. At 5 per week full-time, ~11 weeks. Matches the earlier timeline estimate.

## I.3 Model Routing — Which Model for Which Task

The rule: **use the cheapest model that reliably completes the task.** Escalate only when you hit a ceiling.

| Task type | Primary model | Fallback | Reasoning |
|---|---|---|---|
| Scaffolding, boilerplate | Sonnet 4.6 | Haiku 4.5 | Well-documented patterns, fast + cheap |
| Standard feature implementation | Sonnet 4.6 | Opus 4.7 | Default workhorse |
| Architecture decisions, tricky design | Opus 4.7 | Sonnet 4.6 + thinking | Use max intelligence when stakes are high |
| Hard debugging (race conditions, WASM issues) | Opus 4.7 | Kimi K2.6 (thinking mode) | Reasoning-heavy tasks |
| Long-horizon refactors (13+ hour runs) | Kimi K2.6 | Opus 4.7 | K2.6 optimized for sustained sessions |
| Read-only exploration (file search, summarize) | Haiku 4.5 | Sonnet 4.6 | Cheap + fast for bounded tasks |
| Test generation | Sonnet 4.6 | Haiku 4.5 | Template-like, Sonnet handles it |
| Documentation writing | Sonnet 4.6 | Haiku 4.5 | Language quality matters but not reasoning |
| Code review / PR review subagent | Sonnet 4.6 | Opus 4.7 | Balance between cost and catching real issues |
| Frontend design / UI generation | Kimi K2.6 | Sonnet 4.6 | K2.6 benchmarked strongly on frontend |
| Simple one-off file edits | Haiku 4.5 | Sonnet 4.6 | Minimize cost on trivial work |

**Important caveat on Haiku 4.5:** it has zero prompt injection protection. Do not let it process untrusted input (user-uploaded deck content sent through it without sanitization). Keep Haiku on internal read-only tasks.

**Phase-by-phase default model:**

- Phases 0-1: Sonnet 4.6 (boilerplate and parsing patterns)
- Phase 2: Sonnet 4.6 (standard React)
- Phase 3: Sonnet 4.6, escalate to Opus 4.7 for heuristic design
- Phase 4: Sonnet 4.6
- Phase 5: Sonnet 4.6 (API adapters are well-trodden)
- Phase 6: **Opus 4.7** (correctness matters, subtle bugs expensive)
- Phase 7: **Opus 4.7** for generator design, Sonnet 4.6 for UI work, manual testing required regardless
- Phase 8: Sonnet 4.6, escalate on bugs
- Phase 9: Sonnet 4.6 for docs, Kimi K2.6 for any major UI polish
- Phase 10: Sonnet 4.6 / Haiku 4.5 for launch materials

## I.4 Should You Use Agent Swarms / Multi-Agent Setups?

**Short answer: no, not for this project in MVP.** Use subagents (Claude Code's built-in feature), not swarms.

**The distinction:**

- **Subagents** run in an isolated context window for a bounded task (e.g., code review, codebase exploration) and return a summary. Built into Claude Code. Low overhead. Use them.
- **Agent swarms** (Kimi K2.6 can scale to 300 sub-agents, multi-agent frameworks, orchestrator patterns) spawn many agents working in parallel on decomposed tasks. High overhead, high coordination cost, and failure modes are harder to debug.

**Why swarms are wrong for MVP:**

1. Your bottleneck is *design decisions and testing*, not parallel code generation. 10 agents writing code doesn't help if you haven't decided the block-editor data model.
2. Swarm outputs are harder to review. You lose the tight "prompt → read → verify → commit" loop that keeps vibe coding safe.
3. Token costs balloon fast. A 13-hour swarm run can cost more than a week of careful sequential work.
4. For a solo developer, swarm coordination overhead exceeds the speedup except on unusually parallel tasks.

**When swarms would be worth revisiting (post-MVP):**

- Large codebase refactors (e.g., renaming types across 200 files)
- Running the entire test suite + fixing all failures autonomously
- Batch migration of prompt library entries
- Generating docs for every module in parallel

**Recommended subagent setup for this project:**

Create these in `.claude/agents/`:

- `repo-explorer` (Haiku 4.5) — read-only, finds files and summarizes
- `pr-reviewer` (Sonnet 4.6) — reviews diffs before commit, flags issues
- `doc-writer` (Sonnet 4.6) — writes JSDoc and README sections
- `test-writer` (Sonnet 4.6) — generates unit tests for specific modules
- `anki-tester` (Opus 4.7) — specialized for reviewing generated Anki template code

Each one runs in its own context window, preserving the main session for high-value work.

## I.5 Using OpenCode + Kimi K2.6 Alongside Claude Code

This is a practical multi-tool setup. Each tool has different strengths.

**When to use which tool:**

| Work type | Tool | Model |
|---|---|---|
| Primary development (default) | Claude Code | Sonnet 4.6 / Opus 4.7 |
| Long-horizon autonomous runs (overnight refactors) | OpenCode | Kimi K2.6 |
| Experimenting with free/cheap models | OpenCode | Local models via LM Studio |
| Frontend design iterations | OpenCode | Kimi K2.6 |
| Quick exploration of unfamiliar libraries | OpenCode | Kimi K2.6 (cheap) |
| Production-critical code (Phase 6, 7) | Claude Code | Opus 4.7 |

**The workflow:**

1. **Keep the source of truth in one repo.** Both tools operate on the same Git repo. Commit often so you can undo disaster runs.

2. **Shared context files.** Put `CLAUDE.md`, `.cursorrules`, or equivalent in the repo root. OpenCode reads context differently but supports `.opencode/context/project/` for team patterns. Mirror the same rules across both tools (or symlink).

3. **Keep sessions non-overlapping.** Don't run Claude Code and OpenCode on the same files simultaneously. Pick one tool per task, commit, switch.

4. **Use OpenCode's `/undo` liberally.** If a Kimi K2.6 run produces something weird, undo fast. Claude Code lacks this — rely on `git` there.

5. **Route tasks by strength:**
   - Architecture + correctness-critical code: Claude Code with Opus 4.7
   - Bulk refactors, long-running tasks, exploratory UI work: OpenCode with Kimi K2.6
   - Docs and tests: whichever is open
   - Cross-checking: have OpenCode review Claude Code's work on important changes, or vice versa

6. **Manage spend across both.** Both tools can burn money if left unattended. Set hard spend caps in each.

**Concrete config pattern:**

```
totoneru/
├── CLAUDE.md                          # Primary context for Claude Code
├── .opencode/
│   ├── context/
│   │   └── project/
│   │       ├── architecture.md        # Mirrors key CLAUDE.md sections
│   │       ├── patterns.md            # Coding patterns
│   │       └── anki-specifics.md      # Anki-specific quirks
│   └── agents/
│       ├── ui-polisher.md             # Uses Kimi K2.6
│       └── long-refactor.md           # Uses Kimi K2.6
├── .claude/
│   └── agents/
│       ├── pr-reviewer.md             # Uses Sonnet 4.6
│       ├── anki-tester.md             # Uses Opus 4.7
│       └── repo-explorer.md           # Uses Haiku 4.5
└── ... (source code)
```

**Pragmatic warning:** two tools is sometimes more overhead than it saves. If you're solo and on a tight schedule, picking Claude Code only and using its subagent system well may be faster than juggling two CLIs. Only add OpenCode if you have a specific task that Claude Code is bad at or expensive for.

## I.6 Memory Systems to Reduce Token Use

Context bloat is the #1 cause of expensive, slow, confused vibe-coding sessions. Mitigations, in order of impact:

### I.6.1 CLAUDE.md Discipline (Essential)

`CLAUDE.md` loads into every session. Keep it under 2,000 tokens. It should contain:

- The one-sentence value prop
- Architecture constraints (client-side only, no server storage, etc.)
- Tech stack (so Claude doesn't suggest alternatives)
- Coding conventions (naming, file structure, testing approach)
- Known gotchas specific to this project
- A pointer to deeper docs for when needed (not the docs themselves)

Anti-patterns to avoid:

- Dumping the entire spec into CLAUDE.md (it's 10k+ tokens)
- Long lists of "do this, don't do that" without rationale
- Including task status (use a separate task log file)

### I.6.2 Task Logs / Session Memory

Create a `.claude/session-log.md` (or per-phase logs like `.claude/logs/phase-6.md`). At the end of each session, write:

- What got done
- What's in progress
- Decisions made and why
- Open questions

At the start of the next session, Claude reads this and skips re-exploring. Massive token savings.

### I.6.3 Subagents for Bounded Exploration

When a task requires reading many files (e.g., "find all places we handle the field mapping"), use a subagent. It reads those files in its own context window and returns a summary. Your main session only sees the summary, not the file contents.

Rule of thumb: if a task requires reading more than 3-4 files you won't modify, it's a subagent task.

### I.6.4 Skills for Reusable Procedures

Create skills in `.claude/skills/` for repeated workflows:

- `anki-schema.md` — Anki SQLite schema reference, loaded only when needed
- `template-syntax.md` — Anki template syntax rules
- `ai-adapter-pattern.md` — How adapters are structured in this project
- `test-pattern.md` — How tests are structured

These are referenced on demand instead of permanently loaded. Saves thousands of tokens per session.

### I.6.5 Context Editing / Compaction

Claude Code auto-compacts when context fills up. Don't fight it. Instead:

- Start fresh sessions for each new phase/task
- Don't try to keep one session running for hours
- If a session drifts, end it, summarize in the session log, start fresh

Rule of thumb: if you've been in one session for more than 3 hours or 200k tokens, end it.

### I.6.6 The Memory Tool (for agent workflows)

Anthropic's memory tool (client-side file-based) lets agents store and retrieve information across sessions. Overkill for a solo project, but useful if you build automated background workflows post-launch (e.g., a subagent that learns your code patterns over time).

### I.6.7 MCP Servers — Use Sparingly

MCP servers add tools but also add tokens (schemas, descriptions). For this project, the only MCP servers worth considering:

- **GitHub MCP** — only if you do a lot of issue/PR operations from within Claude Code (skip if `gh` CLI works fine)
- **Filesystem MCP** — redundant; Claude Code has file tools
- **Anthropic Memory MCP** — if you build persistent memory later

**Default: no MCP servers.** Add them only when a specific friction appears.

### I.6.8 Concrete Token-Saving Checklist

- [ ] CLAUDE.md under 2,000 tokens
- [ ] Session log maintained per phase
- [ ] 4-6 subagents defined in `.claude/agents/`
- [ ] Skills created for Anki schema, template syntax, adapter pattern
- [ ] No unnecessary MCP servers
- [ ] Sessions end at ~3 hours or 200k tokens
- [ ] Haiku 4.5 used for cheap read-only tasks
- [ ] `git commit` before any risky agentic action

## I.7 Launch-Readiness Checklist (before public release)

- [ ] 20k-card deck imports without UI freeze
- [ ] All 16 MVP sections ship
- [ ] Auto-backup verified on every import
- [ ] Dry-run blocks bulk apply
- [ ] Rate limits handled gracefully
- [ ] Original deck byte-preserved in untouched fields
- [ ] Key masking default on in UI
- [ ] /how-it-works page published
- [ ] Prompt cookbook has 10+ examples
- [ ] Accessibility audit passed
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Sentry error rate under 1% of sessions
- [ ] README + CONTRIBUTING + LICENSE finalized
- [ ] GitHub Discussions open
- [x] License decided → Totoneru Source License v1.0
- [x] Project named → totoneru

---

*End of document.*
