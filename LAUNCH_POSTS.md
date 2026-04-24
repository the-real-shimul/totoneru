# Launch Posts

Draft posts for public launch. Copy, adapt, and post.

---

## r/Anki

**Title:** totoneru — transform your Anki deck in the browser, client-side only

Hey r/Anki,

I built **totoneru**, a tool for reshaping Anki decks without touching a server.

**What it does:**

- Drop an `.apkg`, get field mappings + template suggestions automatically
- Preview original vs transformed cards side-by-side
- Add furigana across your deck with one toggle (kuromoji.js, offline)
- Run AI prompts with your own API key — no proxy, no server storage
- Dry-run on 5 cards before touching the full deck
- Export a clean `.apkg` with only changed notes updated

**The things I care about most:**

- Your deck never leaves your browser (Web Workers + sql.js + IndexedDB)
- Your API key stays in your browser
- Auto-backup on every import
- Transactional writes — stage, review, then export

**Who it's for:** Japanese learners working with community decks (Kaishi, Core, mined) who want cleaner layouts, normalized fields, or AI-generated example sentences without scripting.

**Tech stack:** Next.js, TypeScript, Tailwind, sql.js WASM, kuromoji.js, all client-side.

**Source:** [github.com/the-real-shimul/totoneru](https://github.com/the-real-shimul/totoneru)

**Live:** [totoneru.vercel.app](https://totoneru.vercel.app)

Would love feedback from anyone who tries it. Known limitation: `collection.anki21b` only, desktop browsers.

---

## r/LearnJapanese

**Title:** I built a browser tool to clean up and reformat Anki decks — client-side, open source

Hi r/LearnJapanese,

If you use Anki with Japanese decks and have ever wanted to:

- Bulk-add furigana without Anki add-ons
- Strip messy HTML formatting from shared decks
- Generate example sentences or refine translations with AI
- Preview exactly what changes before applying them

...I built **totoneru** for that.

**How it works:**

1. Import your `.apkg` — the original is backed up locally before anything happens
2. totoneru guesses field roles (expression, reading, meaning, sentence, etc.)
3. Pick a template (Vocabulary or Sentence) or keep your original layout
4. Toggle built-in transformations (furigana, HTML clean, normalizer)
5. Optionally add your OpenAI/Anthropic/etc. API key and run custom prompts
6. Dry-run 5 cards, review the diffs, then apply to all
7. Export a clean `.apkg`

**Privacy:** everything happens in your browser. Deck data and API keys never touch a server.

**Live:** [totoneru.vercel.app](https://totoneru.vercel.app)
**Source:** [github.com/the-real-shimul/totoneru](https://github.com/the-real-shimul/totoneru)

Currently supports `collection.anki21b` on desktop browsers. Happy to answer questions or take feature requests.

---

## Hacker News (optional — post only if confident)

**Title:** Show HN: totoneru — transform Anki decks client-side with WASM SQLite and AI prompts

I built a browser app that imports Anki `.apkg` files, lets you reshape them visually or via AI prompts, and exports them back — all without a backend.

**Stack:**

- `jszip` + `sql.js` (SQLite WASM) in Web Workers for parsing
- `kuromoji.js` for offline Japanese tokenization and furigana
- IndexedDB for backups and staged changes
- Next.js App Router, deployed to Vercel

**Design decisions I care about:**

- No server-side deck or API key storage, ever
- Dry-run on 5 sample cards before any bulk mutation
- Transactional staging — abort, retry failed cards, or discard
- Byte-level preservation: unchanged notes are never touched in the SQLite DB

The furigana generator is my favorite part. It tokenizes Japanese text and wraps kanji in `<ruby>` tags with hiragana readings, entirely offline.

**Live:** [totoneru.vercel.app](https://totoneru.vercel.app)
**Source:** [github.com/the-real-shimul/totoneru](https://github.com/the-real-shimul/totoneru)

Target user: intermediate-to-advanced Japanese learners who use Anki daily and want more control over their deck layout without writing HTML or Python scripts.

---

## Posting checklist

- [ ] r/Anki post live
- [ ] r/LearnJapanese post live
- [ ] Hacker News post (optional)
- [ ] Monitor Sentry for errors in first 48 hours
- [ ] Respond to all GitHub issues within 24 hours for first week
- [ ] Pin a "Tier 1 roadmap poll" in GitHub Discussions after first week
