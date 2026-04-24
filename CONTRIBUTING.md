# Contributing to totoneru

Thanks for helping build totoneru.

This project is intentionally scoped and opinionated. Before changing code, read the current state and constraints first:

- [PROGRESS.md](./PROGRESS.md) for what is done and what comes next
- [PROJECT_SPEC.md](./PROJECT_SPEC.md) for product and architecture rules
- [agents.md](./agents.md) for repo-wide execution guidelines

## Ground rules

- Keep deck data and API keys client-side only
- Respect the data / behavior / presentation layer split
- Keep changes surgical
- Build the minimum code that solves the current phase goal
- Do not silently expand scope

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.local.example` to `.env.local`.
3. Start the app with `npm run dev`.

Sentry and PostHog credentials are optional for local work.

## Before opening a PR

Run the required checks:

- `npm run typecheck`
- `npx eslint . --max-warnings 0`
- `npm run build`

If your change touches docs or progress tracking, update those files in the same branch.

## Workflow expectations

- Read the current phase goal before coding
- Define the success condition in a way that can be verified
- Prefer tests or reproducible checks when fixing bugs
- Match the existing style and patterns unless the current task explicitly calls for change
- Do not refactor unrelated code while working on a focused task

## Architecture constraints

These are not optional:

- Auto-backup on every import
- Dry-run before bulk apply
- Transactional writes until explicit user confirmation
- Reject unsupported Anki schema versions with a clear error
- No auth in MVP
- No analytics without opt-in

## Pull request notes

Helpful PRs usually include:

- what changed
- why it changed
- how you verified it
- any open questions or follow-up work

## Documentation to keep updated

If your change alters project state or contributor expectations, update the relevant file:

- `PROGRESS.md` for roadmap and session status
- `README.md` for product positioning and setup
- `CONTRIBUTING.md` for contributor workflow
- `CLAUDE.md` or `agents.md` when repo guidance changes
